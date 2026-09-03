import { Component, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Filter, LayoutGrid, List } from 'lucide-angular';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 py-2">
      <!-- Left Filters -->
      <div class="flex items-center gap-2">
        <select 
          [ngModel]="selectedFilter()" 
          (ngModelChange)="selectedFilter.set($event)"
          class="h-9 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500">
          <option value="all">All Books</option>
          <option value="reading">Currently Reading</option>
          <option value="unread">Unread</option>
          <option value="completed">Completed</option>
          <option value="favorites">Favorites</option>
        </select>

        <select 
          [ngModel]="selectedFormat()" 
          (ngModelChange)="selectedFormat.set($event)"
          class="h-9 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500">
          <option value="all">All Formats</option>
          <option value="pdf">PDF only</option>
          <option value="epub">EPUB only</option>
        </select>
      </div>

      <!-- Right View Switcher & Sort -->
      <div class="flex items-center gap-2">
        <select 
          [ngModel]="sortBy()" 
          (ngModelChange)="sortBy.set($event)"
          class="h-9 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500">
          <option value="recent">Recently Opened</option>
          <option value="title">Title (A-Z)</option>
          <option value="progress">Reading Progress</option>
        </select>

        <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button 
            (click)="viewMode.set('grid')"
            [class.bg-slate-800]="viewMode() === 'grid'"
            [class.text-white]="viewMode() === 'grid'"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Grid View">
            <lucide-icon [img]="GridIcon" class="w-3.5 h-3.5"></lucide-icon>
          </button>
          <button 
            (click)="viewMode.set('list')"
            [class.bg-slate-800]="viewMode() === 'list'"
            [class.text-white]="viewMode() === 'list'"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
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

  readonly FilterIcon = Filter;
  readonly GridIcon = LayoutGrid;
  readonly ListIcon = List;
}
