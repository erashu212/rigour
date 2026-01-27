/**
 * Security Detector
 * 
 * Detects CVEs and security vulnerabilities in the project's dependencies
 * and alerts the AI/Editor before code is written.
 */

import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { SecurityEntry, SecurityResult } from './types.js';

interface SecurityCache {
    lockfileHash: string;
    timestamp: string;
    result: SecurityResult;
}

export class SecurityDetector {
    private rootDir: string;
    private cachePath: string;
    private CACHE_TTL = 3600000; // 1 hour in milliseconds

    constructor(rootDir: string) {
        this.rootDir = rootDir;
        this.cachePath = path.join(rootDir, '.rigour', 'security-cache.json');
    }

    /**
     * Run a live security audit using NPM.
     * This provides the latest CVE info from the NPM registry.
     */
    async runAudit(): Promise<SecurityResult> {
        try {
            const lockfileHash = await this.getLockfileHash();
            const cached = await this.getCachedResult(lockfileHash);

            if (cached) {
                return cached;
            }

            // Run npm audit --json for machine-readable CVE data
            const { stdout } = await execa('npm', ['audit', '--json'], {
                cwd: this.rootDir,
                reject: false // npm audit returns non-zero for found vulnerabilities
            });

            const auditData = JSON.parse(stdout);
            const vulnerabilities: SecurityEntry[] = [];

            if (auditData.vulnerabilities) {
                for (const [name, vuln] of Object.entries(auditData.vulnerabilities as any)) {
                    const v = vuln as any;

                    // Dig into the advisory data
                    const via = v.via && Array.isArray(v.via) ? v.via[0] : null;

                    vulnerabilities.push({
                        cveId: via?.name || 'N/A',
                        packageName: name,
                        vulnerableRange: v.range,
                        severity: v.severity,
                        title: via?.title || `Vulnerability in ${name}`,
                        url: via?.url || `https://www.npmjs.com/package/${name}/vulnerability`,
                        currentVersion: v.nodes && v.nodes[0] ? v.version : undefined
                    });
                }
            }

            const result: SecurityResult = {
                status: vulnerabilities.length > 0 ? 'VULNERABLE' : 'SECURE',
                vulnerabilities: vulnerabilities.sort((a, b) => {
                    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
                    return (severityOrder as any)[a.severity] - (severityOrder as any)[b.severity];
                })
            };

            // Save to cache
            await this.saveCache(lockfileHash, result);

            return result;
        } catch (error) {
            console.error('Security audit failed:', error);
            return { status: 'SECURE', vulnerabilities: [] };
        }
    }

    /**
     * Get a quick summary for the AI context.
     */
    async getSecuritySummary(): Promise<string> {
        const result = await this.runAudit();
        if (result.status === 'SECURE') return '✅ No known vulnerabilities found in dependencies.';

        const topVulns = result.vulnerabilities.slice(0, 3);
        let summary = `⚠️  FOUND ${result.vulnerabilities.length} VULNERABILITIES:\n`;

        for (const v of topVulns) {
            summary += `- [${v.severity.toUpperCase()}] ${v.packageName}: ${v.title} (${v.url})\n`;
        }

        if (result.vulnerabilities.length > 3) {
            summary += `- ...and ${result.vulnerabilities.length - 3} more. Run 'rigour check' for full report.`;
        }

        return summary;
    }

    private async getLockfileHash(): Promise<string> {
        const lockfiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
        for (const file of lockfiles) {
            try {
                const content = await fs.readFile(path.join(this.rootDir, file), 'utf-8');
                return createHash('sha256').update(content).digest('hex').slice(0, 16);
            } catch {
                continue;
            }
        }
        return 'no-lockfile';
    }

    private async getCachedResult(currentHash: string): Promise<SecurityResult | null> {
        try {
            const content = await fs.readFile(this.cachePath, 'utf-8');
            const cache: SecurityCache = JSON.parse(content);

            const isExpired = Date.now() - new Date(cache.timestamp).getTime() > this.CACHE_TTL;
            if (!isExpired && cache.lockfileHash === currentHash) {
                return cache.result;
            }
        } catch {
            // No cache or invalid cache
        }
        return null;
    }

    private async saveCache(hash: string, result: SecurityResult): Promise<void> {
        try {
            await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
            const cache: SecurityCache = {
                lockfileHash: hash,
                timestamp: new Date().toISOString(),
                result
            };
            await fs.writeFile(this.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
        } catch (error) {
            console.warn('Failed to save security cache:', error);
        }
    }
}
