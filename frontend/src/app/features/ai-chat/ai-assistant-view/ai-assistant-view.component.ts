import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../../core/services/library.service';
import { LocalRAGService } from '../../../core/ai/local-rag.service';
import { Book } from '../../../core/models/book.model';
import { LucideAngularModule, Sparkles, Send, ShieldCheck, BookOpen } from 'lucide-angular';

@Component({
  selector: 'app-ai-assistant-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Local RAG AI Assistant
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Offline Ollama</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">Ask questions across any book in your library with source citations.</p>
        </div>
      </div>

      <!-- Select Target Book -->
      <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3">
        <label class="text-xs font-semibold text-slate-300">Select Book to Query:</label>
        <select 
          [ngModel]="selectedBookId()"
          (ngModelChange)="selectedBookId.set($event)"
          class="flex-1 min-w-[200px] h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
          @for (b of libraryService.books(); track b.id) {
            <option [value]="b.id">{{ b.title }} ({{ b.fileType.toUpperCase() }})</option>
          }
        </select>
      </div>

      <!-- Q&A Box -->
      <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 min-h-[300px]">
        @if (ragService.currentAnswer(); as ans) {
          <div class="space-y-3">
            <div class="p-4 bg-slate-850 rounded-2xl border border-slate-700/60 space-y-3">
              <div class="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span class="text-emerald-400 font-mono">{{ ans.provider }}</span>
                <span class="font-mono">{{ ans.processingTimeMs }}ms</span>
              </div>
              <div class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {{ ans.answer }}
              </div>
            </div>

            @if (ans.citations.length > 0) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                @for (c of ans.citations; track c.snippet) {
                  <div class="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span class="text-[10px] font-mono text-brand-400 block">{{ c.pageNumber ? 'Page ' + c.pageNumber : c.chapterTitle }}</span>
                    <p class="text-[11px] text-slate-400 italic line-clamp-2">"{{ c.snippet }}"</p>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-16 text-xs text-slate-500 italic">
            Enter a question below to analyze book contents using local RAG semantic search.
          </div>
        }
      </div>

      <!-- Input Bar -->
      <div class="flex gap-2">
        <input 
          [(ngModel)]="questionText"
          (keyup.enter)="ask()"
          placeholder="Ask a question about this book..."
          class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
        <button 
          (click)="ask()"
          [disabled]="ragService.isProcessing() || !questionText.trim()"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5">
          <lucide-icon [img]="SendIcon" class="w-3.5 h-3.5"></lucide-icon>
          <span>Ask Local AI</span>
        </button>
      </div>
    </div>
  `
})
export class AiAssistantViewComponent {
  readonly libraryService = inject(LibraryService);
  readonly ragService = inject(LocalRAGService);

  readonly selectedBookId = signal<string>(this.libraryService.books()[0]?.id || '');
  questionText = '';

  readonly SparklesIcon = Sparkles;
  readonly SendIcon = Send;

  async ask(): Promise<void> {
    const bookId = this.selectedBookId() || this.libraryService.books()[0]?.id;
    if (bookId && this.questionText.trim()) {
      await this.ragService.askQuestionAboutBook(bookId, this.questionText.trim());
      this.questionText = '';
    }
  }
}
