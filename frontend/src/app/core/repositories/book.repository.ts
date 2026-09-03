import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { STORES } from '../storage/indexeddb-storage-provider';
import { Book, ReadingProgress, DocumentChunk, Author } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookRepository {
  private storage = inject(STORAGE_PROVIDER);

  async getAllBooks(): Promise<Book[]> {
    return this.storage.getAll<Book>(STORES.BOOKS);
  }

  async getBookById(id: string): Promise<Book | null> {
    return this.storage.get<Book>(STORES.BOOKS, id);
  }

  async getBookByHash(contentHash: string): Promise<Book | null> {
    const matches = await this.storage.getAllByIndex<Book>(STORES.BOOKS, 'by_contentHash', contentHash);
    return matches.length > 0 ? matches[0] : null;
  }

  async saveBook(book: Book, fileData?: ArrayBuffer | Blob): Promise<Book> {
    await this.storage.set<Book>(STORES.BOOKS, book.id, book);
    if (fileData) {
      await this.storage.saveBlob(book.id, fileData);
    }
    return book;
  }

  async updateBook(id: string, partial: Partial<Book>): Promise<Book> {
    return this.storage.update<Book>(STORES.BOOKS, id, partial);
  }

  async deleteBook(id: string): Promise<void> {
    await this.storage.delete(STORES.BOOKS, id);
    await this.storage.deleteBlob(id);
    
    // Clean up related progress and chunks
    const progress = await this.getProgressByBookId(id);
    if (progress) {
      await this.storage.delete(STORES.READING_PROGRESS, progress.id);
    }
    const chunks = await this.getChunksByBookId(id);
    for (const c of chunks) {
      await this.storage.delete(STORES.DOCUMENT_CHUNKS, c.id);
    }
  }

  async getBookFileData(bookId: string): Promise<ArrayBuffer | Blob | null> {
    return this.storage.getBlob(bookId);
  }

  // Reading Progress
  async getProgressByBookId(bookId: string): Promise<ReadingProgress | null> {
    const list = await this.storage.getAllByIndex<ReadingProgress>(STORES.READING_PROGRESS, 'by_bookId', bookId);
    return list.length > 0 ? list[0] : null;
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    await this.storage.set<ReadingProgress>(STORES.READING_PROGRESS, progress.id, progress);
  }

  async deleteProgress(id: string): Promise<void> {
    await this.storage.delete(STORES.READING_PROGRESS, id);
  }

  // Chunks for Search / AI RAG
  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.storage.set<DocumentChunk>(STORES.DOCUMENT_CHUNKS, chunk.id, chunk);
    }
  }

  async getChunksByBookId(bookId: string): Promise<DocumentChunk[]> {
    return this.storage.getAllByIndex<DocumentChunk>(STORES.DOCUMENT_CHUNKS, 'by_bookId', bookId);
  }

  async getAllChunks(): Promise<DocumentChunk[]> {
    return this.storage.getAll<DocumentChunk>(STORES.DOCUMENT_CHUNKS);
  }

  // Authors
  async getAllAuthors(): Promise<Author[]> {
    return this.storage.getAll<Author>(STORES.AUTHORS);
  }

  async saveAuthor(author: Author): Promise<void> {
    await this.storage.set<Author>(STORES.AUTHORS, author.id, author);
  }
}
