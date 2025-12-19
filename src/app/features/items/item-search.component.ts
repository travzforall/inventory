import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryItemService } from '../../core/services';
import { InventoryItem } from '../../core/models';

@Component({
  selector: 'app-item-search',
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
          <h1 class="text-xl font-bold ml-2">Search Items</h1>
        </div>
      </div>

      <div class="container mx-auto p-4">
        <div class="form-control mb-6">
          <div class="input-group">
            <input
              type="text"
              placeholder="Search by name, SKU, or description..."
              class="input input-bordered w-full input-lg"
              [(ngModel)]="searchQuery"
              (keyup.enter)="search()"
              autofocus
            />
            <button class="btn btn-primary btn-lg" (click)="search()" [disabled]="searching()">
              @if (searching()) {
                <span class="loading loading-spinner"></span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            </button>
          </div>
        </div>

        @if (hasSearched() && results().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-xl font-semibold mt-4">No results found</h3>
              <p class="text-base-content/70">Try a different search term</p>
            </div>
          </div>
        } @else if (results().length > 0) {
          <div class="mb-4 text-sm text-base-content/60">
            Found {{ results().length }} item(s)
          </div>
          <div class="space-y-2">
            @for (item of results(); track item.id) {
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
                    @if (item.description) {
                      <p class="text-sm text-base-content/60 truncate">{{ item.description }}</p>
                    }
                  </div>
                  <div class="text-right">
                    <span
                      class="badge"
                      [class.badge-warning]="item.quantity <= item.minQuantity"
                      [class.badge-success]="item.quantity > item.minQuantity"
                    >
                      Qty: {{ item.quantity }}
                    </span>
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
export class ItemSearchComponent {
  private itemService = inject(InventoryItemService);

  searchQuery = '';
  searching = signal(false);
  hasSearched = signal(false);
  results = signal<InventoryItem[]>([]);

  search(): void {
    if (!this.searchQuery.trim()) return;

    this.searching.set(true);
    this.itemService.search(this.searchQuery).subscribe({
      next: (items) => {
        this.results.set(items);
        this.hasSearched.set(true);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }
}
