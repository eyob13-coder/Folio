import { Injectable, inject, signal } from '@angular/core';
import MiniSearch from 'minisearch';
import { BookRepository } from '../repositories/book.repository';
import { Book, FileType, ReadingStatus } from '../models/book.model';

export interface SearchFilter {
  fileType?: FileType | 'all';
  status?: ReadingStatus | 'all';
  collectionId?: string;
  tag?: string;
}

export interface SearchResultItem {
  id: string;
  bookId: string;
  bookTitle: string;
  authorNames: string;
  coverDataUrl?: string;
  fileType: FileType;
  matchType: 'metadata' | 'content';
  pageNumber?: number;
  chapterTitle?: string;
  snippet: string;
  highlightedSnippet: string;
  score: number;
}

export interface SearchStats {
  totalBooksIndexed: number;
  totalChunksIndexed: number;
  totalWordsIndexed: number;
  lastSearchDurationMs: number;
  query: string;
  resultsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FullTextSearchService {
  private bookRepo = inject(BookRepository);
  private miniSearch: MiniSearch<any> | null = null;
  private isIndexReady = false;

  readonly searchStats = signal<SearchStats>({
    totalBooksIndexed: 0,
    totalChunksIndexed: 0,
    totalWordsIndexed: 0,
    lastSearchDurationMs: 0,
    query: '',
    resultsCount: 0
  });

  async buildIndex(): Promise<void> {
    const startTime = performance.now();
    this.miniSearch = new MiniSearch({
      fields: ['title', 'author', 'description', 'tags', 'content'],
      storeFields: ['id', 'bookId', 'title', 'author', 'coverDataUrl', 'fileType', 'matchType', 'pageNumber', 'chapterTitle', 'content'],
      searchOptions: {
        boost: { title: 3, author: 2, tags: 2, content: 1 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    const books = await this.bookRepo.getAllBooks();
    const authors = await this.bookRepo.getAllAuthors();
    const authorMap = new Map(authors.map(a => [a.id, a.name]));
    const chunks = await this.bookRepo.getAllChunks();

    const documents: any[] = [];
    let wordCount = 0;

    // Index Book Metadata
    for (const book of books) {
      const authorNames = (book.authorIds || []).map(id => authorMap.get(id) || '').join(', ') || 'Unknown Author';
      const desc = book.description || '';
      wordCount += (book.title + ' ' + desc).split(/\s+/).length;

      documents.push({
        id: `book_${book.id}`,
        bookId: book.id,
        title: book.title,
        author: authorNames,
        description: desc,
        tags: (book.tags || []).join(' '),
        coverDataUrl: book.coverDataUrl,
        fileType: book.fileType,
        matchType: 'metadata',
        content: `${book.title} ${desc} ${(book.tags || []).join(' ')}`
      });
    }

    // Index Book Text Chunks
    const bookMap = new Map(books.map(b => [b.id, b]));
    for (const chunk of chunks) {
      const parentBook = bookMap.get(chunk.bookId);
      if (parentBook) {
        const authorNames = (parentBook.authorIds || []).map(id => authorMap.get(id) || '').join(', ');
        wordCount += chunk.text.split(/\s+/).length;

        documents.push({
          id: `chunk_${chunk.id}`,
          bookId: chunk.bookId,
          title: parentBook.title,
          author: authorNames,
          coverDataUrl: parentBook.coverDataUrl,
          fileType: parentBook.fileType,
          matchType: 'content',
          pageNumber: chunk.pageNumber,
          chapterTitle: chunk.chapterTitle,
          content: chunk.text
        });
      }
    }

    this.miniSearch.addAll(documents);
    this.isIndexReady = true;

    this.searchStats.update(s => ({
      ...s,
      totalBooksIndexed: books.length,
      totalChunksIndexed: chunks.length,
      totalWordsIndexed: wordCount,
      lastSearchDurationMs: Math.round(performance.now() - startTime)
    }));
  }

  async search(query: string, filter?: SearchFilter): Promise<SearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    if (!this.isIndexReady || !this.miniSearch) {
      await this.buildIndex();
    }

    const startTime = performance.now();
    const rawResults = this.miniSearch!.search(query.trim());

    const books = await this.bookRepo.getAllBooks();
    const bookMap = new Map(books.map(b => [b.id, b]));

    const searchResults: SearchResultItem[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    for (const res of rawResults) {
      const parentBook = bookMap.get(res['bookId']);
      if (!parentBook) continue;

      // Apply Filters
      if (filter) {
        if (filter.fileType && filter.fileType !== 'all' && parentBook.fileType !== filter.fileType) continue;
        if (filter.status && filter.status !== 'all' && parentBook.status !== filter.status) continue;
        if (filter.collectionId && !parentBook.collectionIds?.includes(filter.collectionId)) continue;
        if (filter.tag && !parentBook.tags?.includes(filter.tag)) continue;
      }

      const contentText = (res['content'] || '') as string;
      const snippet = this.generateSnippet(contentText, queryTerms);
      const highlightedSnippet = this.highlightTerms(snippet, queryTerms);

      searchResults.push({
        id: String(res['id']),
        bookId: String(res['bookId']),
        bookTitle: String(res['title']),
        authorNames: String(res['author']),
        coverDataUrl: res['coverDataUrl'] as string | undefined,
        fileType: res['fileType'] as FileType,
        matchType: res['matchType'] as 'metadata' | 'content',
        pageNumber: res['pageNumber'] as number | undefined,
        chapterTitle: res['chapterTitle'] as string | undefined,
        snippet,
        highlightedSnippet,
        score: res.score
      });
    }

    const duration = Math.round((performance.now() - startTime) * 10) / 10;
    this.searchStats.update(s => ({
      ...s,
      lastSearchDurationMs: duration,
      query,
      resultsCount: searchResults.length
    }));

    return searchResults;
  }

  private generateSnippet(text: string, terms: string[], snippetLength: number = 180): string {
    if (!text) return '';
    const lower = text.toLowerCase();
    let bestIndex = -1;

    for (const term of terms) {
      const idx = lower.indexOf(term);
      if (idx !== -1) {
        bestIndex = idx;
        break;
      }
    }

    if (bestIndex === -1) {
      return text.slice(0, snippetLength) + (text.length > snippetLength ? '...' : '');
    }

    const start = Math.max(0, bestIndex - Math.floor(snippetLength / 3));
    const end = Math.min(text.length, start + snippetLength);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return prefix + text.slice(start, end).trim() + suffix;
  }

  private highlightTerms(text: string, terms: string[]): string {
    if (!text || terms.length === 0) return text;
    let result = text;
    for (const term of terms) {
      if (term.length < 2) continue;
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="bg-brand-500/30 text-brand-300 font-semibold px-0.5 rounded">$1</mark>');
    }
    return result;
  }
}
