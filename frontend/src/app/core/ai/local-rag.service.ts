import { Injectable, inject, signal } from '@angular/core';
import { BookRepository } from '../repositories/book.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { OllamaAIProvider, MockOfflineAIProvider } from './ai-provider.service';
import { AIAnswer, AISourceCitation, AIProvider } from '../models/ai.model';
import { DocumentChunk } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class LocalRAGService {
  private bookRepo = inject(BookRepository);
  private settingsRepo = inject(SettingsRepository);
  private ollamaProvider = inject(OllamaAIProvider);
  private mockProvider = inject(MockOfflineAIProvider);

  readonly isProcessing = signal<boolean>(false);
  readonly currentAnswer = signal<AIAnswer | null>(null);

  private async getActiveProvider(): Promise<AIProvider> {
    const settings = await this.settingsRepo.getSettings();
    if (settings.aiProvider === 'local_ollama') {
      const isOllamaUp = await this.ollamaProvider.isAvailable();
      if (isOllamaUp) return this.ollamaProvider;
    }
    return this.mockProvider;
  }

  async askQuestionAboutBook(bookId: string, question: string): Promise<AIAnswer> {
    this.isProcessing.set(true);
    const startTime = performance.now();

    try {
      const book = await this.bookRepo.getBookById(bookId);
      if (!book) throw new Error('Book not found');

      const chunks = await this.bookRepo.getChunksByBookId(bookId);
      const citations = await this.retrieveRelevantChunks(chunks, book.title, question, 3);
      const provider = await this.getActiveProvider();

      const answerText = await provider.generateAnswer(book.title, question, citations);
      const duration = Math.round(performance.now() - startTime);

      const aiAnswer: AIAnswer = {
        question,
        answer: answerText,
        citations,
        modelUsed: provider.name,
        provider: provider.name,
        processingTimeMs: duration,
        offline: true
      };

      this.currentAnswer.set(aiAnswer);
      return aiAnswer;
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async retrieveRelevantChunks(
    chunks: DocumentChunk[],
    bookTitle: string,
    query: string,
    limit: number = 3
  ): Promise<AISourceCitation[]> {
    if (chunks.length === 0) return [];

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scoredChunks = chunks.map(chunk => {
      const textLower = chunk.text.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        const matches = (textLower.match(new RegExp(term, 'g')) || []).length;
        score += matches * 1.5;
      }

      // Bonus if exact phrase matches
      if (textLower.includes(query.toLowerCase())) {
        score += 5.0;
      }

      // Length normalizer
      const normalizedScore = Math.min(1.0, score / (queryTerms.length * 2 + 1));

      return {
        chunk,
        score: normalizedScore
      };
    });

    // Sort by descending score
    scoredChunks.sort((a, b) => b.score - a.score);
    const topScored = scoredChunks.filter(c => c.score > 0).slice(0, limit);

    // If no direct keyword matches, take the first chunks as fallback
    const selected = topScored.length > 0 ? topScored : scoredChunks.slice(0, limit).map(c => ({ chunk: c.chunk, score: 0.35 }));

    return selected.map(({ chunk, score }) => ({
      bookId: chunk.bookId,
      bookTitle,
      pageNumber: chunk.pageNumber,
      chapterTitle: chunk.chapterTitle,
      snippet: chunk.text.slice(0, 400) + (chunk.text.length > 400 ? '...' : ''),
      relevanceScore: Math.max(0.4, Math.round(score * 100) / 100)
    }));
  }
}
