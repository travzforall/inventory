import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryItemService } from '../../core/services';
import { InventoryItem } from '../../core/models';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/dashboard" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Low Stock Items</h1>
        </div>
      </div>

      <div class="container mx-auto p-4">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (items().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-xl font-semibold mt-4">All Stock Levels OK</h3>
              <p class="text-base-content/70">No items are currently below minimum quantity</p>
            </div>
          </div>
        } @else {
          <div class="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ items().length }} item(s) need restocking</span>
          </div>

          <div class="space-y-2">
            @for (item of items(); track item.id) {
              <a
                [routerLink]="['/items', item.id]"
                class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
              >
                <div class="card-body p-4 flex-row items-center gap-4">
                  <div class="avatar">
                    <div class="w-16 h-16 rounded bg-base-200">
                      @if (item.images.length > 0) {
                        <img [src]="item.images[0]" [alt]="item.name" class="object-cover" />
                      } @else {
                        <div class="flex items-center justify-center h-full">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      }
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <p class="text-sm text-base-content/60">SKU: {{ item.sku }}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-warning">{{ item.quantity }}</div>
                    <div class="text-sm text-base-content/60">Min: {{ item.minQuantity }}</div>
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LowStockComponent implements OnInit {
  private itemService = inject(InventoryItemService);

  loading = signal(true);
  items = signal<InventoryItem[]>([]);

  ngOnInit(): void {
    this.itemService.getLowStockItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
