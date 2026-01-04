import { Gate, GateContext } from './base.js';
import { Failure, Gates } from '../types/index.js';
import { execa } from 'execa';

export class SafetyGate extends Gate {
    constructor(private config: Gates) {
        super('safety-rail', 'Safety & Protection Rails');
    }

    async run(context: GateContext): Promise<Failure[]> {
        const failures: Failure[] = [];
        const safety = this.config.safety || {};
        const protectedPaths = safety.protected_paths || [];

        if (protectedPaths.length === 0) return [];

        try {
            // Check for modified files in protected paths using git
            // This is a "Safety Rail" - if an agent touched these, we fail.
            const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: context.cwd });
            const modifiedFiles = stdout.split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => line.slice(3));

            for (const file of modifiedFiles) {
                if (this.isProtected(file, protectedPaths)) {
                    failures.push(this.createFailure(
                        `Protected file '${file}' was modified.`,
                        [file],
                        `Agents are forbidden from modifying files in ${protectedPaths.join(', ')}.`
                    ));
                }
            }
        } catch (error) {
            // If not a git repo, skip safety for now
        }

        return failures;
    }

    private isProtected(file: string, patterns: string[]): boolean {
        return patterns.some(p => {
            const cleanP = p.replace('/**', '').replace('/*', '');
            if (file === cleanP) return true;
            if (cleanP.endsWith('/')) return file.startsWith(cleanP);
            return file.startsWith(cleanP + '/');
        });
    }
}
