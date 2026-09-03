import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SyncQueueService } from '../../../core/sync/sync-queue.service';
import { LucideAngularModule, Search, UploadCloud, SlidersHorizontal } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <header class="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      <!-- Brand / Logo -->
      <div class="flex items-center gap-3">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                <path d="M6 6h10"></path>
                <path d="M6 10h10"></path>
                <path d="m14 14 3 3 3-3"></path>
              </svg>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-lg tracking-tight text-white font-sans">
                Folio
              </span>
              
            </div>
            <p class="text-[11px] text-slate-400 hidden sm:block font-medium">Intelligent Digital Library</p>
          </div>
        </a>
      </div>

      <!-- Search Trigger -->
      <div class="flex-1 max-w-md mx-6 hidden md:block">
        <button 
          (click)="openSearch.emit()"
          class="w-full h-10 px-3.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 text-xs flex items-center justify-between transition-all hover:bg-slate-900 group shadow-inner">
          <div class="flex items-center gap-2.5">
            <lucide-icon [img]="SearchIcon" class="w-4 h-4 text-slate-400 group-hover:text-brand-400 transition-colors"></lucide-icon>
            <span>Search books, full-text snippets, authors...</span>
          </div>
          <kbd class="text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded shadow-sm">Ctrl K</kbd>
        </button>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button 
          (click)="openSearch.emit()"
          class="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          title="Search">
          <lucide-icon [img]="SearchIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <button 
          (click)="openImport.emit()"
          class="h-9 px-3.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98]">
          <lucide-icon [img]="UploadCloudIcon" class="w-4 h-4"></lucide-icon>
          <span class="hidden sm:inline">Import Books</span>
        </button>

        <a 
          routerLink="/sync-demo"
          class="h-9 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl flex items-center gap-2 text-xs transition-colors"
          title="Sync & Conflict Simulator">
          <span class="flex h-2 w-2 relative">
            <span [class]="syncService.isOnline() ? 'animate-ping bg-brand-400' : 'bg-amber-400'" class="absolute inline-flex h-full w-full rounded-full opacity-75"></span>
            <span [class]="syncService.isOnline() ? 'bg-brand-500' : 'bg-amber-500'" class="relative inline-flex rounded-full h-2 w-2"></span>
          </span>
          <span class="text-slate-300 hidden lg:inline">{{ syncService.isOnline() ? 'Online' : 'Offline' }}</span>
          @if (syncService.pendingCount() > 0) {
            <span class="bg-brand-500/20 text-brand-300 text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-brand-500/30">
              {{ syncService.pendingCount() }}
            </span>
          }
        </a>

        <a 
          routerLink="/settings"
          class="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Settings">
          <lucide-icon [img]="SettingsIcon" class="w-4 h-4"></lucide-icon>
        </a>
      </div>
    </header>
  `
})
export class NavbarComponent {
  readonly syncService = inject(SyncQueueService);
  readonly openSearch = output<void>();
  readonly openImport = output<void>();

  readonly SearchIcon = Search;
  readonly UploadCloudIcon = UploadCloud;
  readonly SettingsIcon = SlidersHorizontal;
}
