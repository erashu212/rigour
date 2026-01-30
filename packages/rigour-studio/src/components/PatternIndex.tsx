import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, FileCode, Hash, Clock, Filter, ChevronRight, Layers, BarChart3 } from 'lucide-react';

interface PatternEntry {
    id: string;
    type: string;
    name: string;
    file: string;
    line: number;
    endLine: number;
    signature: string;
    description: string;
    keywords: string[];
    exported: boolean;
    usageCount: number;
    indexedAt: string;
}

interface PatternIndexStats {
    totalPatterns: number;
    totalFiles: number;
    byType: Record<string, number>;
    indexDurationMs?: number;
}

interface PatternIndexData {
    patterns: PatternEntry[];
    stats: PatternIndexStats;
    lastUpdated?: string;
}

export const PatternIndex: React.FC = () => {
    const [indexData, setIndexData] = useState<PatternIndexData>({ patterns: [], stats: { totalPatterns: 0, totalFiles: 0, byType: {} } });
    const [selectedPattern, setSelectedPattern] = useState<PatternEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isSemantic, setIsSemantic] = useState(false);
    const [semanticResults, setSemanticResults] = useState<PatternEntry[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchIndex = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/index-stats');
            const data = await res.json();
            setIndexData(data);
        } catch (err) {
            console.error('Failed to fetch pattern index:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIndex();
    }, []);

    useEffect(() => {
        if (!isSemantic || searchQuery.length < 3) {
            setSemanticResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/index-search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSemanticResults(data);
            } catch (err) {
                console.error('Semantic search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, isSemantic]);

    const patterns = isSemantic && searchQuery.length >= 3 ? semanticResults : (indexData.patterns || []);
    const stats = indexData.stats || { totalPatterns: 0, totalFiles: 0, byType: {} };

    const filteredPatterns = isSemantic && searchQuery.length >= 3 ? patterns : patterns.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.file.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || p.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const patternTypes = Object.keys(stats.byType || {});

    return (
        <div className="pattern-index">
            <div className="pattern-header">
                <div className="pattern-title">
                    <Layers size={24} />
                    <h2>Pattern Index</h2>
                    <span className="pattern-count">{stats.totalPatterns} patterns</span>
                </div>
                <div className="pattern-actions">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search patterns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-box">
                        <Filter size={16} />
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="all">All Types</option>
                            {patternTypes.map(t => (
                                <option key={t} value={t}>{t} ({stats.byType[t]})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className={`semantic-toggle ${isSemantic ? 'active' : ''}`}
                        onClick={() => setIsSemantic(!isSemantic)}
                        title="Semantic Search (v2)"
                    >
                        <Hash size={16} />
                        <span>AI Search</span>
                    </button>
                    <button className="refresh-btn" onClick={fetchIndex} disabled={isLoading}>
                        <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            <div className="pattern-stats">
                <div className="stat-card">
                    <BarChart3 size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalPatterns}</span>
                        <span className="stat-label">Total Patterns</span>
                    </div>
                </div>
                <div className="stat-card">
                    <FileCode size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalFiles}</span>
                        <span className="stat-label">Files Indexed</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Hash size={20} />
                    <div className="stat-info">
                        <span className="stat-value">{patternTypes.length}</span>
                        <span className="stat-label">Pattern Types</span>
                    </div>
                </div>
                {stats.indexDurationMs && (
                    <div className="stat-card">
                        <Clock size={20} />
                        <div className="stat-info">
                            <span className="stat-value">{stats.indexDurationMs}ms</span>
                            <span className="stat-label">Index Time</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="pattern-content">
                <div className="pattern-list">
                    {isSearching && (
                        <div className="searching-indicator">
                            <RefreshCw size={14} className="spinning" />
                            <span>AI is analyzing your query...</span>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="pattern-loading">Loading patterns...</div>
                    ) : filteredPatterns.length === 0 ? (
                        <div className="pattern-empty">
                            <Layers size={48} />
                            <h3>No Patterns Indexed</h3>
                            <p>Run <code>rigour index</code> to scan your codebase.</p>
                        </div>
                    ) : (
                        filteredPatterns.map((pattern: any) => (
                            <div
                                key={pattern.id}
                                className={`pattern-item ${selectedPattern?.id === pattern.id ? 'active' : ''}`}
                                onClick={() => setSelectedPattern(pattern)}
                            >
                                {pattern.similarity && (
                                    <div className="similarity-badge">
                                        {(pattern.similarity * 100).toFixed(0)}% Match
                                    </div>
                                )}
                                <div className="pattern-item-header">
                                    <span className="pattern-type-badge">{pattern.type}</span>
                                    <span className="pattern-name">{pattern.name}</span>
                                    <ChevronRight size={14} className="chevron" />
                                </div>
                                <div className="pattern-item-file">
                                    <FileCode size={12} />
                                    <span>{pattern.file}:{pattern.line}</span>
                                </div>
                                {pattern.exported && <span className="exported-badge">exported</span>}
                            </div>
                        ))
                    )}
                </div>

                <div className="pattern-detail">
                    {selectedPattern ? (
                        <>
                            <div className="detail-header">
                                <span className="pattern-type-badge large">{selectedPattern.type}</span>
                                <h3>{selectedPattern.name}</h3>
                            </div>

                            <div className="detail-section">
                                <h4>Location</h4>
                                <code>{selectedPattern.file}:{selectedPattern.line}-{selectedPattern.endLine}</code>
                            </div>

                            {selectedPattern.signature && (
                                <div className="detail-section">
                                    <h4>Signature</h4>
                                    <pre>{selectedPattern.signature}</pre>
                                </div>
                            )}

                            {selectedPattern.description && (
                                <div className="detail-section">
                                    <h4>Description</h4>
                                    <p>{selectedPattern.description}</p>
                                </div>
                            )}

                            {selectedPattern.keywords?.length > 0 && (
                                <div className="detail-section">
                                    <h4>Keywords</h4>
                                    <div className="keywords-list">
                                        {selectedPattern.keywords.map((kw, i) => (
                                            <span key={i} className="keyword-tag">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="detail-section">
                                <h4>Usage</h4>
                                <p>Imported in <strong>{selectedPattern.usageCount}</strong> files</p>
                            </div>
                        </>
                    ) : (
                        <div className="detail-placeholder">
                            <Layers size={48} />
                            <p>Select a pattern to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
