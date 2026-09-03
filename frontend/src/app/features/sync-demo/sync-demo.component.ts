import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncQueueService } from '../../core/sync/sync-queue.service';
import { SyncConflict } from '../../core/models/sync.model';
import { 
  LucideAngularModule, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Split, 
  ShieldAlert,
  Radio
} from 'lucide-angular';

@Component({
  selector: 'app-sync-demo',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <!-- Title & Live Status -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-white tracking-tight">Offline-First Sync & Conflict Resolver</h1>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">Flagship Demo</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Multi-tab BroadcastChannel & version conflict demonstration.</p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            (click)="syncService.triggerDemoConflict()"
            class="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors">
            <lucide-icon [img]="AlertTriangleIcon" class="w-4 h-4"></lucide-icon>
            <span>Simulate Conflict</span>
          </button>

          <button 
            (click)="syncService.syncNow()"
            [disabled]="syncService.syncStatus() === 'syncing'"
            class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all">
            <lucide-icon [img]="RefreshIcon" class="w-4 h-4" [class.animate-spin]="syncService.syncStatus() === 'syncing'"></lucide-icon>
            <span>Drain Queue</span>
          </button>
        </div>
      </div>

      <!-- Live Conflict Resolution Card (if active conflicts) -->
      @for (conflict of syncService.activeConflicts(); track conflict.id) {
        <div class="p-5 bg-slate-900 border-2 border-amber-500/40 rounded-3xl space-y-4 shadow-2xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <lucide-icon [img]="ShieldAlertIcon" class="w-4 h-4"></lucide-icon>
              Simultaneous Modification Detected ({{ conflict.entityType }})
            </span>
            <span class="text-[11px] font-mono text-slate-400">ID: {{ conflict.entityId }}</span>
          </div>

          <!-- Side-by-side comparison -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span class="text-[10px] font-mono uppercase text-brand-400 block font-bold">Device A (Local Version)</span>
              <p class="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                {{ conflict.localVersion?.content || (conflict.localVersion | json) }}
              </p>
              <button 
                (click)="resolve(conflict.id, 'keep_local')"
                class="w-full py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-xl font-medium text-xs">
                Keep Device A Version
              </button>
            </div>

            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span class="text-[10px] font-mono uppercase text-cyan-400 block font-bold">Device B (Remote / Second Tab)</span>
              <p class="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                {{ conflict.remoteVersion?.content || (conflict.remoteVersion | json) }}
              </p>
              <button 
                (click)="resolve(conflict.id, 'keep_remote')"
                class="w-full py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-medium text-xs">
                Keep Device B Version
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Sync Queue Status Table -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white">Local Outbox Sync Queue</h3>
          <span class="text-xs font-mono text-slate-400">{{ syncService.syncQueue().length }} items recorded</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-[10px] uppercase font-mono text-slate-500 border-b border-slate-800">
              <tr>
                <th class="py-2 px-3">Action</th>
                <th class="py-2 px-3">Entity</th>
                <th class="py-2 px-3">Idempotency Key</th>
                <th class="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
              @for (item of syncService.syncQueue(); track item.id) {
                <tr class="hover:bg-slate-850/50">
                  <td class="py-2.5 px-3 text-brand-400">{{ item.action }}</td>
                  <td class="py-2.5 px-3">{{ item.entityType }}</td>
                  <td class="py-2.5 px-3 text-slate-500">{{ item.id.slice(0, 8) }}...</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px]" [class]="item.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-brand-500/10 text-brand-400'">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SyncDemoComponent {
  readonly syncService = inject(SyncQueueService);

  readonly AlertTriangleIcon = AlertTriangle;
  readonly RefreshIcon = RefreshCw;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly CheckCircleIcon = CheckCircle2;

  resolve(conflictId: string, strategy: 'keep_local' | 'keep_remote'): void {
    this.syncService.resolveConflict(conflictId, strategy);
  }
}
