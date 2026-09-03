import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../../core/services/library.service';
import { LucideAngularModule, UploadCloud, CheckCircle2, AlertCircle, X } from 'lucide-angular';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-base text-white">Import Books</h3>
          <button (click)="close.emit()" class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <div 
          (dragover)="onDragOver($event)" 
          (dragleave)="onDragLeave($event)" 
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          class="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-colors">
          <input #fileInput type="file" multiple accept=".pdf,.epub" class="hidden" (change)="onFileSelected($event)">
          <div class="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
            <lucide-icon [img]="UploadIcon" class="w-6 h-6"></lucide-icon>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-200">Drag & Drop PDF or EPUB files here</p>
            <p class="text-xs text-slate-400 mt-1">or click to browse from your device</p>
          </div>
        </div>

        @if (libraryService.importState().status === 'processing') {
          <div class="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span class="truncate">Processing {{ libraryService.importState().currentFileName }}</span>
              <span class="font-mono">{{ libraryService.importState().processedFiles }} / {{ libraryService.importState().totalFiles }}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-brand-500 animate-pulse w-full"></div>
            </div>
          </div>
        }

        @if (libraryService.importState().status === 'completed') {
          <div class="space-y-2 text-xs">
            @if (libraryService.importState().importedBooks.length > 0) {
              <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
                <lucide-icon [img]="CheckIcon" class="w-4 h-4"></lucide-icon>
                <span>Imported {{ libraryService.importState().importedBooks.length }} book(s) successfully.</span>
              </div>
            }
            @if (libraryService.importState().duplicates.length > 0) {
              <div class="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center gap-2">
                <lucide-icon [img]="AlertIcon" class="w-4 h-4"></lucide-icon>
                <span>{{ libraryService.importState().duplicates.length }} duplicate file(s) skipped.</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ImportModalComponent {
  readonly libraryService = inject(LibraryService);
  readonly close = output<void>();

  readonly isDragging = signal<boolean>(false);
  readonly UploadIcon = UploadCloud;
  readonly CheckIcon = CheckCircle2;
  readonly AlertIcon = AlertCircle;
  readonly XIcon = X;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.libraryService.importFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.libraryService.importFiles(input.files);
    }
  }
}
