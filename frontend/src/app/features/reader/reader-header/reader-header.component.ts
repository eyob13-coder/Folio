import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../core/models/book.model';
import { ReaderTheme } from '../../../core/models/settings.model';
import { 
  LucideAngularModule, 
  ArrowLeft, 
  Bookmark, 
  Sparkles, 
  PanelRight, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon, 
  BookMarked 
} from 'lucide-angular';

@Component({
  selector: 'app-reader-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <header class="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
      <!-- Left: Back & Title -->
      <div class="flex items-center gap-3 max-w-[50%]">
        <a routerLink="/" class="p-2 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white transition-colors" title="Back to Library">
          <lucide-icon [img]="BackIcon" class="w-4 h-4"></lucide-icon>
        </a>
        <div class="truncate">
          <h1 class="text-xs sm:text-sm font-bold text-white truncate">{{ book().title }}</h1>
          <p class="text-[11px] text-slate-400 truncate hidden sm:block">{{ book().subtitle || (book().authors?.[0]?.name ?? '') }}</p>
        </div>
      </div>

      <!-- Center / Right Controls -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Bookmark Toggle -->
        <button 
          (click)="toggleBookmark.emit()"
          class="p-2 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-brand-400 transition-colors"
          [class.text-brand-400]="isCurrentPageBookmarked()"
          title="Bookmark Page">
          <lucide-icon [img]="BookmarkIcon" class="w-4 h-4" [class.fill-brand-400]="isCurrentPageBookmarked()"></lucide-icon>
        </button>

        <!-- Local RAG AI Trigger -->
        <button 
          (click)="openAI.emit()"
          class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 font-medium text-xs flex items-center gap-1.5 transition-colors"
          title="Ask Local AI about this book">
          <lucide-icon [img]="SparklesIcon" class="w-3.5 h-3.5"></lucide-icon>
          <span class="hidden md:inline">Ask AI</span>
        </button>

        <!-- Theme Toggle -->
        <button 
          (click)="cycleTheme.emit()"
          class="p-2 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
          title="Cycle Theme (Dark / Light / Sepia / Solarized)">
          <lucide-icon [img]="ThemeIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <!-- Sidebar / Drawer Toggle -->
        <button 
          (click)="toggleDrawer.emit()"
          class="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="TOC & Annotations">
          <lucide-icon [img]="DrawerIcon" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
    </header>
  `
})
export class ReaderHeaderComponent {
  readonly book = input.required<Book>();
  readonly isCurrentPageBookmarked = input<boolean>(false);
  readonly currentTheme = input<ReaderTheme>('dark');

  readonly toggleBookmark = output<void>();
  readonly openAI = output<void>();
  readonly cycleTheme = output<void>();
  readonly toggleDrawer = output<void>();

  readonly BackIcon = ArrowLeft;
  readonly BookmarkIcon = Bookmark;
  readonly SparklesIcon = Sparkles;
  readonly ThemeIcon = Moon;
  readonly DrawerIcon = PanelRight;
}
