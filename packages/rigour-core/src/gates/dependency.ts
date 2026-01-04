import fs from 'fs-extra';
import path from 'path';
import { Failure, Config } from '../types/index.js';
import { Gate, GateContext } from './base.js';

export class DependencyGate extends Gate {
    constructor(private config: Config) {
        super('dependency-guardian', 'Dependency Guardian');
    }

    async run(context: GateContext): Promise<Failure[]> {
        const failures: Failure[] = [];
        const forbidden = this.config.gates.dependencies?.forbid || [];

        if (forbidden.length === 0) return [];

        const { cwd } = context;

        // 1. Scan Node.js (package.json)
        const pkgPath = path.join(cwd, 'package.json');
        if (await fs.pathExists(pkgPath)) {
            try {
                const pkg = await fs.readJson(pkgPath);
                const allDeps = {
                    ...(pkg.dependencies || {}),
                    ...(pkg.devDependencies || {}),
                    ...(pkg.peerDependencies || {}),
                };

                for (const dep of forbidden) {
                    if (allDeps[dep]) {
                        failures.push(this.createFailure(
                            `The package '${dep}' is forbidden by project standards.`,
                            ['package.json'],
                            `Remove '${dep}' from package.json and use approved alternatives.`
                        ));
                    }
                }
            } catch (e) { }
        }

        return failures;
    }
}
