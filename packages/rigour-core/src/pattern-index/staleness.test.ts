/**
 * Staleness Detector Tests
 * 
 * Tests for the staleness detection system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { StalenessDetector, checkCodeStaleness } from './staleness.js';

describe('StalenessDetector', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rigour-staleness-'));
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe('React deprecations', () => {
        it('should detect componentWillMount', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { react: '^18.0.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                class MyComponent extends React.Component {
                    componentWillMount() {
                        console.log('mounting');
                    }
                }
            `);

            expect(result.status).toBe('DEPRECATED');
            expect(result.issues.some(i => i.pattern.includes('componentWillMount'))).toBe(true);
            expect(result.issues[0].replacement).toContain('useEffect');
        });

        it('should detect ReactDOM.render', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                ReactDOM.render(<App />, document.getElementById('root'));
            `);

            expect(result.status).toBe('DEPRECATED');
            expect(result.issues.some(i => i.pattern.includes('ReactDOM.render'))).toBe(true);
            expect(result.issues[0].replacement).toContain('createRoot');
        });

        it('should not flag React deprecations if React is not installed', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { express: '^4.0.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                componentWillMount() {}
            `);

            // Should not flag React-specific patterns if React isn't a dependency
            expect(result.issues.filter(i => i.pattern.includes('componentWillMount'))).toHaveLength(0);
        });
    });

    describe('Package deprecations', () => {
        it('should detect moment.js usage', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                import moment from 'moment';
                const date = moment().format('YYYY-MM-DD');
            `);

            expect(result.status).toBe('STALE');
            expect(result.issues.some(i => i.replacement.includes('date-fns'))).toBe(true);
        });

        it('should detect request library usage', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                const request = require('request');
                request.get('https://example.com');
            `);

            expect(result.status).toBe('DEPRECATED');
            expect(result.issues.some(i => i.replacement.includes('fetch'))).toBe(true);
        });
    });

    describe('JavaScript deprecations', () => {
        it('should detect var keyword usage', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                var name = 'test';
                var count = 0;
            `);

            expect(result.issues.some(i => i.replacement.includes('const') || i.replacement.includes('let'))).toBe(true);
        });
    });

    describe('Redux deprecations', () => {
        it('should detect createStore usage in modern Redux projects', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { redux: '^4.2.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                import { createStore } from 'redux';
                const store = createStore(reducer);
            `);

            expect(result.status).toBe('STALE');
            expect(result.issues.some(i => i.replacement.includes('configureStore'))).toBe(true);
        });
    });

    describe('Node.js deprecations', () => {
        it('should detect Buffer constructor', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                const buf = new Buffer('hello');
            `);

            expect(result.status).toBe('DEPRECATED');
            expect(result.issues.some(i => i.replacement.includes('Buffer.from'))).toBe(true);
        });
    });

    describe('Next.js deprecations', () => {
        it('should detect getInitialProps in Next 13+ projects', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { next: '^13.0.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                MyPage.getInitialProps = async (ctx) => {
                    return { data: {} };
                };
            `);

            expect(result.issues.some(i => i.pattern.includes('getInitialProps'))).toBe(true);
        });
    });

    describe('TypeScript best practices', () => {
        it('should warn about enum usage', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                enum Status {
                    Active = 'active',
                    Inactive = 'inactive'
                }
            `);

            expect(result.issues.some(i => i.severity === 'info' && i.pattern.includes('enum'))).toBe(true);
        });
    });

    describe('Project context', () => {
        it('should return project versions in context', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({
                    dependencies: {
                        react: '^18.2.0',
                        next: '^14.0.0'
                    },
                    devDependencies: {
                        typescript: '^5.0.0'
                    }
                })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness('const x = 1;');

            expect(result.projectContext.react).toBeDefined();
            expect(result.projectContext.next).toBeDefined();
            expect(result.projectContext.typescript).toBeDefined();
        });
    });

    describe('Custom deprecations', () => {
        it('should allow adding custom deprecation rules', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            detector.addDeprecation({
                pattern: 'legacyFunction',
                deprecatedIn: '1.0.0',
                replacement: 'newFunction()',
                severity: 'error',
                reason: 'Custom deprecation'
            });

            const result = await detector.checkStaleness(`
                legacyFunction();
            `);

            expect(result.issues.some(i => i.replacement === 'newFunction()')).toBe(true);
        });
    });

    describe('Overall status', () => {
        it('should return FRESH when no issues found', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                const name = 'test';
                const greet = () => console.log('Hello');
            `);

            expect(result.status).toBe('FRESH');
        });

        it('should return STALE for warnings', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: { redux: '^4.2.0' } })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                createStore(reducer);
            `);

            expect(result.status).toBe('STALE');
        });

        it('should return DEPRECATED for errors', async () => {
            await fs.writeFile(
                path.join(testDir, 'package.json'),
                JSON.stringify({ dependencies: {} })
            );

            const detector = new StalenessDetector(testDir);
            const result = await detector.checkStaleness(`
                new Buffer('hello');
            `);

            expect(result.status).toBe('DEPRECATED');
        });
    });
});

describe('checkCodeStaleness', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rigour-staleness-'));
        await fs.writeFile(
            path.join(testDir, 'package.json'),
            JSON.stringify({ dependencies: {} })
        );
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should be a quick helper for staleness checking', async () => {
        const result = await checkCodeStaleness(testDir, 'const x = 1;');
        expect(result.status).toBe('FRESH');
    });
});
