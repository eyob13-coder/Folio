import { DocumentChunk, FileType } from '../models/book.model';

export interface ExtractedBookMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  publisher?: string;
  publicationYear?: number;
  language?: string;
  pageCount: number;
  coverDataUrl?: string;
}

export interface DocumentProcessor {
  readonly supportedType: FileType;
  canProcess(file: File): boolean;
  extractMetadata(buffer: ArrayBuffer, fileName: string): Promise<ExtractedBookMetadata>;
  extractChunks(buffer: ArrayBuffer, bookId: string): Promise<DocumentChunk[]>;
}
