export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'solarized';
export type AppTheme = 'dark' | 'light' | 'system';
export type AIModelProviderType = 'local_ollama' | 'mock_offline' | 'cloud_opt_in';

export interface UserSettings {
  // Appearance
  theme: AppTheme;
  sidebarCollapsed: boolean;
  libraryViewMode: 'grid' | 'list';
  sortBy: 'lastOpened' | 'title' | 'author' | 'progress' | 'recentlyAdded';
  sortOrder: 'asc' | 'desc';

  // Reader Preferences
  readerTheme: ReaderTheme;
  fontSize: number; // in px
  fontFamily: 'Inter' | 'Merriweather' | 'JetBrains Mono' | 'system-ui';
  lineHeight: number; // e.g. 1.6
  readingWidth: number; // e.g. 800px max width
  defaultZoom: number; // e.g. 100%

  // Storage & Sync
  autoSync: boolean;
  syncServerUrl: string;
  simulateOffline: boolean;

  // AI Preferences
  aiEnabled: boolean;
  aiProvider: AIModelProviderType;
  ollamaUrl: string;
  ollamaModel: string;
  ollamaEmbeddingModel: string;
  cloudApiKey?: string;
  cloudEndpoint?: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  sidebarCollapsed: false,
  libraryViewMode: 'grid',
  sortBy: 'lastOpened',
  sortOrder: 'desc',
  readerTheme: 'dark',
  fontSize: 18,
  fontFamily: 'Merriweather',
  lineHeight: 1.7,
  readingWidth: 800,
  defaultZoom: 100,
  autoSync: false,
  syncServerUrl: 'http://localhost:8080/api/v1',
  simulateOffline: false,
  aiEnabled: true,
  aiProvider: 'local_ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  ollamaEmbeddingModel: 'nomic-embed-text'
};
