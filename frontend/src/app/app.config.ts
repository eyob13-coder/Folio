import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { STORAGE_PROVIDER } from './core/storage/storage-provider.interface';
import { IndexedDbStorageProvider } from './core/storage/indexeddb-storage-provider';
import { LibraryService } from './core/services/library.service';

export function initializeLibrary(libService: LibraryService) {
  return () => libService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: STORAGE_PROVIDER,
      useClass: IndexedDbStorageProvider
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLibrary,
      deps: [LibraryService],
      multi: true
    }
  ]
};
