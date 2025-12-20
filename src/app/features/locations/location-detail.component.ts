import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocationService, InventoryItemService, AuthService } from '../../core/services';
import { StorageLocation, InventoryItem } from '../../core/models';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-location-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <!-- Header -->
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <button class="btn btn-ghost btn-circle" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold ml-2">{{ location()?.name || 'Loading...' }}</h1>
        </div>
        <div class="flex-none gap-2">
          <!-- View Toggle -->
          <div class="btn-group">
            <button
              class="btn btn-sm"
              [class.btn-active]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              class="btn btn-sm"
              [class.btn-active]="viewMode() === 'list'"
              (click)="viewMode.set('list')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          @if (canAddItem()) {
            <button class="btn btn-primary btn-sm" (click)="addItemToLocation()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else if (location()) {
        <div class="container mx-auto p-4">
          <!-- Breadcrumb -->
          @if (locationPath().length > 1) {
            <div class="text-sm breadcrumbs mb-4">
              <ul>
                <li><a routerLink="/dashboard">Home</a></li>
                @for (loc of locationPath(); track loc.id) {
                  @if (loc.id === location()?.id) {
                    <li>{{ loc.name }}</li>
                  } @else {
                    <li><a [routerLink]="['/locations', loc.id]">{{ loc.name }}</a></li>
                  }
                }
              </ul>
            </div>
          }

          <!-- Location Info Card -->
          <div class="card bg-base-100 shadow-xl mb-6">
            <div class="card-body">
              <div class="flex flex-col md:flex-row gap-4">
                <!-- Image Gallery -->
                @if (location()!.imageGallery.length > 0) {
                  <div class="w-full md:w-1/3">
                    <div class="carousel w-full rounded-lg">
                      @for (img of location()!.imageGallery; track img; let i = $index) {
                        <div [id]="'slide' + i" class="carousel-item relative w-full">
                          <img [src]="img" class="w-full object-cover h-48" alt="Location image" />
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Location Details -->
                <div class="flex-1">
                  <h2 class="card-title text-2xl">{{ location()!.name }}</h2>
                  @if (location()!.description) {
                    <p class="text-base-content/70 mt-2">{{ location()!.description }}</p>
                  }

                  <div class="stats shadow mt-4">
                    <div class="stat">
                      <div class="stat-title">Items</div>
                      <div class="stat-value text-primary">{{ items().length }}</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title">Total Quantity</div>
                      <div class="stat-value">{{ totalQuantity() }}</div>
                    </div>
                    @if (lowStockCount() > 0) {
                      <div class="stat">
                        <div class="stat-title">Low Stock</div>
                        <div class="stat-value text-warning">{{ lowStockCount() }}</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Child Locations -->
          @if (childLocations().length > 0) {
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-3">Sub-locations</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (child of childLocations(); track child.id) {
                  <a
                    [routerLink]="['/locations', child.id]"
                    class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div class="card-body p-4">
                      <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span class="font-medium">{{ child.name }}</span>
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Search and Filter -->
          <div class="flex flex-col md:flex-row gap-4 mb-4">
            <div class="form-control flex-1">
              <div class="input-group">
                <input
                  type="text"
                  placeholder="Search items..."
                  class="input input-bordered w-full"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="filterItems()"
                />
                <button class="btn btn-square">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Category Filter -->
            @if (availableTags().length > 0) {
              <select class="select select-bordered" [(ngModel)]="selectedTag" (ngModelChange)="filterItems()">
                <option value="">All Categories</option>
                @for (tag of availableTags(); track tag) {
                  <option [value]="tag">{{ tag }}</option>
                }
              </select>
            }
          </div>

          <!-- Items Grid/List -->
          @if (filteredItems().length === 0) {
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 class="text-xl font-semibold mt-4">No items found</h3>
                <p class="text-base-content/70 mb-4">
                  @if (searchQuery || selectedTag) {
                    Try adjusting your search or filters
                  } @else {
                    This location doesn't have any items yet
                  }
                </p>
                @if (!searchQuery && !selectedTag && canAddItem()) {
                  <button class="btn btn-primary" (click)="addItemToLocation()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add First Item
                  </button>
                }
              </div>
            </div>
          } @else {
            @if (viewMode() === 'grid') {
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                @for (item of filteredItems(); track item.id) {
                  <div
                    class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
                    (click)="viewItem(item)"
                  >
                    <figure class="h-32 bg-base-200">
                      @if (item.images.length > 0) {
                        <img [src]="item.images[0]" [alt]="item.name" class="w-full h-full object-cover" />
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      }
                    </figure>
                    <div class="card-body p-3">
                      <h3 class="font-semibold text-sm truncate">{{ item.name }}</h3>
                      <p class="text-xs text-base-content/60">SKU: {{ item.sku }}</p>
                      <div class="flex justify-between items-center mt-2">
                        <span
                          class="badge"
                          [class.badge-warning]="item.quantity <= item.minQuantity"
                          [class.badge-success]="item.quantity > item.minQuantity"
                        >
                          Qty: {{ item.quantity }}
                        </span>
                        @if (item.quantity <= item.minQuantity) {
                          <span class="text-warning text-xs">Low Stock</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="table table-zebra w-full bg-base-100">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of filteredItems(); track item.id) {
                      <tr class="hover cursor-pointer" (click)="viewItem(item)">
                        <td>
                          <div class="flex items-center gap-3">
                            <div class="avatar">
                              <div class="mask mask-squircle w-10 h-10 bg-base-200">
                                @if (item.images.length > 0) {
                                  <img [src]="item.images[0]" [alt]="item.name" />
                                } @else {
                                  <div class="flex items-center justify-center h-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                }
                              </div>
                            </div>
                            <div>
                              <div class="font-bold">{{ item.name }}</div>
                              @if (item.description) {
                                <div class="text-sm text-base-content/60 truncate max-w-xs">{{ item.description }}</div>
                              }
                            </div>
                          </div>
                        </td>
                        <td>{{ item.sku }}</td>
                        <td>
                          <span
                            class="badge"
                            [class.badge-warning]="item.quantity <= item.minQuantity"
                            [class.badge-success]="item.quantity > item.minQuantity"
                          >
                            {{ item.quantity }}
                          </span>
                        </td>
                        <td>
                          @for (tag of item.tags.slice(0, 3); track tag) {
                            <span class="badge badge-outline badge-sm mr-1">{{ tag }}</span>
                          }
                        </td>
                        <td>
                          <div class="flex gap-1" (click)="$event.stopPropagation()">
                            @if (canAdjustQuantity()) {
                              <button
                                class="btn btn-ghost btn-xs"
                                (click)="adjustQuantity(item, -1)"
                                [disabled]="item.quantity <= 0"
                              >
                                -
                              </button>
                              <button
                                class="btn btn-ghost btn-xs"
                                (click)="adjustQuantity(item, 1)"
                              >
                                +
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      } @else {
        <div class="flex justify-center items-center h-64">
          <div class="alert alert-error max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Location not found</span>
          </div>
        </div>
      }

    </div>
  `,
})
export class LocationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationService = inject(LocationService);
  private itemService = inject(InventoryItemService);
  private authService = inject(AuthService);

  loading = signal(true);
  location = signal<StorageLocation | null>(null);
  items = signal<InventoryItem[]>([]);
  childLocations = signal<StorageLocation[]>([]);
  locationPath = signal<StorageLocation[]>([]);
  viewMode = signal<ViewMode>('grid');

  searchQuery = '';
  selectedTag = '';
  filteredItems = signal<InventoryItem[]>([]);

  totalQuantity = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  lowStockCount = computed(() =>
    this.items().filter((item) => item.quantity <= item.minQuantity).length
  );
  availableTags = computed(() => {
    const tags = new Set<string>();
    this.items().forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  });

  canAddItem = () => this.authService.hasPermission('canAdjustQuantity');
  canAdjustQuantity = () => this.authService.hasPermission('canAdjustQuantity');

  ngOnInit(): void {
    const locationId = Number(this.route.snapshot.params['id']);
    if (locationId) {
      this.loadLocation(locationId);
    }
  }

  private loadLocation(id: number): void {
    this.loading.set(true);

    this.locationService.getById(id).subscribe({
      next: (location) => {
        this.location.set(location);
        this.loadRelatedData(location);
      },
      error: (err) => {
        console.error('Error loading location:', err);
        this.loading.set(false);
      },
    });
  }

  private loadRelatedData(location: StorageLocation): void {
    // Load items
    this.itemService.getByLocationId(location.id).subscribe({
      next: (items) => {
        this.items.set(items);
        this.filteredItems.set(items);
      },
    });

    // Load child locations
    this.locationService.getChildren(location.id).subscribe({
      next: (children) => this.childLocations.set(children),
    });

    // Load location path
    this.locationService.getLocationPath(location).subscribe({
      next: (path) => {
        this.locationPath.set(path);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterItems(): void {
    let filtered = this.items();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    if (this.selectedTag) {
      filtered = filtered.filter((item) => item.tags.includes(this.selectedTag));
    }

    this.filteredItems.set(filtered);
  }

  viewItem(item: InventoryItem): void {
    this.router.navigate(['/items', item.id]);
  }

  adjustQuantity(item: InventoryItem, adjustment: number): void {
    const newQuantity = item.quantity + adjustment;
    if (newQuantity < 0) return;

    this.itemService.update(item.id, { quantity: newQuantity }).subscribe({
      next: (updated) => {
        const items = this.items().map((i) => (i.id === updated.id ? updated : i));
        this.items.set(items);
        this.filterItems();
      },
    });
  }

  addItemToLocation(): void {
    const locationId = this.location()?.id;
    this.router.navigate(['/items/add'], {
      queryParams: { locationId },
    });
  }

  goBack(): void {
    const parentId = this.location()?.parentLocationId;
    if (parentId) {
      this.router.navigate(['/locations', parentId]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
