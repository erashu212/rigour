import { Report, Failure, Config } from '../types/index.js';
import { FixPacketV2, FixPacketV2Schema } from '../types/fix-packet.js';

export class FixPacketService {
    generate(report: Report, config: Config): FixPacketV2 {
        const violations = report.failures.map(f => ({
            id: f.id,
            gate: f.id, // Usually matches
            severity: this.inferSeverity(f),
            title: f.title,
            details: f.details,
            files: f.files,
            hint: f.hint,
            metrics: (f as any).metrics,
        }));

        const packet: FixPacketV2 = {
            version: 2,
            goal: "Achieve PASS state by resolving all listed engineering violations.",
            violations,
            constraints: {
                paradigm: config.paradigm,
                // Future: add protected_paths from config
            },
        };

        return FixPacketV2Schema.parse(packet);
    }

    private inferSeverity(f: Failure): "low" | "medium" | "high" | "critical" {
        // High complexity or God objects are usually High severity
        if (f.id === 'ast-analysis') return 'high';
        // Unit test or Lint failures are Medium
        if (f.id === 'test' || f.id === 'lint') return 'medium';
        // Documentation or small file size issues are Low
        return 'medium';
    }
}
