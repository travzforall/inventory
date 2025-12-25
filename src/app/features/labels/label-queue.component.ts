import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabelQueueService, CidRegistryService } from '../../core/services';

@Component({
  selector: 'app-label-queue',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Label Queue</h1>
        </div>
        <div class="flex-none gap-2">
          @if (pendingCount() > 0) {
            <button class="btn btn-primary btn-sm" (click)="printAll()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print All ({{ totalLabelsCount() }})
            </button>
          }
          <button class="btn btn-ghost btn-sm" routerLink="/labels/registry">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            CID Registry
          </button>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-4xl">
        <!-- Stats -->
        <div class="stats shadow w-full mb-4">
          <div class="stat">
            <div class="stat-title">Pending Labels</div>
            <div class="stat-value text-primary">{{ pendingCount() }}</div>
            <div class="stat-desc">{{ totalLabelsCount() }} total labels</div>
          </div>
          <div class="stat">
            <div class="stat-title">Printed</div>
            <div class="stat-value text-success">{{ printedCount() }}</div>
            <div class="stat-desc">Already printed</div>
          </div>
          <div class="stat">
            <div class="stat-title">CIDs Registered</div>
            <div class="stat-value">{{ cidCount() }}</div>
            <div class="stat-desc">In registry</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs tabs-boxed mb-4">
          <button
            class="tab"
            [class.tab-active]="activeTab() === 'pending'"
            (click)="activeTab.set('pending')"
          >
            Pending ({{ pendingCount() }})
          </button>
          <button
            class="tab"
            [class.tab-active]="activeTab() === 'printed'"
            (click)="activeTab.set('printed')"
          >
            Printed ({{ printedCount() }})
          </button>
        </div>

        <!-- Pending Items -->
        @if (activeTab() === 'pending') {
          @if (pendingItems().length === 0) {
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h2 class="text-xl font-semibold mt-4">No labels in queue</h2>
                <p class="text-base-content/60">Add items to print labels for them</p>
                <a routerLink="/items/add" class="btn btn-primary mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Item
                </a>
              </div>
            </div>
          } @else {
            <div class="space-y-2">
              @for (item of pendingItems(); track item.id) {
                <div class="card bg-base-100 shadow-sm">
                  <div class="card-body p-4 flex-row items-center justify-between">
                    <div class="flex items-center gap-4">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary"
                        [checked]="selectedItems().has(item.id)"
                        (change)="toggleSelect(item.id)"
                      />
                      <div>
                        <div class="font-mono font-bold text-lg">{{ item.cid }}</div>
                        <div class="text-sm text-base-content/60">{{ item.name }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="badge badge-outline">{{ item.quantity }} label(s)</div>
                      <button
                        class="btn btn-ghost btn-sm btn-square"
                        (click)="removeFromQueue(item.id)"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Bulk Actions -->
            @if (selectedItems().size > 0) {
              <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                <div class="card bg-base-100 shadow-2xl border border-base-300">
                  <div class="card-body p-3 flex-row items-center gap-3">
                    <span class="text-sm font-medium">{{ selectedItems().size }} selected</span>
                    <button class="btn btn-primary btn-sm" (click)="printSelected()">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Selected
                    </button>
                    <button class="btn btn-error btn-sm" (click)="removeSelected()">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                    <button class="btn btn-ghost btn-sm" (click)="clearSelection()">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        }

        <!-- Printed Items -->
        @if (activeTab() === 'printed') {
          @if (printedItems().length === 0) {
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 class="text-xl font-semibold mt-4">No printed labels yet</h2>
                <p class="text-base-content/60">Labels will appear here after printing</p>
              </div>
            </div>
          } @else {
            <div class="flex justify-end mb-2">
              <button class="btn btn-ghost btn-sm" (click)="clearPrinted()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Printed
              </button>
            </div>
            <div class="space-y-2">
              @for (item of printedItems(); track item.id) {
                <div class="card bg-base-100 shadow-sm opacity-60">
                  <div class="card-body p-4 flex-row items-center justify-between">
                    <div class="flex items-center gap-4">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <div class="font-mono font-bold">{{ item.cid }}</div>
                        <div class="text-sm text-base-content/60">{{ item.name }}</div>
                      </div>
                    </div>
                    <div class="badge badge-success badge-outline">Printed</div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class LabelQueueComponent {
  private labelQueue = inject(LabelQueueService);
  private cidRegistry = inject(CidRegistryService);

  activeTab = signal<'pending' | 'printed'>('pending');
  selectedItems = signal<Set<string>>(new Set());

  // Wrap service signals
  pendingItems = computed(() => this.labelQueue.pendingItems());
  printedItems = computed(() => this.labelQueue.printedItems());
  pendingCount = computed(() => this.labelQueue.pendingCount());
  printedCount = computed(() => this.printedItems().length);
  totalLabelsCount = computed(() => this.labelQueue.totalLabelsCount());
  cidCount = computed(() => this.cidRegistry.cidCount());

  toggleSelect(id: string): void {
    const current = this.selectedItems();
    const newSet = new Set(current);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedItems.set(newSet);
  }

  clearSelection(): void {
    this.selectedItems.set(new Set());
  }

  printAll(): void {
    this.labelQueue.markAllAsPrinted();
    this.clearSelection();
    // TODO: Actually open print dialog/generate PDF
    alert(`Printing ${this.totalLabelsCount()} labels...`);
  }

  printSelected(): void {
    const ids = Array.from(this.selectedItems());
    this.labelQueue.markAsPrinted(ids);
    this.clearSelection();
    // TODO: Actually open print dialog
    alert(`Printing ${ids.length} labels...`);
  }

  removeFromQueue(id: string): void {
    this.labelQueue.removeFromQueue(id);
  }

  removeSelected(): void {
    const ids = Array.from(this.selectedItems());
    this.labelQueue.removeMultiple(ids);
    this.clearSelection();
  }

  clearPrinted(): void {
    this.labelQueue.clearPrinted();
  }
}
