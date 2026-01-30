/**
 * Pattern Index - Main Export
 * 
 * This is the public API for the Pattern Index system.
 */

// Types
export type {
    PatternType,
    PatternEntry,
    PatternIndex,
    PatternIndexConfig,
    PatternIndexStats,
    IndexedFile,
    PatternMatchResult,
    PatternMatch,
    PatternOverride,
    StalenessResult,
    StalenessIssue,
    DeprecationEntry
} from './types.js';

// Indexer
export {
    PatternIndexer,
    savePatternIndex,
    loadPatternIndex,
    getDefaultIndexPath
} from './indexer.js';

// Matcher
export {
    PatternMatcher,
    checkPatternDuplicate,
    type MatcherConfig
} from './matcher.js';

// Staleness Detection
export {
    StalenessDetector,
    checkCodeStaleness
} from './staleness.js';

// Security Detection
export {
    SecurityDetector
} from './security.js';

// Override Management
export {
    OverrideManager,
    loadConfigOverrides
} from './overrides.js';
// Embeddings
export {
    generateEmbedding,
    semanticSearch,
    cosineSimilarity
} from './embeddings.js';
