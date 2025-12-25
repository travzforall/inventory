import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CidRegistryService } from '../../core/services';

@Component({
  selector: 'app-cid-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/labels" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">CID Registry</h1>
        </div>
        <div class="flex-none">
          <span class="badge badge-lg">{{ allCids().length }} CIDs</span>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-4xl">
        <!-- Search -->
        <div class="form-control mb-4">
          <div class="input-group">
            <input
              type="text"
              placeholder="Search CIDs or names..."
              class="input input-bordered w-full"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch($event)"
            />
            @if (searchQuery) {
              <button class="btn btn-ghost" (click)="clearSearch()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Results -->
        @if (filteredCids().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <h2 class="text-xl font-semibold mt-4">
                {{ searchQuery ? 'No matching CIDs' : 'No CIDs registered' }}
              </h2>
              <p class="text-base-content/60">
                {{ searchQuery ? 'Try a different search term' : 'CIDs are registered when items are created' }}
              </p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-zebra bg-base-100 shadow-xl rounded-xl">
              <thead>
                <tr>
                  <th>CID</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (entry of filteredCids(); track entry.cid) {
                  <tr>
                    <td class="font-mono font-bold">{{ entry.cid }}</td>
                    <td>{{ entry.name }}</td>
                    <td class="text-sm text-base-content/60">
                      {{ formatDate(entry.createdAt) }}
                    </td>
                    <td>
                      @if (entry.itemId) {
                        <a
                          [routerLink]="['/items', entry.itemId]"
                          class="btn btn-ghost btn-xs"
                        >
                          View Item
                        </a>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Danger Zone -->
        <div class="card bg-error/10 mt-8">
          <div class="card-body">
            <h3 class="card-title text-error text-sm">Danger Zone</h3>
            <p class="text-sm text-base-content/60">
              Clear all CIDs from the registry. This cannot be undone.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-error btn-sm" (click)="clearRegistry()">
                Clear All CIDs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CidRegistryComponent {
  private cidRegistry = inject(CidRegistryService);

  searchQuery = '';
  searchResults = signal<ReturnType<CidRegistryService['allCids']> | null>(null);

  allCids = computed(() => this.cidRegistry.allCids());

  filteredCids = computed(() => {
    const results = this.searchResults();
    if (results !== null) {
      return results;
    }
    return this.allCids();
  });

  onSearch(query: string): void {
    if (query.trim()) {
      this.searchResults.set(this.cidRegistry.search(query));
    } else {
      this.searchResults.set(null);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set(null);
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString();
  }

  clearRegistry(): void {
    if (confirm('Are you sure you want to clear all CIDs? This cannot be undone.')) {
      this.cidRegistry.clearAll();
    }
  }
}
