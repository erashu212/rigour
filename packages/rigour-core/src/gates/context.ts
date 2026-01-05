import { Gate, GateContext } from './base.js';
import { Failure, Gates } from '../types/index.js';
import { FileScanner } from '../utils/scanner.js';
import fs from 'fs-extra';
import path from 'path';

export class ContextGate extends Gate {
    constructor(private config: Gates) {
        super('context-drift', 'Context Awareness & Drift Detection');
    }

    async run(context: GateContext): Promise<Failure[]> {
        const failures: Failure[] = [];
        const record = context.record;
        if (!record || !this.config.context?.enabled) return [];

        const files = await FileScanner.findFiles({ cwd: context.cwd });
        const envAnchors = record.anchors.filter(a => a.type === 'env' && a.confidence >= 1);

        for (const file of files) {
            try {
                const content = await fs.readFile(path.join(context.cwd, file), 'utf-8');

                // 1. Detect Redundant Suffixes (The Golden Example)
                this.checkEnvDrift(content, file, envAnchors, failures);

            } catch (e) { }
        }

        return failures;
    }

    private checkEnvDrift(content: string, file: string, anchors: any[], failures: Failure[]) {
        // Find all environment variable accesses in the content
        const matches = content.matchAll(/process\.env(?:\.([A-Z0-9_]+)|\[['"]([A-Z0-9_]+)['"]\])/g);

        for (const match of matches) {
            const accessedVar = match[1] || match[2];

            for (const anchor of anchors) {
                // If the accessed variable contains the anchor but is not equal to it, 
                // it's a potential "invented" redundancy (e.g. CORE_URL vs CORE_URL_PROD)
                if (accessedVar !== anchor.id && accessedVar.includes(anchor.id)) {
                    const deviation = accessedVar.replace(anchor.id, '').replace(/^_|_$/, '');

                    failures.push(this.createFailure(
                        `Context Drift: Redundant variation '${accessedVar}' detected in ${file}.`,
                        [file],
                        `The project already uses '${anchor.id}' as a standard anchor. Avoid inventing variations like '${deviation}'. Reuse the existing anchor or align with established project patterns.`
                    ));
                }
            }
        }
    }
}
