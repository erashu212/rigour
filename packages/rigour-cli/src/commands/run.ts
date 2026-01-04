import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { execa } from 'execa';
import { GateRunner, ConfigSchema } from '@rigour-labs/core';

// Exit codes per spec
const EXIT_PASS = 0;
const EXIT_FAIL = 1;
const EXIT_CONFIG_ERROR = 2;
const EXIT_INTERNAL_ERROR = 3;

export async function runLoop(cwd: string, agentArgs: string[], options: { iterations: number }) {
    const configPath = path.join(cwd, 'rigour.yml');

    if (!(await fs.pathExists(configPath))) {
        console.error(chalk.red('Error: rigour.yml not found. Run `rigour init` first.'));
        process.exit(EXIT_CONFIG_ERROR);
    }

    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const rawConfig = yaml.parse(configContent);
        const config = ConfigSchema.parse(rawConfig);
        const runner = new GateRunner(config);

        let iteration = 0;
        const maxIterations = isNaN(options.iterations) || options.iterations < 1 ? 3 : options.iterations;

        while (iteration < maxIterations) {
            iteration++;
            console.log(chalk.bold.blue(`\n══════════════════════════════════════════════════════════════════`));
            console.log(chalk.bold.blue(`  RIGOUR LOOP: Iteration ${iteration}/${maxIterations}`));
            console.log(chalk.bold.blue(`══════════════════════════════════════════════════════════════════`));

            // Snapshot changed files before agent runs
            let beforeFiles: string[] = [];
            try {
                const { stdout } = await execa('git', ['status', '--porcelain'], { cwd });
                beforeFiles = stdout.split('\n').filter(l => l.trim()).map(l => l.slice(3).trim());
            } catch (e) { }

            // 1. Run the agent command
            if (agentArgs.length > 0) {
                console.log(chalk.cyan(`\n🚀 DEPLOYING AGENT:`));
                console.log(chalk.dim(`   Command: ${agentArgs.join(' ')}`));
                try {
                    await execa(agentArgs[0], agentArgs.slice(1), { shell: true, stdio: 'inherit', cwd });
                } catch (error: any) {
                    console.warn(chalk.yellow(`\n⚠️  Agent command finished with non-zero exit code. Rigour will now verify state...`));
                }
            }

            // Snapshot changed files after agent runs
            let afterFiles: string[] = [];
            try {
                const { stdout } = await execa('git', ['status', '--porcelain'], { cwd });
                afterFiles = stdout.split('\n').filter(l => l.trim()).map(l => l.slice(3).trim());
            } catch (e) { }

            const changedThisCycle = afterFiles.filter(f => !beforeFiles.includes(f));
            const maxFiles = config.gates.safety?.max_files_changed_per_cycle || 10;

            if (changedThisCycle.length > maxFiles) {
                console.log(chalk.red.bold(`\n🛑 SAFETY RAIL ABORT: Agent changed ${changedThisCycle.length} files (max: ${maxFiles}).`));
                console.log(chalk.red(`   This looks like explosive behavior. Check your agent's instructions.`));
                process.exit(EXIT_FAIL);
            }

            // 2. Run Rigour Check
            console.log(chalk.magenta('\n🔍 AUDITING QUALITY GATES...'));
            const report = await runner.run(cwd);

            if (report.status === 'PASS') {
                console.log(chalk.green.bold('\n✨ PASS - All quality gates satisfied.'));
                console.log(chalk.green(`   Your solution meets the required Engineering Rigour criteria.\n`));
                return;
            }

            // 3. Generate and print Fix Packet for next iteration
            console.log(chalk.red.bold(`\n🛑 FAIL - Found ${report.failures.length} engineering violations.`));

            const fixPacket = report.failures.map((f, i) => {
                let msg = chalk.white(`${i + 1}. `) + chalk.bold.red(`[${f.id.toUpperCase()}] `) + chalk.white(f.title);
                msg += `\n   ├─ ` + chalk.dim(`Details: ${f.details}`);
                if (f.hint) msg += `\n   └─ ` + chalk.yellow(`FIX: ${f.hint}`);
                return msg;
            }).join('\n\n');

            console.log(chalk.bold.white('\n📋 ACTIONABLE FIX PACKET:'));
            console.log(fixPacket);
            console.log(chalk.dim('\nReturning control to agent for the next refinement cycle...'));

            if (iteration === maxIterations) {
                console.log(chalk.red.bold(`\n❌ CRITICAL: Reached maximum iterations (${maxIterations}).`));
                console.log(chalk.red(`   Quality gates remain unfulfilled. Refactor manually or check agent logs.`));
                process.exit(EXIT_FAIL);
            }
        }
    } catch (error: any) {
        console.error(chalk.red(`\n❌ FATAL ERROR: ${error.message}`));
        if (error.issues) {
            console.error(chalk.dim(JSON.stringify(error.issues, null, 2)));
        }
        process.exit(EXIT_INTERNAL_ERROR);
    }
}
