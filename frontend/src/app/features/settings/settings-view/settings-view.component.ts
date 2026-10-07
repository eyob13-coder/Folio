import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsRepository } from '../../../core/repositories/settings.repository';
import { BackupService } from '../../../core/services/backup.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalComponent } from '../../auth/auth-modal/auth-modal.component';
import { UserSettings, DEFAULT_SETTINGS } from '../../../core/models/settings.model';
import { LucideAngularModule, SlidersHorizontal, Download, Upload, HardDrive, Sparkles, Shield, User, LogIn, LogOut, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AuthModalComponent],
  template: `
    <div class="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">Settings & Storage</h1>
          <p class="text-xs text-slate-400 mt-1">Configure user profile, offline preferences, local AI, and library backups.</p>
        </div>
      </div>

      <!-- User Account & Cloud Sync Status -->
      <div class="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-sm text-slate-200 flex items-center gap-2">
            <lucide-icon [img]="UserIcon" class="w-4 h-4 text-brand-400"></lucide-icon>
            Folio Account & Cloud Sync
          </h3>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded"
            [class]="authService.isAuthenticated() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'">
            {{ authService.isAuthenticated() ? 'Cloud Synced' : 'Local Only' }}
          </span>
        </div>

        @if (authService.isAuthenticated()) {
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 p-[1.5px] shrink-0 shadow-lg shadow-brand-500/20">
                <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-brand-400 text-base">
                  {{ userInitials() }}
                </div>
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-white">{{ authService.currentUser()?.displayName }}</span>
                  <lucide-icon [img]="CheckCircleIcon" class="w-3.5 h-3.5 text-emerald-400"></lucide-icon>
                </div>
                <p class="text-xs text-slate-400 font-mono">{{ authService.currentUser()?.email }}</p>
                <p class="text-[11px] text-slate-500 font-mono truncate max-w-xs">ID: {{ authService.currentUser()?.id }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button 
                (click)="showAuthModal.set(true)"
                class="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-medium rounded-xl transition-all">
                Manage Profile
              </button>
              <button 
                (click)="authService.logout()"
                class="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all">
                <lucide-icon [img]="LogOutIcon" class="w-3.5 h-3.5"></lucide-icon>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <div class="space-y-1">
              <p class="text-xs font-medium text-slate-200">You are currently using Folio in offline guest mode.</p>
              <p class="text-[11px] text-slate-400">Sign in or register to enable real-time synchronization across multiple devices with conflict resolution.</p>
            </div>
            <button 
              (click)="showAuthModal.set(true)"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-brand-600/20 shrink-0">
              <lucide-icon [img]="LogInIcon" class="w-4 h-4"></lucide-icon>
              <span>Sign In / Register</span>
            </button>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <!-- Appearance & Reader Settings -->
        <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <h3 class="font-bold text-sm text-slate-200">Reader Preferences</h3>
          
          <div class="space-y-3 text-slate-300">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Font Family</label>
              <select [(ngModel)]="settings.fontFamily" (change)="save()" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="Merriweather">Merriweather (Serif)</option>
                <option value="Inter">Inter (Sans-Serif)</option>
                <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Font Size ({{ settings.fontSize }}px)</label>
              <input type="range" min="14" max="28" [(ngModel)]="settings.fontSize" (change)="save()" class="w-full accent-brand-500">
            </div>
          </div>
        </div>

        <!-- Local AI Module Settings -->
        <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-emerald-400"></lucide-icon>
              Local RAG AI Module
            </h3>
            <span class="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Zero-Cloud</span>
          </div>

          <div class="space-y-3 text-slate-300">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">AI Provider</label>
              <select [(ngModel)]="settings.aiProvider" (change)="save()" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="local_ollama">Local Ollama (localhost:11434)</option>
                <option value="mock_offline">Built-in Offline Semantic Engine</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Ollama Model</label>
              <input [(ngModel)]="settings.ollamaModel" (change)="save()" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
            </div>
          </div>
        </div>
      </div>

      <!-- Backup & Data Export -->
      <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
        <h3 class="font-bold text-sm text-slate-200">Data Ownership & Backup</h3>
        <p class="text-xs text-slate-400">Export all books, annotations, reading progress, and tags into a standalone JSON file.</p>

        <div class="flex flex-wrap gap-3">
          <button (click)="backupService.exportLibrary()" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2">
            <lucide-icon [img]="DownloadIcon" class="w-4 h-4"></lucide-icon>
            <span>Export Library JSON</span>
          </button>

          <button (click)="fileInput.click()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 border border-slate-700">
            <lucide-icon [img]="UploadIcon" class="w-4 h-4"></lucide-icon>
            <span>Restore Backup</span>
          </button>
          <input #fileInput type="file" accept=".json" class="hidden" (change)="onRestore($event)">
        </div>
      </div>

      <!-- Optional Auth Modal -->
      @if (showAuthModal()) {
        <app-auth-modal (close)="showAuthModal.set(false)"></app-auth-modal>
      }
    </div>
  `
})
export class SettingsViewComponent implements OnInit {
  private settingsRepo = inject(SettingsRepository);
  readonly backupService = inject(BackupService);
  readonly authService = inject(AuthService);

  readonly showAuthModal = signal<boolean>(false);

  settings: UserSettings = { ...DEFAULT_SETTINGS };

  readonly SparklesIcon = Sparkles;
  readonly DownloadIcon = Download;
  readonly UploadIcon = Upload;
  readonly HardDriveIcon = HardDrive;
  readonly UserIcon = User;
  readonly LogInIcon = LogIn;
  readonly LogOutIcon = LogOut;
  readonly CheckCircleIcon = CheckCircle2;

  async ngOnInit(): Promise<void> {
    this.settings = await this.settingsRepo.getSettings();
  }

  userInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'F';
    const name = user.displayName || user.email || 'F';
    return name.slice(0, 2).toUpperCase();
  }

  async save(): Promise<void> {
    await this.settingsRepo.saveSettings(this.settings);
  }

  async onRestore(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const res = await this.backupService.restoreLibrary(input.files[0]);
      alert(res.message);
    }
  }
}
