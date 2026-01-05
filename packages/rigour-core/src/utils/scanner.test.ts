import { describe, it, expect, vi } from 'vitest';
import { FileScanner } from './scanner.js';
import { globby } from 'globby';

vi.mock('globby', () => ({
    globby: vi.fn(),
}));

describe('FileScanner', () => {
    it('should merge default ignores with user ignores', async () => {
        const options = {
            cwd: '/test',
            ignore: ['custom-ignore']
        };

        await FileScanner.findFiles(options);

        const call = vi.mocked(globby).mock.calls[0];
        const ignore = (call[1] as any).ignore;

        expect(ignore).toContain('**/node_modules/**');
        expect(ignore).toContain('custom-ignore');
    });

    it('should normalize paths to forward slashes', async () => {
        const options = {
            cwd: 'C:\\test\\path',
            patterns: ['**\\*.ts']
        };

        await FileScanner.findFiles(options);

        const call = vi.mocked(globby).mock.calls[1];
        expect(call[0][0]).toBe('**/*.ts');
        expect(call[1]?.cwd).toBe('C:/test/path');
    });
});
