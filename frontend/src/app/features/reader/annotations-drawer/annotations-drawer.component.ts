import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReaderService } from '../../../core/services/reader.service';
import { 
  LucideAngularModule, 
  Bookmark, 
  Highlighter, 
  StickyNote, 
  Trash2, 
  Plus, 
  X 
} from 'lucide-angular';

@Component({
  selector: 'app-annotations-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <aside class="w-80 h-full border-l border-slate-800 bg-slate-950 p-4 flex flex-col justify-between overflow-hidden">
      <!-- Tabs -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div class="flex gap-1">
          <button 
            (click)="activeTab.set('bookmarks')"
            [class.text-brand-400]="activeTab() === 'bookmarks'"
            [class.border-b-2]="activeTab() === 'bookmarks'"
            [class.border-brand-400]="activeTab() === 'bookmarks'"
            class="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5">
            <lucide-icon [img]="BookmarkIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>Bookmarks</span>
          </button>

          <button 
            (click)="activeTab.set('notes')"
            [class.text-brand-400]="activeTab() === 'notes'"
            [class.border-b-2]="activeTab() === 'notes'"
            [class.border-brand-400]="activeTab() === 'notes'"
            class="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5">
            <lucide-icon [img]="NoteIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>Notes</span>
          </button>
        </div>

        <button (click)="close.emit()" class="p-1 rounded text-slate-400 hover:text-white">
          <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto space-y-2 pr-1">
        @if (activeTab() === 'bookmarks') {
          @for (bm of readerService.bookmarks(); track bm.id) {
            <div class="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between group">
              <div>
                <span class="text-xs font-semibold text-slate-200 block">{{ bm.label }}</span>
                <span class="text-[10px] text-slate-500 font-mono">Page {{ bm.pageNumber || bm.location }}</span>
              </div>
              <button (click)="readerService.deleteBookmark(bm.id)" class="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-500/10 rounded">
                <lucide-icon [img]="TrashIcon" class="w-3.5 h-3.5"></lucide-icon>
              </button>
            </div>
          }
          @if (readerService.bookmarks().length === 0) {
            <p class="text-xs text-slate-500 italic text-center py-6">No bookmarks yet</p>
          }
        }

        @if (activeTab() === 'notes') {
          @for (note of readerService.notes(); track note.id) {
            <div class="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1 group">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-brand-400 font-mono">Page {{ note.pageNumber }}</span>
                <button (click)="readerService.deleteNote(note.id)" class="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-500/10 rounded">
                  <lucide-icon [img]="TrashIcon" class="w-3.5 h-3.5"></lucide-icon>
                </button>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">{{ note.content }}</p>
            </div>
          }
          @if (readerService.notes().length === 0) {
            <p class="text-xs text-slate-500 italic text-center py-6">No notes yet</p>
          }
        }
      </div>

      <!-- Quick Add Note Input -->
      @if (activeTab() === 'notes') {
        <div class="pt-2 border-t border-slate-800 flex gap-1.5">
          <input 
            [(ngModel)]="newNoteText" 
            (keyup.enter)="createNote()"
            placeholder="Add note for this page..." 
            class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500">
          <button (click)="createNote()" class="p-1.5 bg-brand-600 hover:bg-brand-500 text-slate-950 rounded-xl">
            <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      }
    </aside>
  `
})
export class AnnotationsDrawerComponent {
  readonly readerService = inject(ReaderService);
  readonly close = output<void>();

  readonly activeTab = signal<'bookmarks' | 'notes'>('bookmarks');
  newNoteText = '';

  readonly BookmarkIcon = Bookmark;
  readonly NoteIcon = StickyNote;
  readonly TrashIcon = Trash2;
  readonly PlusIcon = Plus;
  readonly XIcon = X;

  async createNote(): Promise<void> {
    if (this.newNoteText.trim()) {
      await this.readerService.addNote(this.newNoteText.trim());
      this.newNoteText = '';
    }
  }
}
