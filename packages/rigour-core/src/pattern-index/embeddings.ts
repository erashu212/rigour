/**
 * Semantic Embedding Service
 * 
 * Uses Transformers.js for local vector embeddings.
 */

import { pipeline } from '@xenova/transformers';

/**
 * Singleton for the embedding pipeline to avoid re-loading the model.
 */
let embeddingPipeline: any = null;

/**
 * Get or initialize the embedding pipeline.
 */
async function getPipeline() {
    if (!embeddingPipeline) {
        // Using a compact but high-quality model for local embeddings
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipeline;
}

/**
 * Generate an embedding for a piece of text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const extractor = await getPipeline();
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        return [];
    }
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length || v1.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        norm1 += v1[i] * v1[i];
        norm2 += v2[i] * v2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Perform semantic search against a list of embeddings.
 */
export function semanticSearch(queryVector: number[], entries: { embedding?: number[] }[]): number[] {
    return entries.map(entry => {
        if (!entry.embedding) return 0;
        return cosineSimilarity(queryVector, entry.embedding);
    });
}
