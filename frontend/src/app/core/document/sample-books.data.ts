import { Book, Author, ReadingProgress } from '../models/book.model';
import { Collection } from '../models/collection.model';

export function createCoverSvg(title: string, author: string, accentColor: string, iconType: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1120"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
    </defs>
    <rect width="300" height="400" fill="url(#bg)"/>
    <rect x="0" y="0" width="10" height="400" fill="${accentColor}" opacity="0.8"/>
    <circle cx="150" cy="170" r="60" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="4 4" opacity="0.4"/>
    <circle cx="150" cy="170" r="40" fill="${accentColor}" opacity="0.1"/>
    <text x="150" y="178" font-family="system-ui,sans-serif" font-size="28" font-weight="bold" fill="${accentColor}" text-anchor="middle">${iconType}</text>
    <rect x="25" y="30" width="70" height="20" rx="4" fill="${accentColor}" opacity="0.2"/>
    <text x="60" y="44" font-family="monospace" font-size="10" font-weight="bold" fill="${accentColor}" text-anchor="middle">OFFLINE REF</text>
    <text x="30" y="270" font-family="system-ui,sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">
      ${title.length > 22 ? title.slice(0, 20) + '...' : title}
    </text>
    <text x="30" y="295" font-family="system-ui,sans-serif" font-size="13" fill="#94a3b8">${author}</text>
    <line x1="30" y1="315" x2="270" y2="315" stroke="#334155" stroke-width="1"/>
    <text x="30" y="340" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">Folio Engineering Library</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export const REAL_AUTHORS: Author[] = [
  { id: 'auth-1', name: 'Martin Kleppmann', createdAt: new Date().toISOString() },
  { id: 'auth-2', name: 'Robert C. Martin', createdAt: new Date().toISOString() },
  { id: 'auth-3', name: 'Alex Xu', createdAt: new Date().toISOString() },
  { id: 'auth-4', name: 'Brendan Gregg', createdAt: new Date().toISOString() }
];

export const REAL_COLLECTIONS: Collection[] = [
  { id: 'col-1', name: 'Distributed Systems', color: '#38bdf8', orderIndex: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'col-2', name: 'Software Architecture', color: '#34d399', orderIndex: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'col-3', name: 'System Performance', color: '#fbbf24', orderIndex: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const REAL_BOOKS: Book[] = [
  {
    id: 'book-ddia',
    title: 'Designing Data-Intensive Applications',
    subtitle: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
    description: 'The definitive guide to distributed storage, consensus, partitioning, and replication in mission-critical applications.',
    language: 'en',
    publisher: "O'Reilly Media",
    publicationYear: 2017,
    pageCount: 560,
    fileType: 'pdf',
    fileSize: 14500000,
    contentHash: 'hash-ddia-prod-sha256-verified-key-99',
    coverDataUrl: createCoverSvg('Designing Data-Intensive', 'Martin Kleppmann', '#38bdf8', '⚡'),
    authorIds: ['auth-1'],
    authors: [REAL_AUTHORS[0]],
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
    description: 'Timeless structural rules and SOLID principles for decoupled, highly testable backend architectures.',
    language: 'en',
    publisher: 'Prentice Hall',
    publicationYear: 2018,
    pageCount: 432,
    fileType: 'epub',
    fileSize: 8200000,
    contentHash: 'hash-clean-arch-prod-sha256-key-88',
    coverDataUrl: createCoverSvg('Clean Architecture', 'Robert C. Martin', '#34d399', '🏛️'),
    authorIds: ['auth-2'],
    authors: [REAL_AUTHORS[1]],
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
    description: 'Battle-tested distributed systems architectures: message brokers, rate limiters, search autocomplete, and distributed logging.',
    language: 'en',
    publisher: 'ByteByteGo',
    publicationYear: 2022,
    pageCount: 380,
    fileType: 'pdf',
    fileSize: 11200000,
    contentHash: 'hash-sys-design-prod-sha256-key-77',
    coverDataUrl: createCoverSvg('System Design Interview', 'Alex Xu', '#818cf8', '📐'),
    authorIds: ['auth-3'],
    authors: [REAL_AUTHORS[2]],
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
    description: 'Master operating system internals, eBPF tracing, CPU scheduling, memory pressure, and network bottleneck analysis.',
    language: 'en',
    publisher: 'Addison-Wesley',
    publicationYear: 2020,
    pageCount: 780,
    fileType: 'epub',
    fileSize: 16800000,
    contentHash: 'hash-sys-perf-prod-sha256-key-66',
    coverDataUrl: createCoverSvg('Systems Performance', 'Brendan Gregg', '#f43f5e', '🔥'),
    authorIds: ['auth-4'],
    authors: [REAL_AUTHORS[3]],
    collectionIds: ['col-3'],
    tags: ['#performance', '#linux', '#ebpf', '#observability'],
    isFavorite: false,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
