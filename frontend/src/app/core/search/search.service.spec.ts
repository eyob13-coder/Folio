import { TestBed } from '@angular/core/testing';
import { FullTextSearchService } from './search.service';
import { BookRepository } from '../repositories/book.repository';
import { Book } from '../models/book.model';

describe('FullTextSearchService', () => {
  let service: FullTextSearchService;
  let mockBookRepo: jasmine.SpyObj<BookRepository>;

  const mockBooks: Book[] = [
    {
      id: 'book-1',
      title: 'Site Reliability Engineering',
      authorIds: [],
      contentHash: 'hash1',
      fileType: 'pdf',
      fileSize: 1024,
      isFavorite: false,
      readingStatus: 'reading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'How Google Runs Production Systems'
    }
  ];

  beforeEach(() => {
    mockBookRepo = jasmine.createSpyObj('BookRepository', [
      'getAllBooks',
      'getAllAuthors',
      'getAllChunks'
    ]);
    mockBookRepo.getAllBooks.and.returnValue(Promise.resolve(mockBooks));
    mockBookRepo.getAllAuthors.and.returnValue(Promise.resolve([]));
    mockBookRepo.getAllChunks.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        FullTextSearchService,
        { provide: BookRepository, useValue: mockBookRepo }
      ]
    });

    service = TestBed.inject(FullTextSearchService);
  });

  it('should initialize and build in-memory full-text search index', async () => {
    await service.buildIndex();
    const stats = service.searchStats();

    expect(stats.totalBooksIndexed).toBe(1);
    expect(mockBookRepo.getAllBooks).toHaveBeenCalled();
  });

  it('should find matching books with prefix/fuzzy query and return results', async () => {
    await service.buildIndex();
    const results = await service.search('Reliability');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].bookTitle).toBe('Site Reliability Engineering');
  });

  it('should return empty results for unmatched query terms', async () => {
    await service.buildIndex();
    const results = await service.search('NonExistentTermXYZ');

    expect(results.length).toBe(0);
  });
});
