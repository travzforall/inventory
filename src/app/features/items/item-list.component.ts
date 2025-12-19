import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryItemService, AuthService } from '../../core/services';
import { InventoryItem } from '../../core/models';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/dashboard" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">All Items</h1>
        </div>
        <div class="flex-none">
          @if (canCreate()) {
            <a routerLink="/items/new" class="btn btn-primary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Item
            </a>
          }
        </div>
      </div>

      <div class="container mx-auto p-4">
        <div class="form-control mb-4">
          <input
            type="text"
            placeholder="Search items..."
            class="input input-bordered w-full"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterItems()"
          />
        </div>

        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 class="text-xl font-semibold mt-4">No items found</h3>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (item of filteredItems(); track item.id) {
              <a
                [routerLink]="['/items', item.id]"
                class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
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
                  <p class="text-xs text-base-content/60">{{ item.sku }}</p>
                  <span
                    class="badge badge-sm"
                    [class.badge-warning]="item.quantity <= item.minQuantity"
                    [class.badge-success]="item.quantity > item.minQuantity"
                  >
                    Qty: {{ item.quantity }}
                  </span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ItemListComponent implements OnInit {
  private itemService = inject(InventoryItemService);
  private authService = inject(AuthService);

  loading = signal(true);
  items = signal<InventoryItem[]>([]);
  filteredItems = signal<InventoryItem[]>([]);
  searchQuery = '';

  canCreate = () => this.authService.hasPermission('canAdjustQuantity');

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.loading.set(true);
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.filteredItems.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterItems(): void {
    if (!this.searchQuery) {
      this.filteredItems.set(this.items());
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredItems.set(
      this.items().filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.sku.toLowerCase().includes(query)
      )
    );
  }
}
