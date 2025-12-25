import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
        canActivate: [guestGuard],
      },
    ],
  },
  {
    path: 'scan/:tagId',
    loadComponent: () =>
      import('./features/scan/scan-resolver.component').then((m) => m.ScanResolverComponent),
    canActivate: [authGuard],
  },
  {
    path: 'nfc',
    loadComponent: () =>
      import('./features/nfc/nfc-entry.component').then((m) => m.NfcEntryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'locations',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/locations/location-list.component').then((m) => m.LocationListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/locations/location-form.component').then((m) => m.LocationFormComponent),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./features/locations/location-form.component').then((m) => m.LocationFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/locations/location-detail.component').then((m) => m.LocationDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/locations/location-form.component').then((m) => m.LocationFormComponent),
      },
    ],
  },
  {
    path: 'qr-codes',
    loadComponent: () =>
      import('./features/qr-codes/qr-generator.component').then((m) => m.QRGeneratorComponent),
    canActivate: [authGuard],
  },
  {
    path: 'id-templates',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/id-templates/id-template-list.component').then((m) => m.IdTemplateListComponent),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./features/id-templates/id-template-form.component').then((m) => m.IdTemplateFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/id-templates/id-template-form.component').then((m) => m.IdTemplateFormComponent),
      },
    ],
  },
  {
    path: 'items',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/items/item-list.component').then((m) => m.ItemListComponent),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/items/item-search.component').then((m) => m.ItemSearchComponent),
      },
      {
        path: 'low-stock',
        loadComponent: () =>
          import('./features/items/low-stock.component').then((m) => m.LowStockComponent),
      },
      {
        path: 'bulk-add',
        loadComponent: () =>
          import('./features/items/bulk-item-add.component').then((m) => m.BulkItemAddComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/items/item-form.component').then((m) => m.ItemFormComponent),
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./features/items/item-form.component').then((m) => m.ItemFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/items/item-detail.component').then((m) => m.ItemDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/items/item-form.component').then((m) => m.ItemFormComponent),
      },
    ],
  },
  {
    path: 'buzzer',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/buzzer/buzzer-dashboard.component').then((m) => m.BuzzerDashboardComponent),
      },
      {
        path: 'game',
        loadComponent: () =>
          import('./features/buzzer/buzzer-game.component').then((m) => m.BuzzerGameComponent),
      },
      {
        path: 'freeplay',
        loadComponent: () =>
          import('./features/buzzer/buzzer-freeplay.component').then((m) => m.BuzzerFreeplayComponent),
      },
      {
        path: 'mapping',
        loadComponent: () =>
          import('./features/buzzer/buzzer-mapping.component').then((m) => m.BuzzerMappingComponent),
      },
      {
        path: 'quiz',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/buzzer/quiz/quiz-lobby.component').then((m) => m.QuizLobbyComponent),
          },
          {
            path: 'play',
            loadComponent: () =>
              import('./features/buzzer/quiz/quiz-game.component').then((m) => m.QuizGameComponent),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/buzzer/quiz/quiz-creator.component').then((m) => m.QuizCreatorComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/buzzer/quiz/quiz-creator.component').then((m) => m.QuizCreatorComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'labels',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/labels/label-queue.component').then((m) => m.LabelQueueComponent),
      },
      {
        path: 'registry',
        loadComponent: () =>
          import('./features/labels/cid-registry.component').then((m) => m.CidRegistryComponent),
      },
    ],
  },
  {
    path: 'it-assets',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/it-assets/it-assets-dashboard.component').then((m) => m.ItAssetsDashboardComponent),
      },
      {
        path: 'servers',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/it-assets/server-list.component').then((m) => m.ServerListComponent),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./features/it-assets/server-form.component').then((m) => m.ServerFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/it-assets/server-detail.component').then((m) => m.ServerDetailComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/it-assets/server-form.component').then((m) => m.ServerFormComponent),
          },
        ],
      },
      {
        path: 'software',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/it-assets/software-list.component').then((m) => m.SoftwareListComponent),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./features/it-assets/software-form.component').then((m) => m.SoftwareFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/it-assets/software-detail.component').then((m) => m.SoftwareDetailComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/it-assets/software-form.component').then((m) => m.SoftwareFormComponent),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
