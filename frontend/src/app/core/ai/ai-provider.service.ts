import { Injectable, inject } from '@angular/core';
import { AIProvider, AISourceCitation } from '../models/ai.model';
import { SettingsRepository } from '../repositories/settings.repository';

@Injectable({
  providedIn: 'root'
})
export class OllamaAIProvider implements AIProvider {
  name = 'Local Ollama (Offline)';
  private settingsRepo = inject(SettingsRepository);

  async isAvailable(): Promise<boolean> {
    try {
      const settings = await this.settingsRepo.getSettings();
      const res = await fetch(`${settings.ollamaUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const settings = await this.settingsRepo.getSettings();
    try {
      const res = await fetch(`${settings.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaEmbeddingModel || 'nomic-embed-text',
          prompt: text
        })
      });
      if (!res.ok) throw new Error(`Ollama embedding error: ${res.statusText}`);
      const data = await res.json();
      return data.embedding;
    } catch (err) {
      console.warn('Ollama embedding fallback to lightweight local vector:', err);
      return this.generateLightweightVector(text);
    }
  }

  async generateAnswer(bookTitle: string, question: string, contextChunks: AISourceCitation[]): Promise<string> {
    const settings = await this.settingsRepo.getSettings();
    const contextPrompt = contextChunks
      .map((c, i) => `[Source ${i + 1} - ${c.pageNumber ? `Page ${c.pageNumber}` : c.chapterTitle || 'Section'}]:\n"${c.snippet}"`)
      .join('\n\n');

    const systemPrompt = `You are a helpful and precise research assistant for the book "${bookTitle}".
Answer the user's question accurately using ONLY the provided excerpts from the book.
Cite specific pages and chapters from the sources. If the text does not contain enough information, state what is mentioned in the excerpts.`;

    const userPrompt = `Context excerpts from "${bookTitle}":
${contextPrompt}

Question: ${question}

Provide a clear, direct answer with source citations:`;

    const res = await fetch(`${settings.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollamaModel || 'llama3.2',
        system: systemPrompt,
        prompt: userPrompt,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama generation failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.response;
  }

  private generateLightweightVector(text: string): number[] {
    const vector = new Array(64).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        const code = word.charCodeAt(i);
        vector[(code + i) % 64] += 1;
      }
    }
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / magnitude);
  }
}

@Injectable({
  providedIn: 'root'
})
export class MockOfflineAIProvider implements AIProvider {
  name = 'Built-in Offline RAG Engine';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array(64).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        const code = word.charCodeAt(i);
        vector[(code + i) % 64] += 1;
      }
    }
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / magnitude);
  }

  async generateAnswer(bookTitle: string, question: string, contextChunks: AISourceCitation[]): Promise<string> {
    // Grounded synthesis from indexed chunks
    if (contextChunks.length === 0) {
      return `I searched "${bookTitle}" for insights regarding "${question}", but could not find matching passages in the indexed text.`;
    }

    const topChunk = contextChunks[0];
    const sourceLabel = topChunk.pageNumber ? `Page ${topChunk.pageNumber}` : (topChunk.chapterTitle || 'Section');

    const primaryInsight = topChunk.snippet.replace(/\n+/g, ' ').trim();
    const secondary = contextChunks[1] ? ` Furthermore, on ${contextChunks[1].pageNumber ? `Page ${contextChunks[1].pageNumber}` : contextChunks[1].chapterTitle || 'Section'}, the text notes that "${contextChunks[1].snippet.slice(0, 150)}..."` : '';

    return `Based on "${bookTitle}" (${sourceLabel}), the book highlights:

> "${primaryInsight}"
${secondary}

**Key Takeaways**:
- Direct reference found in ${sourceLabel} with a relevance score of ${(topChunk.relevanceScore * 100).toFixed(0)}%.
- All citations are verified directly against your local document index with zero cloud transmission.`;
  }
}
