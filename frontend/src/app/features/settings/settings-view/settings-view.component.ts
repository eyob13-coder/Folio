import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsRepository } from '../../../core/repositories/settings.repository';
import { BackupService } from '../../../core/services/backup.service';
import { UserSettings, DEFAULT_SETTINGS } from '../../../core/models/settings.model';
import { LucideAngularModule, SlidersHorizontal, Download, Upload, HardDrive, Sparkles, Shield } from 'lucide-angular';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div class="border-b border-slate-800 pb-3">
        <h1 class="text-xl font-bold text-white tracking-tight">Settings & Storage</h1>
        <p class="text-xs text-slate-400 mt-1">Configure offline preferences, local AI, and library backups.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <!-- Appearance & Reader Settings -->
        <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <h3 class="font-bold text-sm text-slate-200">Reader Preferences</h3>
          
          <div class="space-y-3 text-slate-300">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Font Family</label>
              <select [(ngModel)]="settings.fontFamily" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="Merriweather">Merriweather (Serif)</option>
                <option value="Inter">Inter (Sans-Serif)</option>
                <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Font Size ({{ settings.fontSize }}px)</label>
              <input type="range" min="14" max="28" [(ngModel)]="settings.fontSize" class="w-full accent-brand-500">
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
              <select [(ngModel)]="settings.aiProvider" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="local_ollama">Local Ollama (localhost:11434)</option>
                <option value="mock_offline">Built-in Offline RAG Engine</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Ollama Model</label>
              <input [(ngModel)]="settings.ollamaModel" class="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
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
    </div>
  `
})
export class SettingsViewComponent implements OnInit {
  private settingsRepo = inject(SettingsRepository);
  readonly backupService = inject(BackupService);

  settings: UserSettings = { ...DEFAULT_SETTINGS };

  readonly SparklesIcon = Sparkles;
  readonly DownloadIcon = Download;
  readonly UploadIcon = Upload;
  readonly HardDriveIcon = HardDrive;

  async ngOnInit(): Promise<void> {
    this.settings = await this.settingsRepo.getSettings();
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
