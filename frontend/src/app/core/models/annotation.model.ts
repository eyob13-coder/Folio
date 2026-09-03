export interface Bookmark {
  id: string;
  bookId: string;
  location: string | number; // page number (PDF) or CFI string (EPUB)
  pageNumber?: number;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  location: string | number;
  pageNumber?: number;
  selectedText: string;
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  highlightId?: string;
  location?: string | number;
  pageNumber?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
}
