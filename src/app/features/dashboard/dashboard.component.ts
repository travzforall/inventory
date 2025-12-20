import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LocationService,
  InventoryItemService,
  ScanEventService,
  AuthService,
} from '../../core/services';
import { StorageLocation, InventoryItem, ScanEvent } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Homely Inventory
          </a>
        </div>
        <div class="flex-none gap-2">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-10">
                <span class="text-sm">{{ userInitials() }}</span>
              </div>
            </div>
            <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li class="menu-title">
                <span>{{ currentUser()?.name }}</span>
                <span class="text-xs font-normal text-base-content/60">{{ currentUser()?.email }}</span>
              </li>
              <li><a routerLink="/profile">Profile</a></li>
              @if (isAdmin()) {
                <li><a routerLink="/admin">Admin Settings</a></li>
              }
              <li><a (click)="logout()">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="container mx-auto p-4">
        <!-- Welcome Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold">Welcome back, {{ userName() }}!</h1>
          <p class="text-base-content/70">Here's what's happening with your inventory today.</p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div class="stat-title">Locations</div>
            <div class="stat-value text-primary">{{ locations().length }}</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="stat-title">Items</div>
            <div class="stat-value text-secondary">{{ items().length }}</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="stat-title">Low Stock</div>
            <div class="stat-value text-warning">{{ lowStockItems().length }}</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div class="stat-title">Scans Today</div>
            <div class="stat-value text-info">{{ todayScans().length }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Quick Actions -->
          <div class="lg:col-span-2">
            <div class="card bg-base-100 shadow-xl mb-6">
              <div class="card-body">
                <h2 class="card-title">Quick Actions</h2>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button class="btn btn-outline flex-col h-auto py-4" routerLink="/items/search">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Items
                  </button>
                  @if (canCreateLocation()) {
                    <button class="btn btn-outline flex-col h-auto py-4" routerLink="/locations/new">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      New Location
                    </button>
                  }
                  @if (canAdjustQuantity()) {
                    <button class="btn btn-outline flex-col h-auto py-4" routerLink="/items/new">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      New Item
                    </button>
                  }
                  <button class="btn btn-outline flex-col h-auto py-4" routerLink="/qr-codes">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Codes
                  </button>
                  <button class="btn btn-outline flex-col h-auto py-4" routerLink="/items/low-stock">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Low Stock
                  </button>
                </div>
              </div>
            </div>

            <!-- Root Locations -->
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex justify-between items-center">
                  <h2 class="card-title">Locations</h2>
                  <a routerLink="/locations" class="btn btn-ghost btn-sm">View All</a>
                </div>
                @if (loading()) {
                  <div class="flex justify-center py-8">
                    <span class="loading loading-spinner loading-lg"></span>
                  </div>
                } @else if (rootLocations().length === 0) {
                  <div class="text-center py-8 text-base-content/60">
                    <p>No locations created yet</p>
                    @if (canCreateLocation()) {
                      <button class="btn btn-primary btn-sm mt-2" routerLink="/locations/new">
                        Create First Location
                      </button>
                    }
                  </div>
                } @else {
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    @for (loc of rootLocations(); track loc.id) {
                      <a
                        [routerLink]="['/locations', loc.id]"
                        class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
                      >
                        <div class="card-body p-4">
                          <div class="flex items-center gap-3">
                            @if (loc.imageGallery.length > 0) {
                              <div class="avatar">
                                <div class="w-12 h-12 rounded">
                                  <img [src]="loc.imageGallery[0]" [alt]="loc.name" />
                                </div>
                              </div>
                            } @else {
                              <div class="avatar placeholder">
                                <div class="bg-primary text-primary-content rounded w-12 h-12">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                </div>
                              </div>
                            }
                            <div>
                              <h3 class="font-semibold">{{ loc.name }}</h3>
                              @if (loc.description) {
                                <p class="text-xs text-base-content/60 truncate max-w-[150px]">{{ loc.description }}</p>
                              }
                            </div>
                          </div>
                        </div>
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Low Stock Alert -->
            @if (lowStockItems().length > 0) {
              <div class="card bg-warning/10 border border-warning shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Low Stock Items
                  </h2>
                  <div class="space-y-2">
                    @for (item of lowStockItems().slice(0, 5); track item.id) {
                      <a
                        [routerLink]="['/items', item.id]"
                        class="flex justify-between items-center p-2 hover:bg-base-200 rounded-lg"
                      >
                        <span class="font-medium truncate">{{ item.name }}</span>
                        <span class="badge badge-warning">{{ item.quantity }}/{{ item.minQuantity }}</span>
                      </a>
                    }
                    @if (lowStockItems().length > 5) {
                      <a routerLink="/items/low-stock" class="btn btn-ghost btn-sm w-full">
                        View all {{ lowStockItems().length }} items
                      </a>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Recent Activity -->
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Recent Activity</h2>
                @if (recentScans().length === 0) {
                  <p class="text-base-content/60 text-center py-4">No recent activity</p>
                } @else {
                  <div class="space-y-3">
                    @for (scan of recentScans().slice(0, 10); track scan.id) {
                      <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium">{{ scan.actionTaken || 'Scan' }}</p>
                          <p class="text-xs text-base-content/60">{{ scan.timestamp | date:'short' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private locationService = inject(LocationService);
  private itemService = inject(InventoryItemService);
  private scanService = inject(ScanEventService);
  private authService = inject(AuthService);

  loading = signal(true);
  locations = signal<StorageLocation[]>([]);
  items = signal<InventoryItem[]>([]);
  recentScans = signal<ScanEvent[]>([]);

  currentUser = this.authService.currentUser;

  rootLocations = computed(() =>
    this.locations().filter((l) => !l.parentLocationId)
  );

  lowStockItems = computed(() =>
    this.items().filter((i) => i.quantity <= i.minQuantity)
  );

  todayScans = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.recentScans().filter((s) => new Date(s.timestamp) >= today);
  });

  userInitials = computed(() => {
    const name = this.currentUser()?.name || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  userName = computed(() => {
    const name = this.currentUser()?.name;
    return name ? name.split(' ')[0] : 'User';
  });

  isAdmin = () => this.currentUser()?.role === 'admin';
  canCreateLocation = () => this.authService.hasPermission('canCreateLocation');
  canAdjustQuantity = () => this.authService.hasPermission('canAdjustQuantity');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    // Load all data in parallel
    this.locationService.getAll().subscribe({
      next: (locations) => this.locations.set(locations),
    });

    this.itemService.getAll().subscribe({
      next: (items) => this.items.set(items),
    });

    this.scanService.getRecentScans(50).subscribe({
      next: (scans) => {
        this.recentScans.set(scans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
