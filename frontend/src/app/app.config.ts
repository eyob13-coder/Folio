import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
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
    provideHttpClient(withFetch()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
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
