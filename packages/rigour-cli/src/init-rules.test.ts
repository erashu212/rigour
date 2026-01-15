import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from './commands/init.js';
import fs from 'fs-extra';
import path from 'path';

describe('Init Command Rules Verification', () => {
    const testDir = path.join(process.cwd(), 'temp-init-rules-test');

    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    it('should create universal instructions and cursor rules on init', async () => {
        // Run init in test directory
        await initCommand(testDir);

        const instructionsPath = path.join(testDir, 'docs', 'AGENT_INSTRUCTIONS.md');
        const mdcPath = path.join(testDir, '.cursor', 'rules', 'rigour.mdc');

        expect(await fs.pathExists(instructionsPath)).toBe(true);
        expect(await fs.pathExists(mdcPath)).toBe(true);

        const instructionsContent = await fs.readFile(instructionsPath, 'utf-8');
        const mdcContent = await fs.readFile(mdcPath, 'utf-8');

        // Check for key sections in universal instructions
        expect(instructionsContent).toContain('# 🛡️ Rigour: Engineering Excellence Protocol');
        expect(instructionsContent).toContain('# Code Quality Standards');
        expect(instructionsContent).toContain('# Investigation & Debugging Protocol');
        expect(instructionsContent).toContain('# Role & Collaboration');

        // Check that MDC includes frontmatter and same rules
        expect(mdcContent).toContain('---');
        expect(mdcContent).toContain('description: Enforcement of Rigour quality gates and best practices.');
        expect(mdcContent).toContain('# Code Quality Standards');
    });
});
