/**
 * Human Override Manager
 * 
 * Manages human overrides for pattern matching.
 * Supports inline comments, config files, and MCP approvals.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { PatternOverride } from './types.js';

/** Default override expiration in days */
const DEFAULT_EXPIRATION_DAYS = 30;

/**
 * Override Manager class.
 */
export class OverrideManager {
    private overrides: PatternOverride[] = [];
    private rootDir: string;
    private overridesPath: string;

    constructor(rootDir: string) {
        this.rootDir = rootDir;
        this.overridesPath = path.join(rootDir, '.rigour', 'allow.json');
    }

    /**
     * Load overrides from disk.
     */
    async load(): Promise<PatternOverride[]> {
        try {
            const content = await fs.readFile(this.overridesPath, 'utf-8');
            const data = JSON.parse(content);
            this.overrides = data.overrides || [];

            // Filter out expired overrides
            this.overrides = this.overrides.filter(o => !this.isExpired(o));

            return this.overrides;
        } catch {
            this.overrides = [];
            return [];
        }
    }

    /**
     * Save overrides to disk.
     */
    async save(): Promise<void> {
        const dir = path.dirname(this.overridesPath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(
            this.overridesPath,
            JSON.stringify({ overrides: this.overrides }, null, 2),
            'utf-8'
        );
    }

    /**
     * Add a new override.
     */
    async addOverride(override: Omit<PatternOverride, 'createdAt'>): Promise<PatternOverride> {
        const fullOverride: PatternOverride = {
            ...override,
            createdAt: new Date().toISOString(),
            expiresAt: override.expiresAt || this.getDefaultExpiration()
        };

        // Remove any existing override for the same pattern
        this.overrides = this.overrides.filter(o => o.pattern !== fullOverride.pattern);

        this.overrides.push(fullOverride);
        await this.save();

        return fullOverride;
    }

    /**
     * Remove an override.
     */
    async removeOverride(pattern: string): Promise<boolean> {
        const before = this.overrides.length;
        this.overrides = this.overrides.filter(o => o.pattern !== pattern);

        if (this.overrides.length !== before) {
            await this.save();
            return true;
        }

        return false;
    }

    /**
     * Check if a pattern is overridden.
     */
    isOverridden(name: string): PatternOverride | null {
        for (const override of this.overrides) {
            if (this.isExpired(override)) continue;

            // Exact match
            if (override.pattern === name) {
                return override;
            }

            // Glob match
            if (override.pattern.includes('*')) {
                const regex = new RegExp(
                    '^' + override.pattern.replace(/\*/g, '.*') + '$'
                );
                if (regex.test(name)) {
                    return override;
                }
            }
        }

        return null;
    }

    /**
     * Get all active overrides.
     */
    getActiveOverrides(): PatternOverride[] {
        return this.overrides.filter(o => !this.isExpired(o));
    }

    /**
     * Get all expired overrides.
     */
    getExpiredOverrides(): PatternOverride[] {
        return this.overrides.filter(o => this.isExpired(o));
    }

    /**
     * Clean up expired overrides.
     */
    async cleanupExpired(): Promise<number> {
        const before = this.overrides.length;
        this.overrides = this.overrides.filter(o => !this.isExpired(o));

        if (this.overrides.length !== before) {
            await this.save();
        }

        return before - this.overrides.length;
    }

    /**
     * Parse inline override comments from code.
     */
    parseInlineOverrides(code: string, filePath: string): PatternOverride[] {
        const overrides: PatternOverride[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match: // rigour-allow: pattern-name
            // Or: // rigour-allow: pattern-name (reason)
            const match = line.match(/\/\/\s*rigour-allow:\s*(\S+)(?:\s*\(([^)]+)\))?/i);

            if (match) {
                overrides.push({
                    pattern: match[1],
                    reason: match[2] || `Inline override in ${filePath}:${i + 1}`,
                    createdAt: new Date().toISOString(),
                    approvedBy: `inline:${filePath}:${i + 1}`
                });
            }
        }

        return overrides;
    }

    /**
     * Check if an override is expired.
     */
    private isExpired(override: PatternOverride): boolean {
        if (!override.expiresAt) return false;
        return new Date(override.expiresAt) < new Date();
    }

    /**
     * Get default expiration date.
     */
    private getDefaultExpiration(): string {
        const date = new Date();
        date.setDate(date.getDate() + DEFAULT_EXPIRATION_DAYS);
        return date.toISOString();
    }
}

/**
 * Load overrides from rigour.config.yaml.
 */
export async function loadConfigOverrides(rootDir: string): Promise<PatternOverride[]> {
    const configPaths = [
        path.join(rootDir, 'rigour.config.yaml'),
        path.join(rootDir, 'rigour.config.yml'),
        path.join(rootDir, '.rigour', 'config.yaml')
    ];

    for (const configPath of configPaths) {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const { parse } = await import('yaml');
            const config = parse(content);

            if (config.patterns?.allow && Array.isArray(config.patterns.allow)) {
                return config.patterns.allow.map((item: any) => {
                    if (typeof item === 'string') {
                        return {
                            pattern: item,
                            reason: 'Configured in rigour.config.yaml',
                            createdAt: new Date().toISOString()
                        };
                    }
                    return {
                        pattern: item.pattern || item.path || item.name,
                        reason: item.reason || 'Configured in rigour.config.yaml',
                        expiresAt: item.expires,
                        approvedBy: item.approved_by,
                        createdAt: new Date().toISOString()
                    };
                });
            }
        } catch {
            // Config file doesn't exist or is invalid
            continue;
        }
    }

    return [];
}
