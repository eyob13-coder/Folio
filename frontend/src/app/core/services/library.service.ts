import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { BookRepository } from '../repositories/book.repository';
import { CollectionRepository } from '../repositories/collection.repository';
import { DocumentProcessorFactory } from '../document/document-processor-factory.service';
import { calculateSha256 } from '../document/hashing.utils';
import { FullTextSearchService } from '../search/search.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Book, Author, ReadingProgress, FileType, ReadingStatus } from '../models/book.model';
import { Collection, Tag } from '../models/collection.model';
import { REAL_BOOKS, REAL_AUTHORS, REAL_COLLECTIONS } from '../document/sample-books.data';

export interface ImportProgress {
  totalFiles: number;
  processedFiles: number;
  currentFileName: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  importedBooks: Book[];
  duplicates: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private bookRepo = inject(BookRepository);
  private collectionRepo = inject(CollectionRepository);
  private processorFactory = inject(DocumentProcessorFactory);
  private searchService = inject(FullTextSearchService);
  private syncQueue = inject(SyncQueueService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  readonly books = signal<Book[]>([]);
  readonly authors = signal<Author[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly tags = signal<Tag[]>([]);
  readonly progressMap = signal<Map<string, ReadingProgress>>(new Map());
  readonly isLoading = signal<boolean>(true);

  readonly importState = signal<ImportProgress>({
    totalFiles: 0,
    processedFiles: 0,
    currentFileName: '',
    status: 'idle',
    importedBooks: [],
    duplicates: []
  });

  // Computed statistics for dashboard
  readonly stats = computed(() => {
    const allBooks = this.books();
    const allAuthors = this.authors();
    const allCollections = this.collections();
    const progressList = Array.from(this.progressMap().values());

    const totalPagesRead = progressList.reduce((sum, p) => sum + (p.currentPage || 0), 0);
    const readingCount = allBooks.filter(b => b.status === 'reading').length;
    const completedCount = allBooks.filter(b => b.status === 'completed').length;
    const favoritesCount = allBooks.filter(b => b.isFavorite).length;

    return {
      totalBooks: allBooks.length,
      totalAuthors: allAuthors.length,
      totalCollections: allCollections.length,
      totalPagesRead,
      readingCount,
      completedCount,
      favoritesCount
    };
  });

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Automatically purge any pre-seeded demo/mock books from storage
      const demoBookIds = ['book-ddia', 'book-clean-arch', 'book-sys-design', 'book-sys-perf'];
      for (const id of demoBookIds) {
        await this.bookRepo.deleteBook(id);
      }
      const demoColIds = ['col-1', 'col-2', 'col-3'];
      for (const id of demoColIds) {
        await this.collectionRepo.deleteCollection(id);
      }
      for (const a of REAL_AUTHORS) {
        await this.bookRepo.deleteAuthor?.(a.id);
      }

      await this.refreshLibrary();

      // Synchronize with backend if user is authenticated
      if (this.authService.isAuthenticated()) {
        await this.syncWithBackend();
      }

      await this.searchService.buildIndex();
    } finally {
      this.isLoading.set(false);
    }
  }

  async syncWithBackend(): Promise<void> {
    const token = this.authService.token();
    const user = this.authService.currentUser();
    if (!token || !user) return;

    try {
      const backendBooks = await firstValueFrom(
        this.http.get<any[]>(`${environment.api.baseUrl}/books`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': user.id
          }
        })
      );

      if (Array.isArray(backendBooks) && backendBooks.length > 0) {
        for (const b of backendBooks) {
          const book: Book = {
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            description: b.description,
            language: b.language || 'en',
            publisher: b.publisher,
            publicationYear: b.publicationYear,
            pageCount: b.pageCount || 0,
            fileType: b.fileType || 'pdf',
            fileSize: b.fileSize || 0,
            contentHash: b.contentHash || 'hash-' + b.id,
            coverDataUrl: b.coverDataUrl,
            authorIds: [],
            collectionIds: [],
            tags: ['synced'],
            isFavorite: b.isFavorite || false,
            status: b.status || 'unread',
            createdAt: b.createdAt || new Date().toISOString(),
            updatedAt: b.updatedAt || new Date().toISOString()
          };
          await this.bookRepo.saveBook(book);
        }
        await this.refreshLibrary();
      }
    } catch (err) {
      console.warn('Backend book sync offline or skipped:', err);
    }
  }

  async refreshLibrary(): Promise<void> {
    const [booksList, authorsList, collectionsList, tagsList] = await Promise.all([
      this.bookRepo.getAllBooks(),
      this.bookRepo.getAllAuthors(),
      this.collectionRepo.getAllCollections(),
      this.collectionRepo.getAllTags()
    ]);

    const authorMap = new Map<string, Author>();
    authorsList.forEach(a => authorMap.set(a.id, a));

    const enrichedBooks = booksList.map(book => {
      const resolved = (book.authorIds || []).map(id => authorMap.get(id)).filter(Boolean) as Author[];
      return {
        ...book,
        authors: (book.authors && book.authors.length > 0) ? book.authors : (resolved.length > 0 ? resolved : undefined)
      };
    });

    this.books.set(enrichedBooks);
    this.authors.set(authorsList);
    this.collections.set(collectionsList);
    this.tags.set(tagsList);

    // Load progress for all books
    const pMap = new Map<string, ReadingProgress>();
    for (const book of booksList) {
      const progress = await this.bookRepo.getProgressByBookId(book.id);
      if (progress) {
        pMap.set(book.id, progress);
      }
    }
    this.progressMap.set(pMap);
  }

  async importFiles(files: FileList | File[]): Promise<ImportProgress> {
    const fileArray = Array.from(files);
    this.importState.set({
      totalFiles: fileArray.length,
      processedFiles: 0,
      currentFileName: '',
      status: 'processing',
      importedBooks: [],
      duplicates: []
    });

    const imported: Book[] = [];
    const dupes: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      this.importState.update(s => ({
        ...s,
        currentFileName: file.name,
        processedFiles: i
      }));

      try {
        const processor = this.processorFactory.getProcessorForFile(file);
        if (!processor) {
          throw new Error(`Unsupported format: ${file.name}. Only PDF and EPUB files are supported.`);
        }

        const buffer = await file.arrayBuffer();
        const contentHash = await calculateSha256(buffer);

        // Check for duplicate SHA-256
        const existing = await this.bookRepo.getBookByHash(contentHash);
        if (existing) {
          const existingBinary = await this.bookRepo.getBookFileData(existing.id);
          if (!existingBinary) {
            await this.bookRepo.saveBook(existing, file);
            imported.push(existing);
            continue;
          }
          dupes.push(file.name);
          continue;
        }

        // Extract metadata and cover
        const metadata = await processor.extractMetadata(buffer.slice(0), file.name);

        // Ensure authors exist
        const authorIds: string[] = [];
        for (const authorName of metadata.authors) {
          let author = this.authors().find(a => a.name.toLowerCase() === authorName.toLowerCase());
          if (!author) {
            author = {
              id: uuidv4(),
              name: authorName,
              createdAt: new Date().toISOString()
            };
            await this.bookRepo.saveAuthor(author);
          }
          authorIds.push(author.id);
        }

        const now = new Date().toISOString();
        const bookId = uuidv4();

        const newBook: Book = {
          id: bookId,
          title: metadata.title,
          subtitle: metadata.subtitle,
          description: metadata.description,
          language: metadata.language || 'en',
          publisher: metadata.publisher,
          publicationYear: metadata.publicationYear,
          pageCount: metadata.pageCount,
          fileType: processor.supportedType,
          fileSize: file.size,
          contentHash,
          coverDataUrl: metadata.coverDataUrl,
          authorIds,
          collectionIds: [],
          tags: ['imported'],
          isFavorite: false,
          status: 'unread',
          createdAt: now,
          updatedAt: now
        };

        // Extract searchable chunks in background
        const chunks = await processor.extractChunks(buffer.slice(0), bookId);
        await this.bookRepo.saveChunks(chunks);

        // Save Book & File Binary (store the Blob directly to prevent detachment)
        await this.bookRepo.saveBook(newBook, file);
        await this.syncQueue.recordAction('CREATE_BOOK', 'Book', bookId, newBook);

        // Sync with backend if user is authenticated
        if (this.authService.isAuthenticated()) {
          const token = this.authService.token();
          const user = this.authService.currentUser();
          if (token && user) {
            this.http.post(`${environment.api.baseUrl}/books`, {
              id: bookId,
              userId: user.id,
              title: newBook.title,
              subtitle: newBook.subtitle,
              description: newBook.description,
              language: newBook.language,
              publisher: newBook.publisher,
              publicationYear: newBook.publicationYear,
              pageCount: newBook.pageCount,
              fileType: newBook.fileType,
              fileSize: newBook.fileSize,
              contentHash: newBook.contentHash,
              isFavorite: newBook.isFavorite,
              status: newBook.status
            }, {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-User-Id': user.id
              }
            }).subscribe({ error: () => {} });
          }
        }

        imported.push(newBook);
      } catch (err: any) {
        console.error(`Error importing ${file.name}:`, err);
      }
    }

    await this.refreshLibrary();
    await this.searchService.buildIndex();

    const finalState: ImportProgress = {
      totalFiles: fileArray.length,
      processedFiles: fileArray.length,
      currentFileName: '',
      status: 'completed',
      importedBooks: imported,
      duplicates: dupes
    };

    this.importState.set(finalState);
    return finalState;
  }

  async toggleFavorite(bookId: string): Promise<void> {
    const book = this.books().find(b => b.id === bookId);
    if (!book) return;

    const isFavorite = !book.isFavorite;
    await this.bookRepo.updateBook(bookId, { isFavorite });
    await this.syncQueue.recordAction('UPDATE_BOOK', 'Book', bookId, { isFavorite });
    
    this.books.update(list => list.map(b => b.id === bookId ? { ...b, isFavorite } : b));
  }

  async updateReadingStatus(bookId: string, status: ReadingStatus): Promise<void> {
    await this.bookRepo.updateBook(bookId, { status });
    await this.syncQueue.recordAction('UPDATE_BOOK', 'Book', bookId, { status });
    this.books.update(list => list.map(b => b.id === bookId ? { ...b, status } : b));
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.bookRepo.deleteBook(bookId);
    await this.syncQueue.recordAction('DELETE_BOOK', 'Book', bookId, { id: bookId });
    if (this.authService.isAuthenticated()) {
      const token = this.authService.token();
      const user = this.authService.currentUser();
      if (token && user) {
        this.http.delete(`${environment.api.baseUrl}/books/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': user.id
          }
        }).subscribe({ error: () => {} });
      }
    }
    await this.refreshLibrary();
    await this.searchService.buildIndex();
  }

  // Collections Management
  async createCollection(name: string, description?: string, color: string = '#22c55e'): Promise<Collection> {
    const newCol: Collection = {
      id: uuidv4(),
      name,
      description,
      color,
      orderIndex: this.collections().length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.collectionRepo.saveCollection(newCol);
    await this.syncQueue.recordAction('CREATE_COLLECTION', 'Collection', newCol.id, newCol);
    this.collections.update(c => [...c, newCol]);
    return newCol;
  }

  async deleteCollection(id: string): Promise<void> {
    await this.collectionRepo.deleteCollection(id);
    await this.syncQueue.recordAction('DELETE_COLLECTION', 'Collection', id, { id });
    this.collections.update(c => c.filter(item => item.id !== id));
  }

  async addBookToCollection(bookId: string, collectionId: string): Promise<void> {
    const book = this.books().find(b => b.id === bookId);
    if (!book) return;
    const collectionIds = Array.from(new Set([...(book.collectionIds || []), collectionId]));
    await this.bookRepo.updateBook(bookId, { collectionIds });
    this.books.update(list => list.map(b => b.id === bookId ? { ...b, collectionIds } : b));
  }

  async removeBookFromCollection(bookId: string, collectionId: string): Promise<void> {
    const book = this.books().find(b => b.id === bookId);
    if (!book) return;
    const collectionIds = (book.collectionIds || []).filter(id => id !== collectionId);
    await this.bookRepo.updateBook(bookId, { collectionIds });
    this.books.update(list => list.map(b => b.id === bookId ? { ...b, collectionIds } : b));
  }

  // Pre-seed sample library for instant recruiter evaluation
  async seedDemoLibrary(): Promise<void> {
    for (const a of REAL_AUTHORS) await this.bookRepo.saveAuthor(a);
    for (const c of REAL_COLLECTIONS) await this.collectionRepo.saveCollection(c);
    for (const b of REAL_BOOKS) await this.bookRepo.saveBook(b);

    // Seed Deep Chunks for Local RAG & Full-Text Search
    const sampleChunks = [
      {
        id: 'chunk-ddia-1',
        bookId: 'book-ddia',
        pageNumber: 334,
        chapterTitle: 'Chapter 9: Consistency and Consensus',
        text: 'The CAP theorem states that in a distributed computer system that has network partitions, you can have Consistency or Availability, but not both. Specifically, if network links between nodes fail, a system must either return an error (favoring consistency) or proceed with potentially stale data (favoring availability). More nuanced systems follow PACELC: if partition, choose Availability or Consistency; else choose Latency or Consistency.',
        tokenCount: 72
      },
      {
        id: 'chunk-ddia-2',
        bookId: 'book-ddia',
        pageNumber: 151,
        chapterTitle: 'Chapter 5: Replication',
        text: 'In leader-based replication, all write requests are sent to the leader node, which writes the new data to its local storage and sends the data change to all its followers as part of a replication log or change stream. Read requests can be handled by the leader or any follower.',
        tokenCount: 52
      },
      {
        id: 'chunk-clean-1',
        bookId: 'book-clean-arch',
        pageNumber: 127,
        chapterTitle: 'Chapter 14: Component Coupling',
        text: 'The Dependency Inversion Principle (DIP) tells us that the most flexible systems are those in which source code dependencies refer only to abstractions, not to concretions. High-level policy modules should not depend on low-level detail modules; both should depend on abstractions.',
        tokenCount: 46
      },
      {
        id: 'chunk-clean-2',
        bookId: 'book-clean-arch',
        pageNumber: 85,
        chapterTitle: 'Chapter 9: LSP: The Liskov Substitution Principle',
        text: 'What is wanted here is something like the following principle for software components: If for each object o1 of type S there is an object o2 of type T such that for all programs P defined in terms of T, the behavior of P is unchanged when o1 is substituted for o2, then S is a subtype of T.',
        tokenCount: 62
      },
      {
        id: 'chunk-sys-1',
        bookId: 'book-sys-design',
        pageNumber: 42,
        chapterTitle: 'Chapter 2: Back-of-the-envelope Estimation',
        text: 'Understanding latency numbers every programmer should know: L1 cache reference is 0.5 ns, Branch mispredict is 5 ns, Mutex lock/unlock is 100 ns, Main memory reference is 100 ns, Read 1 MB sequentially from memory is 3,000 ns (3 µs), SSD random read is 16,000 ns (16 µs), Send 1 MB over 1 Gbps network is 10,000,000 ns (10 ms).',
        tokenCount: 75
      },
      {
        id: 'chunk-perf-1',
        bookId: 'book-sys-perf',
        pageNumber: 210,
        chapterTitle: 'Chapter 6: Modern eBPF Tracing & Flame Graphs',
        text: 'Extended Berkeley Packet Filter (eBPF) allows running sandboxed programs in the Linux kernel without changing kernel source code. Flame Graphs visualize profiled CPU stack traces where the x-axis represents sample population and y-axis shows stack depth. Wider boxes indicate more CPU time consumed.',
        tokenCount: 65
      }
    ];

    await this.bookRepo.saveChunks(sampleChunks);
    await this.refreshLibrary();
  }
}
