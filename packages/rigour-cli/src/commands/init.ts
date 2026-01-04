import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { DiscoveryService } from '@rigour-labs/core';

export async function initCommand(cwd: string) {
    const discovery = new DiscoveryService();
    const recommendedConfig = await discovery.discover(cwd);

    const configPath = path.join(cwd, 'rigour.yml');

    if (await fs.pathExists(configPath)) {
        console.log(chalk.yellow('rigour.yml already exists. Skipping initialization.'));
        return;
    }

    await fs.writeFile(configPath, yaml.stringify(recommendedConfig));
    console.log(chalk.green('✔ Created rigour.yml'));

    // Create required directories and files
    const requireddocs = recommendedConfig.gates.required_files || [];
    for (const file of requireddocs) {
        const filePath = path.join(cwd, file);
        if (!(await fs.pathExists(filePath))) {
            await fs.ensureFile(filePath);
            console.log(chalk.dim(`  - Created ${file}`));
        }
    }

    // Agent Handshake (Universal / AntiGravity / Cursor)
    const rigourDocsDir = path.join(cwd, 'docs');
    await fs.ensureDir(rigourDocsDir);
    const instructionsPath = path.join(rigourDocsDir, 'AGENT_INSTRUCTIONS.md');

    const ruleContent = `# 🛡️ Rigour: Engineering Excellence Protocol

You are an Elite Software Engineer. You do not just write code that "works"; you write code that is **modular, maintainable, and rigorously verified.**

## 🚦 The Rigour Loop (Mandatory)
Before claiming "Done" for any task, you MUST follow this loop:

1.  **Check**: Run \`npx @rigour-labs/cli check\` to verify compliance.
2.  **Analyze**: If it fails, read \`rigour-report.json\` for exact failure points.
3.  **Refactor**: Apply **SOLID** and **DRY** principles to resolve the violations.
4.  **Repeat**: Continue until \`npx @rigour-labs/cli check\` returns **PASS**.

## 🧩 Engineering Standards
- **Single Responsibility**: Keep files small and focused (max 500 lines).
- **DRY (Don't Repeat Yourself)**: Extract common logic into utilities.
- **Done is Done**: No \`TODO\` or \`FIXME\` comments allowed in the final state.
- **Memory Preservation**: Always update docs/SPEC.md, docs/ARCH.md, docs/DECISIONS.md.

## 🛠️ Commands
\`\`\`bash
# Verify current state
npx @rigour-labs/cli check

# Self-healing agent loop
npx @rigour-labs/cli run -- <agent-command>
\`\`\`
`;

    // 1. Create Universal Instructions
    await fs.writeFile(instructionsPath, ruleContent);
    console.log(chalk.green('✔ Initialized Universal Agent Handshake (docs/AGENT_INSTRUCTIONS.md)'));

    // 2. Create Cursor Specific Rules (.mdc)
    const cursorRulesDir = path.join(cwd, '.cursor', 'rules');
    await fs.ensureDir(cursorRulesDir);
    const mdcPath = path.join(cursorRulesDir, 'rigour.mdc');
    const mdcContent = `---
description: Enforcement of Rigour quality gates and best practices.
globs: **/*
---

${ruleContent}`;

    await fs.writeFile(mdcPath, mdcContent);
    console.log(chalk.green('✔ Initialized Cursor Handshake (.cursor/rules/rigour.mdc)'));

    console.log(chalk.blue('\nRigour is ready. Run `npx @rigour-labs/cli check` to verify your project.'));
}
