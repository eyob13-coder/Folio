import { z } from 'zod';

export type FileType = 'pdf' | 'epub';
export type ReadingStatus = 'unread' | 'reading' | 'completed';

export interface Author {
  id: string;
  name: string;
  bio?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  language: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  pageCount: number;
  fileType: FileType;
  fileSize: number;
  contentHash: string; // SHA-256
  coverDataUrl?: string;
  authorIds: string[];
  authors?: Author[];
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  status: ReadingStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;

  // Storage reference for local-first binary payload
  blobId?: string;
  fileData?: ArrayBuffer | Blob;
}

export interface ReadingProgress {
  id: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  chapter?: string;
  locationCfi?: string; // For EPUB
  scrollPosition?: number;
  zoomLevel?: number;
  lastReadAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  bookId: string;
  pageNumber?: number;
  chapterTitle?: string;
  text: string;
  embedding?: number[];
  tokenCount?: number;
}

export const BookSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  language: z.string().default('en'),
  publisher: z.string().optional(),
  publicationYear: z.number().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().int().nonnegative().default(0),
  fileType: z.enum(['pdf', 'epub']),
  fileSize: z.number().nonnegative(),
  contentHash: z.string().min(10),
  coverDataUrl: z.string().optional(),
  authorIds: z.array(z.string()),
  collectionIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  status: z.enum(['unread', 'reading', 'completed']).default('unread'),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastOpenedAt: z.string().optional()
});
