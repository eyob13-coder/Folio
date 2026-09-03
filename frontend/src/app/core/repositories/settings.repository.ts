import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { STORES } from '../storage/indexeddb-storage-provider';
import { UserSettings, DEFAULT_SETTINGS } from '../models/settings.model';

const SETTINGS_KEY = 'user_settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsRepository {
  private storage = inject(STORAGE_PROVIDER);

  async getSettings(): Promise<UserSettings> {
    const saved = await this.storage.get<UserSettings>(STORES.SETTINGS, SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    await this.storage.set<UserSettings>(STORES.SETTINGS, SETTINGS_KEY, settings);
    return settings;
  }
}
