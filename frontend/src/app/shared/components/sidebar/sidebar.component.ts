import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LibraryService } from '../../../core/services/library.service';
import { 
  LucideAngularModule, 
  Library, 
  BookMarked, 
  Heart, 
  FolderPlus, 
  Tag as TagIcon, 
  Sparkles, 
  ArrowLeftRight, 
  Layers,
  Plus
} from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="w-64 h-full shrink-0 border-r border-slate-800/80 bg-slate-950/40 p-4 flex flex-col justify-between overflow-y-auto">
      <div class="space-y-6">
        <!-- Main Navigation Links -->
        <nav class="space-y-1">
          <a 
            routerLink="/" 
            routerLinkActive="bg-brand-500/10 text-brand-400 border-brand-500/30"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all">
            <lucide-icon [img]="LibraryIcon" class="w-4 h-4"></lucide-icon>
            <span>All Books</span>
            <span class="ml-auto text-xs font-mono text-slate-500">{{ libraryService.books().length }}</span>
          </a>

          <a 
            routerLink="/favorites" 
            routerLinkActive="bg-brand-500/10 text-brand-400 border-brand-500/30"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all">
            <lucide-icon [img]="HeartIcon" class="w-4 h-4 text-rose-400"></lucide-icon>
            <span>Favorites</span>
            <span class="ml-auto text-xs font-mono text-slate-500">{{ libraryService.stats().favoritesCount }}</span>
          </a>

          <a 
            routerLink="/reading" 
            routerLinkActive="bg-brand-500/10 text-brand-400 border-brand-500/30"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all">
            <lucide-icon [img]="BookMarkedIcon" class="w-4 h-4 text-emerald-400"></lucide-icon>
            <span>Currently Reading</span>
            <span class="ml-auto text-xs font-mono text-slate-500">{{ libraryService.stats().readingCount }}</span>
          </a>
        </nav>

        <!-- Flagship Features Highlight -->
        <div>
          <div class="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <span>Special Features</span>
            <span class="text-[9px] bg-brand-500/20 text-brand-400 font-mono px-1.5 py-0.5 rounded">Flagships</span>
          </div>
          <div class="space-y-1">
            <a 
              routerLink="/ai-assistant" 
              routerLinkActive="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all group">
              <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"></lucide-icon>
              <span>Local RAG Book Q&A</span>
            </a>

            <a 
              routerLink="/sync-demo" 
              routerLinkActive="bg-brand-500/10 text-brand-400 border-brand-500/30"
              class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all group">
              <lucide-icon [img]="SyncIcon" class="w-4 h-4 text-brand-400 group-hover:rotate-180 transition-transform duration-500"></lucide-icon>
              <span>Sync & Conflict Demo</span>
            </a>
          </div>
        </div>

        <!-- Collections Section -->
        <div>
          <div class="px-3 pb-2 flex items-center justify-between">
            <span class="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Collections</span>
            <button 
              (click)="createCollection.emit()"
              class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Add Collection">
              <lucide-icon [img]="PlusIcon" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          </div>

          <div class="space-y-1">
            @for (col of libraryService.collections(); track col.id) {
              <a 
                [routerLink]="['/']"
                [queryParams]="{ collection: col.id }"
                class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent transition-all">
                <span class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="col.color || '#22c55e'"></span>
                <span class="truncate">{{ col.name }}</span>
              </a>
            }
            @if (libraryService.collections().length === 0) {
              <p class="px-3 py-1 text-xs text-slate-500 italic">No collections yet</p>
            }
          </div>
        </div>

        <!-- Popular Tags -->
        @if (allTags().length > 0) {
          <div>
            <div class="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Tags
            </div>
            <div class="flex flex-wrap gap-1.5 px-2">
              @for (tag of allTags(); track tag) {
                <a 
                  [routerLink]="['/']"
                  [queryParams]="{ tag: tag.replace('#', '') }"
                  class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:border-brand-500/50 hover:text-brand-300 cursor-pointer transition-colors">
                  {{ tag }}
                </a>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer Info -->
      <div class="pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
        <span>SQLite / IDB Storage</span>
        <span class="text-brand-400 font-mono">100% Offline</span>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly libraryService = inject(LibraryService);
  readonly createCollection = output<void>();

  readonly LibraryIcon = Library;
  readonly BookMarkedIcon = BookMarked;
  readonly HeartIcon = Heart;
  readonly FolderPlusIcon = FolderPlus;
  readonly TagIcon = TagIcon;
  readonly SparklesIcon = Sparkles;
  readonly SyncIcon = ArrowLeftRight;
  readonly LayersIcon = Layers;
  readonly PlusIcon = Plus;

  allTags(): string[] {
    const set = new Set<string>();
    for (const b of this.libraryService.books()) {
      for (const t of (b.tags || [])) set.add(t);
    }
    return Array.from(set).slice(0, 8);
  }
}
