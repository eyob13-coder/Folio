import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/library/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/library/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'reading',
    loadComponent: () => import('./features/library/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'reader/:id',
    loadComponent: () => import('./features/reader/reader-container/reader-container.component').then(m => m.ReaderContainerComponent)
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./features/ai-chat/ai-assistant-view/ai-assistant-view.component').then(m => m.AiAssistantViewComponent)
  },
  {
    path: 'sync-demo',
    loadComponent: () => import('./features/sync-demo/sync-demo.component').then(m => m.SyncDemoComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-view/settings-view.component').then(m => m.SettingsViewComponent)
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/collection-manager/collection-manager.component').then(m => m.CollectionManagerComponent)
  },
  {
    path: 'annotations',
    loadComponent: () => import('./features/annotations/annotations-browser/annotations-browser.component').then(m => m.AnnotationsBrowserComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
