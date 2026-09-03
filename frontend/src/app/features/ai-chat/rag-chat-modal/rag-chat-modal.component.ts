import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalRAGService } from '../../../core/ai/local-rag.service';
import { Book } from '../../../core/models/book.model';
import { AIAnswer } from '../../../core/models/ai.model';
import { LucideAngularModule, Sparkles, Send, X, ShieldCheck, Clock, BookOpen } from 'lucide-angular';

@Component({
  selector: 'app-rag-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <lucide-icon [img]="SparklesIcon" class="w-4 h-4"></lucide-icon>
            </div>
            <div>
              <h3 class="font-bold text-sm text-white flex items-center gap-2">
                Local RAG Book Q&A
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Offline</span>
              </h3>
              <p class="text-[11px] text-slate-400 truncate max-w-sm">{{ book().title }}</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <!-- Chat / Answer Body -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          @if (!ragService.currentAnswer() && !ragService.isProcessing()) {
            <div class="text-center py-10 space-y-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto">
                <lucide-icon [img]="SparklesIcon" class="w-5 h-5"></lucide-icon>
              </div>
              <h4 class="font-semibold text-sm text-slate-200">Ask any question about this book</h4>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                Questions are answered locally using chunked vector search and cited with exact page & chapter sources.
              </p>
              <!-- Suggested Questions -->
              <div class="flex flex-wrap gap-2 justify-center pt-2">
                @for (q of suggestedQuestions(); track q) {
                  <button 
                    (click)="questionText = q; askQuestion()"
                    class="text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                    {{ q }}
                  </button>
                }
              </div>
            </div>
          }

          @if (ragService.isProcessing()) {
            <div class="flex items-center justify-center gap-3 py-12 text-slate-400">
              <div class="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
              <span class="text-xs font-mono">Searching local chunks and synthesizing answer...</span>
            </div>
          }

          @if (ragService.currentAnswer(); as ans) {
            <div class="space-y-3">
              <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Question</span>
                <p class="text-xs font-medium text-slate-200">{{ ans.question }}</p>
              </div>

              <!-- Answer Box -->
              <div class="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-3">
                <div class="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span class="flex items-center gap-1.5 text-emerald-400 font-mono">
                    <lucide-icon [img]="ShieldCheckIcon" class="w-3.5 h-3.5"></lucide-icon>
                    {{ ans.provider }}
                  </span>
                  <span class="font-mono">{{ ans.processingTimeMs }}ms</span>
                </div>
                <div class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {{ ans.answer }}
                </div>
              </div>

              <!-- Citations Badges -->
              @if (ans.citations.length > 0) {
                <div class="space-y-1.5 pt-1">
                  <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Source Citations</span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    @for (c of ans.citations; track c.snippet) {
                      <div class="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div class="flex items-center justify-between text-[10px] font-mono text-brand-400">
                          <span>{{ c.pageNumber ? 'Page ' + c.pageNumber : c.chapterTitle || 'Section' }}</span>
                          <span>{{ (c.relevanceScore * 100).toFixed(0) }}% match</span>
                        </div>
                        <p class="text-[11px] text-slate-400 italic line-clamp-2 leading-tight">"{{ c.snippet }}"</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Input Box -->
        <div class="p-3 border-t border-slate-800 bg-slate-950/60 flex gap-2">
          <input 
            [(ngModel)]="questionText" 
            (keyup.enter)="askQuestion()"
            placeholder="Ask a question (e.g. What does this book say about consensus?)..."
            class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
          <button 
            (click)="askQuestion()" 
            [disabled]="ragService.isProcessing() || !questionText.trim()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
            <lucide-icon [img]="SendIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class RagChatModalComponent {
  readonly book = input.required<Book>();
  readonly close = output<void>();

  readonly ragService = inject(LocalRAGService);
  questionText = '';

  readonly SparklesIcon = Sparkles;
  readonly SendIcon = Send;
  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ClockIcon = Clock;
  readonly BookOpenIcon = BookOpen;

  suggestedQuestions(): string[] {
    return [
      'What does this book say about eventual consistency?',
      'Explain the core architectural principles.',
      'Summarize key insights and takeaways.'
    ];
  }

  async askQuestion(): Promise<void> {
    if (this.questionText.trim()) {
      await this.ragService.askQuestionAboutBook(this.book().id, this.questionText.trim());
      this.questionText = '';
    }
  }
}
