import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LayoutGrid, List } from 'lucide-angular';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2 border-b border-slate-800/60 pb-3">
      <!-- Left: Interactive Filter Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        @for (f of filterOptions; track f.id) {
          <button 
            type="button"
            (click)="selectedFilter.set(f.id)"
            class="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 cursor-pointer"
            [class]="selectedFilter() === f.id ? 'bg-brand-500/20 text-brand-400 border-brand-500/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Right View Switcher, Format & Sort -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Format Filter -->
        <select 
          [ngModel]="selectedFormat()" 
          (ngModelChange)="selectedFormat.set($event)"
          class="h-8 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500">
          <option value="all">All Formats</option>
          <option value="pdf">PDF only</option>
          <option value="epub">EPUB only</option>
        </select>

        <!-- Sort Select -->
        <select 
          [ngModel]="sortBy()" 
          (ngModelChange)="sortBy.set($event)"
          class="h-8 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500">
          <option value="recent">Recently Opened</option>
          <option value="title">Title (A-Z)</option>
          <option value="progress">Reading Progress</option>
        </select>

        <!-- Grid/List Switcher -->
        <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button 
            type="button"
            (click)="viewMode.set('grid')"
            class="p-1 rounded-lg transition-colors"
            [class]="viewMode() === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
            title="Grid View">
            <lucide-icon [img]="GridIcon" class="w-3.5 h-3.5"></lucide-icon>
          </button>
          <button 
            type="button"
            (click)="viewMode.set('list')"
            class="p-1 rounded-lg transition-colors"
            [class]="viewMode() === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
            title="List View">
            <lucide-icon [img]="ListIcon" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class FilterBarComponent {
  readonly selectedFilter = model<string>('all');
  readonly selectedFormat = model<string>('all');
  readonly sortBy = model<string>('recent');
  readonly viewMode = model<'grid' | 'list'>('grid');

  readonly filterOptions = [
    { id: 'all', label: 'All Books' },
    { id: 'reading', label: 'Currently Reading' },
    { id: 'unread', label: 'Unread' },
    { id: 'completed', label: 'Completed' },
    { id: 'favorites', label: 'Favorites' }
  ];

  readonly GridIcon = LayoutGrid;
  readonly ListIcon = List;
}
