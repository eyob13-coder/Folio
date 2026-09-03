import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../../core/services/library.service';
import { LucideAngularModule, BookOpen, BookmarkCheck, Folder, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
          <lucide-icon [img]="BookIcon" class="w-5 h-5"></lucide-icon>
        </div>
        <div>
          <span class="text-xs text-slate-400 block font-medium">Total Books</span>
          <span class="text-lg font-bold text-white font-mono">{{ libraryService.stats().totalBooks }}</span>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <lucide-icon [img]="PagesIcon" class="w-5 h-5"></lucide-icon>
        </div>
        <div>
          <span class="text-xs text-slate-400 block font-medium">Pages Read</span>
          <span class="text-lg font-bold text-white font-mono">{{ libraryService.stats().totalPagesRead }}</span>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <lucide-icon [img]="FolderIcon" class="w-5 h-5"></lucide-icon>
        </div>
        <div>
          <span class="text-xs text-slate-400 block font-medium">Collections</span>
          <span class="text-lg font-bold text-white font-mono">{{ libraryService.stats().totalCollections }}</span>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <lucide-icon [img]="SparklesIcon" class="w-5 h-5"></lucide-icon>
        </div>
        <div>
          <span class="text-xs text-slate-400 block font-medium">Local AI</span>
          <span class="text-sm font-semibold text-emerald-400 font-mono">100% Offline</span>
        </div>
      </div>
    </div>
  `
})
export class StatsBarComponent {
  readonly libraryService = inject(LibraryService);
  readonly BookIcon = BookOpen;
  readonly PagesIcon = BookmarkCheck;
  readonly FolderIcon = Folder;
  readonly SparklesIcon = Sparkles;
}
