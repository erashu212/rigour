/**
 * Pattern Indexer
 * 
 * Scans the codebase and extracts patterns using AST parsing.
 * This is the core engine of the Pattern Index system.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { globby } from 'globby';
import ts from 'typescript';
import type {
    PatternEntry,
    PatternIndex,
    PatternIndexConfig,
    PatternIndexStats,
    PatternType,
    IndexedFile
} from './types.js';
import { generateEmbedding } from './embeddings.js';

/** Default configuration for the indexer */
const DEFAULT_CONFIG: PatternIndexConfig = {
    include: ['src/**/*', 'lib/**/*', 'app/**/*', 'components/**/*', 'utils/**/*', 'hooks/**/*'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/coverage/**'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    indexTests: false,
    indexNodeModules: false,
    minNameLength: 2,
    categories: {},
    useEmbeddings: false
};

/** Current index format version */
const INDEX_VERSION = '1.0.0';

/**
 * Pattern Indexer class.
 * Responsible for scanning and indexing code patterns.
 */
export class PatternIndexer {
    private config: PatternIndexConfig;
    private rootDir: string;

    constructor(rootDir: string, config: Partial<PatternIndexConfig> = {}) {
        this.rootDir = rootDir;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async buildIndex(): Promise<PatternIndex> {
        const startTime = Date.now();

        // Find all files to index
        const files = await this.findFiles();

        // Process files in parallel batches (concurrency: 10)
        const BATCH_SIZE = 10;
        const patterns: PatternEntry[] = [];
        const indexedFiles: IndexedFile[] = [];

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map(async (file) => {
                try {
                    const relativePath = path.relative(this.rootDir, file);
                    const content = await fs.readFile(file, 'utf-8');
                    const fileHash = this.hashContent(content);

                    const filePatterns = await this.extractPatterns(file, content);

                    return {
                        patterns: filePatterns,
                        fileInfo: {
                            path: relativePath,
                            hash: fileHash,
                            patternCount: filePatterns.length,
                            indexedAt: new Date().toISOString()
                        }
                    };
                } catch (error) {
                    console.error(`Error indexing ${file}:`, error);
                    return null;
                }
            }));

            for (const result of results) {
                if (result) {
                    patterns.push(...result.patterns);
                    indexedFiles.push(result.fileInfo);
                }
            }
        }

        // Generate embeddings in parallel batches if enabled
        if (this.config.useEmbeddings && patterns.length > 0) {
            console.log(`Generating embeddings for ${patterns.length} patterns...`);
            for (let i = 0; i < patterns.length; i += BATCH_SIZE) {
                const batch = patterns.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (pattern) => {
                    pattern.embedding = await generateEmbedding(`${pattern.name} ${pattern.type} ${pattern.description}`);
                }));
            }
        }

        const endTime = Date.now();
        const stats = this.calculateStats(patterns, indexedFiles, endTime - startTime);

        const index: PatternIndex = {
            version: INDEX_VERSION,
            lastUpdated: new Date().toISOString(),
            rootDir: this.rootDir,
            patterns,
            stats,
            files: indexedFiles
        };

        return index;
    }

    /**
     * Incremental index update - only reindex changed files.
     */
    async updateIndex(existingIndex: PatternIndex): Promise<PatternIndex> {
        const startTime = Date.now();
        const files = await this.findFiles();

        const updatedPatterns: PatternEntry[] = [];
        const updatedFiles: IndexedFile[] = [];

        // Create a map of existing file hashes
        const existingFileMap = new Map(
            existingIndex.files.map(f => [f.path, f])
        );

        // Process files in parallel batches (concurrency: 10)
        const BATCH_SIZE = 10;
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map(async (file) => {
                const relativePath = path.relative(this.rootDir, file);
                const content = await fs.readFile(file, 'utf-8');
                const fileHash = this.hashContent(content);

                const existingFile = existingFileMap.get(relativePath);

                if (existingFile && existingFile.hash === fileHash) {
                    // File unchanged, keep existing patterns
                    const existingPatterns = existingIndex.patterns.filter(
                        p => p.file === relativePath
                    );
                    return { patterns: existingPatterns, fileInfo: existingFile };
                } else {
                    // File changed or new, reindex
                    const filePatterns = await this.extractPatterns(file, content);
                    return {
                        patterns: filePatterns,
                        fileInfo: {
                            path: relativePath,
                            hash: fileHash,
                            patternCount: filePatterns.length,
                            indexedAt: new Date().toISOString()
                        }
                    };
                }
            }));

            for (const result of results) {
                updatedPatterns.push(...result.patterns);
                updatedFiles.push(result.fileInfo);
            }
        }

        // Update embeddings for new/changed patterns if enabled
        if (this.config.useEmbeddings && updatedPatterns.length > 0) {
            for (let i = 0; i < updatedPatterns.length; i += BATCH_SIZE) {
                const batch = updatedPatterns.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (pattern) => {
                    if (!pattern.embedding) {
                        pattern.embedding = await generateEmbedding(`${pattern.name} ${pattern.type} ${pattern.description}`);
                    }
                }));
            }
        }

        const endTime = Date.now();
        const stats = this.calculateStats(updatedPatterns, updatedFiles, endTime - startTime);

        return {
            version: INDEX_VERSION,
            lastUpdated: new Date().toISOString(),
            rootDir: this.rootDir,
            patterns: updatedPatterns,
            stats,
            files: updatedFiles
        };
    }

    /**
     * Find all files to index based on configuration.
     */
    private async findFiles(): Promise<string[]> {
        const patterns = this.config.include.map(p =>
            this.config.extensions.map(ext =>
                p.endsWith('*') ? `${p}${ext}` : p
            )
        ).flat();

        let exclude = [...this.config.exclude];

        if (!this.config.indexTests) {
            exclude.push('**/*.test.*', '**/*.spec.*', '**/__tests__/**');
        }

        const files = await globby(patterns, {
            cwd: this.rootDir,
            absolute: true,
            ignore: exclude,
            gitignore: true
        });

        return files;
    }

    /**
     * Extract patterns from a single file using TypeScript AST.
     */
    private async extractPatterns(filePath: string, content: string): Promise<PatternEntry[]> {
        const patterns: PatternEntry[] = [];
        const relativePath = path.relative(this.rootDir, filePath);

        // Parse with TypeScript
        const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true,
            this.getScriptKind(filePath)
        );

        // Walk the AST
        const visit = (node: ts.Node) => {
            const pattern = this.nodeToPattern(node, sourceFile, relativePath, content);
            if (pattern) {
                patterns.push(pattern);
            }
            ts.forEachChild(node, visit);
        };

        visit(sourceFile);

        return patterns;
    }

    /**
     * Convert an AST node to a PatternEntry if applicable.
     */
    private nodeToPattern(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        filePath: string,
        content: string
    ): PatternEntry | null {
        const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const line = startPos.line + 1;
        const endLine = endPos.line + 1;

        // Function declarations
        if (ts.isFunctionDeclaration(node) && node.name) {
            const name = node.name.text;
            if (name.length < this.config.minNameLength) return null;

            return this.createPatternEntry({
                type: this.detectFunctionType(name, node),
                name,
                file: filePath,
                line,
                endLine,
                signature: this.getFunctionSignature(node, sourceFile),
                description: this.getJSDocDescription(node, sourceFile),
                keywords: this.extractKeywords(name),
                content: node.getText(sourceFile),
                exported: this.isExported(node)
            });
        }

        // Variable declarations with arrow functions
        if (ts.isVariableStatement(node)) {
            const patterns: PatternEntry[] = [];
            for (const decl of node.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.initializer) {
                    const name = decl.name.text;
                    if (name.length < this.config.minNameLength) continue;

                    if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                        return this.createPatternEntry({
                            type: this.detectFunctionType(name, decl.initializer),
                            name,
                            file: filePath,
                            line,
                            endLine,
                            signature: this.getArrowFunctionSignature(decl.initializer, sourceFile),
                            description: this.getJSDocDescription(node, sourceFile),
                            keywords: this.extractKeywords(name),
                            content: node.getText(sourceFile),
                            exported: this.isExported(node)
                        });
                    }

                    // Constants
                    if (ts.isStringLiteral(decl.initializer) ||
                        ts.isNumericLiteral(decl.initializer) ||
                        ts.isObjectLiteralExpression(decl.initializer)) {

                        const isConstant = node.declarationList.flags & ts.NodeFlags.Const;
                        if (isConstant && name === name.toUpperCase()) {
                            return this.createPatternEntry({
                                type: 'constant',
                                name,
                                file: filePath,
                                line,
                                endLine,
                                signature: '',
                                description: this.getJSDocDescription(node, sourceFile),
                                keywords: this.extractKeywords(name),
                                content: node.getText(sourceFile),
                                exported: this.isExported(node)
                            });
                        }
                    }
                }
            }
        }

        // Class declarations
        if (ts.isClassDeclaration(node) && node.name) {
            const name = node.name.text;
            if (name.length < this.config.minNameLength) return null;

            return this.createPatternEntry({
                type: this.detectClassType(name, node),
                name,
                file: filePath,
                line,
                endLine,
                signature: this.getClassSignature(node, sourceFile),
                description: this.getJSDocDescription(node, sourceFile),
                keywords: this.extractKeywords(name),
                content: node.getText(sourceFile),
                exported: this.isExported(node)
            });
        }

        // Interface declarations
        if (ts.isInterfaceDeclaration(node)) {
            const name = node.name.text;
            if (name.length < this.config.minNameLength) return null;

            return this.createPatternEntry({
                type: 'interface',
                name,
                file: filePath,
                line,
                endLine,
                signature: this.getInterfaceSignature(node, sourceFile),
                description: this.getJSDocDescription(node, sourceFile),
                keywords: this.extractKeywords(name),
                content: node.getText(sourceFile),
                exported: this.isExported(node)
            });
        }

        // Type alias declarations
        if (ts.isTypeAliasDeclaration(node)) {
            const name = node.name.text;
            if (name.length < this.config.minNameLength) return null;

            return this.createPatternEntry({
                type: 'type',
                name,
                file: filePath,
                line,
                endLine,
                signature: node.getText(sourceFile).split('=')[0].trim(),
                description: this.getJSDocDescription(node, sourceFile),
                keywords: this.extractKeywords(name),
                content: node.getText(sourceFile),
                exported: this.isExported(node)
            });
        }

        // Enum declarations
        if (ts.isEnumDeclaration(node)) {
            const name = node.name.text;
            if (name.length < this.config.minNameLength) return null;

            return this.createPatternEntry({
                type: 'enum',
                name,
                file: filePath,
                line,
                endLine,
                signature: `enum ${name}`,
                description: this.getJSDocDescription(node, sourceFile),
                keywords: this.extractKeywords(name),
                content: node.getText(sourceFile),
                exported: this.isExported(node)
            });
        }

        return null;
    }

    /**
     * Detect the specific type of a function based on naming conventions.
     */
    private detectFunctionType(name: string, node: ts.Node): PatternType {
        // React hooks
        if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            return 'hook';
        }

        // React components (PascalCase and returns JSX)
        if (name[0] === name[0].toUpperCase() && this.containsJSX(node)) {
            return 'component';
        }

        // Middleware patterns
        if (name.includes('Middleware') || name.includes('middleware')) {
            return 'middleware';
        }

        // Handler patterns
        if (name.includes('Handler') || name.includes('handler')) {
            return 'handler';
        }

        // Factory patterns
        if (name.startsWith('create') || name.startsWith('make') || name.includes('Factory')) {
            return 'factory';
        }

        return 'function';
    }

    /**
     * Detect the specific type of a class.
     */
    private detectClassType(name: string, node: ts.ClassDeclaration): PatternType {
        // Error classes
        if (name.endsWith('Error') || name.endsWith('Exception')) {
            return 'error';
        }

        // Check for React component (extends Component/PureComponent)
        if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
                const text = clause.getText();
                if (text.includes('Component') || text.includes('PureComponent')) {
                    return 'component';
                }
            }
        }

        // Store patterns
        if (name.endsWith('Store') || name.endsWith('State')) {
            return 'store';
        }

        // Model patterns
        if (name.endsWith('Model') || name.endsWith('Entity')) {
            return 'model';
        }

        return 'class';
    }

    /**
     * Check if a node contains JSX.
     */
    private containsJSX(node: ts.Node): boolean {
        let hasJSX = false;
        const visit = (n: ts.Node) => {
            if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
                hasJSX = true;
                return;
            }
            ts.forEachChild(n, visit);
        };
        visit(node);
        return hasJSX;
    }

    /**
     * Get function signature.
     */
    private getFunctionSignature(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
        const params = node.parameters
            .map(p => p.getText(sourceFile))
            .join(', ');
        const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
        return `(${params})${returnType}`;
    }

    /**
     * Get arrow function signature.
     */
    private getArrowFunctionSignature(
        node: ts.ArrowFunction | ts.FunctionExpression,
        sourceFile: ts.SourceFile
    ): string {
        const params = node.parameters
            .map(p => p.getText(sourceFile))
            .join(', ');
        const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
        return `(${params})${returnType}`;
    }

    /**
     * Get class signature.
     */
    private getClassSignature(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): string {
        let sig = `class ${node.name?.text || 'Anonymous'}`;
        if (node.heritageClauses) {
            sig += ' ' + node.heritageClauses.map(c => c.getText(sourceFile)).join(' ');
        }
        return sig;
    }

    /**
     * Get interface signature.
     */
    private getInterfaceSignature(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): string {
        let sig = `interface ${node.name.text}`;
        if (node.typeParameters) {
            sig += `<${node.typeParameters.map(p => p.getText(sourceFile)).join(', ')}>`;
        }
        return sig;
    }

    /**
     * Extract JSDoc description from a node.
     */
    private getJSDocDescription(node: ts.Node, sourceFile: ts.SourceFile): string {
        const jsDocTags = ts.getJSDocTags(node);
        const jsDocComment = ts.getJSDocCommentsAndTags(node);

        for (const tag of jsDocComment) {
            if (ts.isJSDoc(tag) && tag.comment) {
                if (typeof tag.comment === 'string') {
                    return tag.comment;
                }
                return tag.comment.map(c => c.getText(sourceFile)).join(' ');
            }
        }

        return '';
    }

    /**
     * Check if a node is exported.
     */
    private isExported(node: ts.Node): boolean {
        if (ts.canHaveModifiers(node)) {
            const modifiers = ts.getModifiers(node);
            if (modifiers) {
                return modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
            }
        }
        return false;
    }

    /**
     * Extract keywords from a name for semantic matching.
     */
    private extractKeywords(name: string): string[] {
        // Split camelCase and PascalCase
        const words = name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .toLowerCase()
            .split(/[\s_-]+/)
            .filter(w => w.length > 1);

        return [...new Set(words)];
    }

    /**
     * Create a PatternEntry with computed fields.
     */
    private createPatternEntry(params: {
        type: PatternType;
        name: string;
        file: string;
        line: number;
        endLine: number;
        signature: string;
        description: string;
        keywords: string[];
        content: string;
        exported: boolean;
    }): PatternEntry {
        const id = this.hashContent(`${params.file}:${params.name}:${params.line}`);
        const hash = this.hashContent(params.content);

        return {
            id,
            type: params.type,
            name: params.name,
            file: params.file,
            line: params.line,
            endLine: params.endLine,
            signature: params.signature,
            description: params.description,
            keywords: params.keywords,
            hash,
            exported: params.exported,
            usageCount: 0, // Will be calculated in a separate pass
            indexedAt: new Date().toISOString()
        };
    }

    /**
     * Get the TypeScript ScriptKind for a file.
     */
    private getScriptKind(filePath: string): ts.ScriptKind {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.ts': return ts.ScriptKind.TS;
            case '.tsx': return ts.ScriptKind.TSX;
            case '.js': return ts.ScriptKind.JS;
            case '.jsx': return ts.ScriptKind.JSX;
            default: return ts.ScriptKind.TS;
        }
    }

    /**
     * Calculate index statistics.
     */
    private calculateStats(
        patterns: PatternEntry[],
        files: IndexedFile[],
        durationMs: number
    ): PatternIndexStats {
        const byType: Record<string, number> = {};

        for (const pattern of patterns) {
            byType[pattern.type] = (byType[pattern.type] || 0) + 1;
        }

        return {
            totalPatterns: patterns.length,
            totalFiles: files.length,
            byType: byType as Record<PatternType, number>,
            indexDurationMs: durationMs
        };
    }

    /**
     * Hash content using SHA-256.
     */
    private hashContent(content: string): string {
        return createHash('sha256').update(content).digest('hex').slice(0, 16);
    }
}

/**
 * Save a pattern index to disk.
 */
export async function savePatternIndex(index: PatternIndex, outputPath: string): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Load a pattern index from disk.
 */
export async function loadPatternIndex(indexPath: string): Promise<PatternIndex | null> {
    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(content) as PatternIndex;
    } catch {
        return null;
    }
}

/**
 * Get the default index path for a project.
 */
export function getDefaultIndexPath(rootDir: string): string {
    return path.join(rootDir, '.rigour', 'patterns.json');
}
