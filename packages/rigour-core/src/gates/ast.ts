import ts from 'typescript';
import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';
import { Gate, GateContext } from './base.js';
import { Failure, Gates } from '../types/index.js';

export class ASTGate extends Gate {
    constructor(private config: Gates) {
        super('ast-analysis', 'AST Structural Analysis');
    }

    async run(context: GateContext): Promise<Failure[]> {
        const failures: Failure[] = [];
        const files = await globby(['**/*.{ts,js,tsx,jsx}'], {
            cwd: context.cwd,
            ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.*', '**/*.spec.*'],
        });

        for (const file of files) {
            const fullPath = path.join(context.cwd, file);
            const content = await fs.readFile(fullPath, 'utf-8');
            const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

            this.analyzeSourceFile(sourceFile, file, failures);
        }

        return failures;
    }

    private analyzeSourceFile(sourceFile: ts.SourceFile, relativePath: string, failures: Failure[]) {
        const astConfig = this.config.ast || {};
        const maxComplexity = astConfig.complexity || 10;
        const maxMethods = astConfig.max_methods || 10;
        const maxParams = astConfig.max_params || 5;

        const visit = (node: ts.Node) => {
            // 1. Complexity & Params for functions
            if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
                const name = this.getNodeName(node);

                // Parameter count
                if (node.parameters.length > maxParams) {
                    failures.push(this.createFailure(
                        `Function '${name}' has ${node.parameters.length} parameters (max: ${maxParams})`,
                        [relativePath],
                        `Reduce number of parameters or use an options object.`
                    ));
                    // Update: Failures in Runner will be mapped to FixPacket
                    (failures[failures.length - 1] as any).metrics = { count: node.parameters.length, max: maxParams };
                }

                // Cyclomatic Complexity (Simplified: nodes that cause branching)
                let complexity = 1;
                const countComplexity = (n: ts.Node) => {
                    if (ts.isIfStatement(n) || ts.isCaseClause(n) || ts.isDefaultClause(n) ||
                        ts.isForStatement(n) || ts.isForInStatement(n) || ts.isForOfStatement(n) ||
                        ts.isWhileStatement(n) || ts.isDoStatement(n) || ts.isConditionalExpression(n)) {
                        complexity++;
                    }
                    if (ts.isBinaryExpression(n)) {
                        if (n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                            n.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
                            complexity++;
                        }
                    }
                    ts.forEachChild(n, countComplexity);
                };
                ts.forEachChild(node, countComplexity);

                if (complexity > maxComplexity) {
                    failures.push(this.createFailure(
                        `Function '${name}' has cyclomatic complexity of ${complexity} (max: ${maxComplexity})`,
                        [relativePath],
                        `Refactor '${name}' into smaller, more focused functions.`
                    ));
                    (failures[failures.length - 1] as any).metrics = { complexity, max: maxComplexity };
                }
            }

            // 2. Class metrics
            if (ts.isClassDeclaration(node)) {
                const name = node.name?.text || 'Anonymous Class';
                const methods = node.members.filter(ts.isMethodDeclaration);

                if (methods.length > maxMethods) {
                    failures.push(this.createFailure(
                        `Class '${name}' has ${methods.length} methods (max: ${maxMethods})`,
                        [relativePath],
                        `Class '${name}' is becoming a 'God Object'. Split it into smaller services.`
                    ));
                    (failures[failures.length - 1] as any).metrics = { methodCount: methods.length, max: maxMethods };
                }
            }

            ts.forEachChild(node, visit);
        };

        ts.forEachChild(sourceFile, visit);
    }

    private getNodeName(node: ts.Node): string {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            return node.name?.getText() || 'anonymous';
        }
        if (ts.isArrowFunction(node)) {
            const parent = node.parent;
            if (ts.isVariableDeclaration(parent)) {
                return parent.name.getText();
            }
            return 'anonymous arrow';
        }
        return 'unknown';
    }
}
