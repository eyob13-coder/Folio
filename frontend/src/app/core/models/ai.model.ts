export interface AISourceCitation {
  bookId: string;
  bookTitle: string;
  pageNumber?: number;
  chapterTitle?: string;
  snippet: string;
  relevanceScore: number;
}

export interface AIAnswer {
  question: string;
  answer: string;
  citations: AISourceCitation[];
  modelUsed: string;
  provider: string;
  processingTimeMs: number;
  offline: boolean;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateAnswer(bookTitle: string, question: string, contextChunks: AISourceCitation[]): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}
