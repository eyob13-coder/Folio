import { Injectable, inject, signal, computed } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { BookRepository } from '../repositories/book.repository';
import { CollectionRepository } from '../repositories/collection.repository';
import { DocumentProcessorFactory } from '../document/document-processor-factory.service';
import { calculateSha256 } from '../document/hashing.utils';
import { FullTextSearchService } from '../search/search.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { Book, Author, ReadingProgress, FileType, ReadingStatus } from '../models/book.model';
import { Collection, Tag } from '../models/collection.model';

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
      await this.refreshLibrary();
      if (this.books().length === 0) {
        await this.seedDemoLibrary();
      }
      await this.searchService.buildIndex();
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshLibrary(): Promise<void> {
    const [booksList, authorsList, collectionsList, tagsList] = await Promise.all([
      this.bookRepo.getAllBooks(),
      this.bookRepo.getAllAuthors(),
      this.collectionRepo.getAllCollections(),
      this.collectionRepo.getAllTags()
    ]);

    this.books.set(booksList);
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
          dupes.push(file.name);
          continue;
        }

        // Extract metadata and cover
        const metadata = await processor.extractMetadata(buffer, file.name);

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
        const chunks = await processor.extractChunks(buffer, bookId);
        await this.bookRepo.saveChunks(chunks);

        // Save Book & File Binary
        await this.bookRepo.saveBook(newBook, buffer);
        await this.syncQueue.recordAction('CREATE_BOOK', 'Book', bookId, newBook);

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
    const sampleAuthors: Author[] = [
      { id: 'auth-1', name: 'Martin Kleppmann', createdAt: new Date().toISOString() },
      { id: 'auth-2', name: 'Robert C. Martin', createdAt: new Date().toISOString() },
      { id: 'auth-3', name: 'Alex Xu', createdAt: new Date().toISOString() },
      { id: 'auth-4', name: 'Brendan Gregg', createdAt: new Date().toISOString() }
    ];
    for (const a of sampleAuthors) await this.bookRepo.saveAuthor(a);

    const sampleCollections: Collection[] = [
      { id: 'col-1', name: 'Distributed Systems', color: '#3b82f6', orderIndex: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'col-2', name: 'Software Architecture', color: '#10b981', orderIndex: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'col-3', name: 'System Performance', color: '#f59e0b', orderIndex: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    for (const c of sampleCollections) await this.collectionRepo.saveCollection(c);

    const sampleBooks: Book[] = [
      {
        id: 'book-ddia',
        title: 'Designing Data-Intensive Applications',
        subtitle: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
        description: 'Data is at the center of many challenges in system design today. Explore the key principles of distributed data systems, replication, partitioning, and consensus.',
        language: 'en',
        publisher: "O'Reilly Media",
        publicationYear: 2017,
        pageCount: 560,
        fileType: 'pdf',
        fileSize: 14500000,
        contentHash: 'hash-ddia-prod-sha256-verified-key-99',
        authorIds: ['auth-1'],
        collectionIds: ['col-1'],
        tags: ['#distributed-systems', '#databases', '#consensus', '#scalability'],
        isFavorite: true,
        status: 'reading',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString()
      },
      {
        id: 'book-clean-arch',
        title: 'Clean Architecture',
        subtitle: "A Craftsman's Guide to Software Structure and Design",
        description: 'Practical software architecture rules for building modular, maintainable, and testable enterprise applications without framework lock-in.',
        language: 'en',
        publisher: 'Prentice Hall',
        publicationYear: 2018,
        pageCount: 432,
        fileType: 'epub',
        fileSize: 8200000,
        contentHash: 'hash-clean-arch-prod-sha256-key-88',
        authorIds: ['auth-2'],
        collectionIds: ['col-2'],
        tags: ['#architecture', '#solid-principles', '#design-patterns'],
        isFavorite: true,
        status: 'reading',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        updatedAt: new Date().toISOString(),
        lastOpenedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'book-sys-design',
        title: 'System Design Interview',
        subtitle: "An Insider's Guide Volume 2",
        description: 'Deep dive into real-world architecture questions: distributed message queues, metrics collectors, ad click aggregators, and search autocomplete.',
        language: 'en',
        publisher: 'ByteByteGo',
        publicationYear: 2022,
        pageCount: 380,
        fileType: 'pdf',
        fileSize: 11200000,
        contentHash: 'hash-sys-design-prod-sha256-key-77',
        authorIds: ['auth-3'],
        collectionIds: ['col-1'],
        tags: ['#system-design', '#microservices', '#interview-prep'],
        isFavorite: false,
        status: 'unread',
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'book-sys-perf',
        title: 'Systems Performance',
        subtitle: 'Enterprise and the Cloud',
        description: 'Covers observability, CPU architectures, disk I/O, memory bottlenecks, network latency, and eBPF tracing tools for modern cloud infrastructure.',
        language: 'en',
        publisher: 'Addison-Wesley',
        publicationYear: 2020,
        pageCount: 780,
        fileType: 'epub',
        fileSize: 16800000,
        contentHash: 'hash-sys-perf-prod-sha256-key-66',
        authorIds: ['auth-4'],
        collectionIds: ['col-3'],
        tags: ['#performance', '#linux', '#ebpf', '#observability'],
        isFavorite: false,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const b of sampleBooks) await this.bookRepo.saveBook(b);

    // Seed Reading Progress
    const ddiaProgress: ReadingProgress = {
      id: 'prog-ddia',
      bookId: 'book-ddia',
      currentPage: 334,
      totalPages: 560,
      percentage: 60,
      scrollPosition: 0,
      zoomLevel: 100,
      lastReadAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.bookRepo.saveProgress(ddiaProgress);

    const cleanArchProgress: ReadingProgress = {
      id: 'prog-clean-arch',
      bookId: 'book-clean-arch',
      currentPage: 127,
      totalPages: 432,
      percentage: 29,
      chapter: 'Chapter 14: Component Coupling',
      lastReadAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.bookRepo.saveProgress(cleanArchProgress);

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
      }
    ];

    await this.bookRepo.saveChunks(sampleChunks);
    await this.refreshLibrary();
  }
}
