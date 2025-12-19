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
    path: '**',
    redirectTo: 'dashboard',
  },
];
