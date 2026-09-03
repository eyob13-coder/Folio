import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnnotationRepository } from '../../../core/repositories/annotation.repository';
import { BookRepository } from '../../../core/repositories/book.repository';
import { Bookmark, Highlight, Note } from '../../../core/models/annotation.model';
import { Book } from '../../../core/models/book.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

interface AnnotationItem {
  type: 'bookmark' | 'highlight' | 'note';
  bookId: string;
  bookTitle: string;
  label: string;
  content?: string;
  color?: string;
  createdAt: string;
}

@Component({
  selector: 'app-annotations-browser',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-100">Annotations</h1>
        <p class="text-sm text-slate-400 mt-1">Browse all bookmarks, highlights, and notes across your library</p>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 mb-6">
        @for (tab of filterTabs; track tab.key) {
          <button
            (click)="activeFilter.set(tab.key)"
            class="px-4 py-2 text-sm rounded-xl font-medium transition-all"
            [class]="activeFilter() === tab.key
              ? 'bg-brand-600 text-white'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40'"
          >
            {{ tab.icon }} {{ tab.label }}
            <span class="ml-1 opacity-60">({{ getCount(tab.key) }})</span>
          </button>
        }
      </div>

      <!-- Annotation list -->
      <div class="space-y-3">
        @for (item of filteredAnnotations(); track item.bookId + item.label + item.createdAt) {
          <div class="p-4 bg-slate-800/40 border border-slate-700/40 rounded-2xl
            hover:bg-slate-800/60 transition-all group">
            <div class="flex items-start gap-3">
              <span class="text-lg mt-0.5">
                {{ item.type === 'bookmark' ? '🔖' : item.type === 'highlight' ? '🖍️' : '📝' }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-sm text-slate-200">{{ item.label }}</span>
                  <app-badge [variant]="typeBadge[item.type]" size="sm">{{ item.type }}</app-badge>
                </div>
                @if (item.content) {
                  <p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {{ item.content }}
                  </p>
                }
                <div class="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                  <span>📕 {{ item.bookTitle }}</span>
                  <span>{{ item.createdAt | date:'MMM d, y' }}</span>
                </div>
              </div>
              @if (item.color) {
                <div class="w-3 h-3 rounded-full shrink-0"
                  [style.background-color]="item.color"></div>
              }
            </div>
          </div>
        } @empty {
          <div class="py-16 text-center">
            <p class="text-4xl mb-3">🔖</p>
            <p class="text-slate-400">No annotations found</p>
            <p class="text-xs text-slate-500 mt-1">Start reading and adding bookmarks, highlights, or notes</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AnnotationsBrowserComponent implements OnInit {
  private annotationRepo = inject(AnnotationRepository);
  private bookRepo = inject(BookRepository);

  activeFilter = signal<'all' | 'bookmark' | 'highlight' | 'note'>('all');
  allAnnotations = signal<AnnotationItem[]>([]);

  filterTabs = [
    { key: 'all' as const, label: 'All', icon: '📋' },
    { key: 'bookmark' as const, label: 'Bookmarks', icon: '🔖' },
    { key: 'highlight' as const, label: 'Highlights', icon: '🖍️' },
    { key: 'note' as const, label: 'Notes', icon: '📝' },
  ];

  typeBadge: Record<string, 'info' | 'warning' | 'success'> = {
    bookmark: 'info',
    highlight: 'warning',
    note: 'success',
  };

  getCount(key: string): number {
    if (key === 'all') return this.allAnnotations().length;
    return this.allAnnotations().filter(a => a.type === key).length;
  }

  filteredAnnotations = () => {
    const filter = this.activeFilter();
    const all = this.allAnnotations();
    return filter === 'all' ? all : all.filter(a => a.type === filter);
  };

  async ngOnInit(): Promise<void> {
    const books = await this.bookRepo.getAllBooks();
    const bookMap = new Map<string, Book>(books.map(b => [b.id, b]));
    const [bookmarks, highlights, notes] = await Promise.all([
      this.annotationRepo.getAllBookmarks(),
      this.annotationRepo.getAllHighlights(),
      this.annotationRepo.getAllNotes()
    ]);

    const items: AnnotationItem[] = [];

    bookmarks.forEach((bm: Bookmark) => items.push({
      type: 'bookmark',
      bookId: bm.bookId,
      bookTitle: bookMap.get(bm.bookId)?.title || 'Unknown Book',
      label: bm.label,
      createdAt: bm.createdAt,
    }));

    highlights.forEach((hl: Highlight) => items.push({
      type: 'highlight',
      bookId: hl.bookId,
      bookTitle: bookMap.get(hl.bookId)?.title || 'Unknown Book',
      label: hl.selectedText.slice(0, 80),
      content: hl.selectedText,
      color: hl.color,
      createdAt: hl.createdAt,
    }));

    notes.forEach((n: Note) => items.push({
      type: 'note',
      bookId: n.bookId,
      bookTitle: bookMap.get(n.bookId)?.title || 'Unknown Book',
      label: n.content ? n.content.slice(0, 40) : 'Untitled Note',
      content: n.content,
      createdAt: n.createdAt,
    }));

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.allAnnotations.set(items);
  }
}
