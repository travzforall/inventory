import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IdTemplateService } from '../../core/services/id-template.service';
import { InventoryItemService } from '../../core/services/inventory-item.service';
import { LocationService } from '../../core/services/location.service';
import {
  IdTemplate,
  IdSegment,
  SegmentValue,
  PendingBulkItem,
} from '../../core/models/id-template.model';
import { StorageLocation } from '../../core/models/location.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bulk-item-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
          <h1 class="text-xl font-bold ml-2">Bulk Add Items</h1>
        </div>
        <div class="flex-none gap-2">
          @if (pendingItems().length > 0) {
            <button
              class="btn btn-success btn-sm"
              [disabled]="saving()"
              (click)="createAllItems()"
            >
              @if (saving()) {
                <span class="loading loading-spinner loading-xs"></span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              }
              Create All ({{ pendingItems().length }})
            </button>
          }
        </div>
      </div>

      <div class="container mx-auto p-4">
        @if (loading()) {
          <div class="flex justify-center items-center h-64">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else {
          <!-- Location Info -->
          @if (location()) {
            <div class="alert mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Adding items to: <strong>{{ location()?.name }}</strong></span>
            </div>
          }

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Item Builder -->
            <div class="space-y-4">
              <!-- Template Selection -->
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <div class="flex justify-between items-center">
                    <h2 class="card-title">Select Template</h2>
                    <a routerLink="/id-templates" class="btn btn-ghost btn-xs">
                      Manage Templates
                    </a>
                  </div>

                  @if (templates().length === 0) {
                    <div class="text-center py-4">
                      <p class="text-base-content/60">No templates available</p>
                      <a routerLink="/id-templates/add" class="btn btn-sm btn-primary mt-2">
                        Create Template
                      </a>
                    </div>
                  } @else {
                    <div class="form-control">
                      <select
                        class="select select-bordered w-full"
                        [(ngModel)]="selectedTemplateId"
                        (ngModelChange)="onTemplateChange()"
                      >
                        <option [ngValue]="null">-- Select a template --</option>
                        @for (template of templates(); track template.id) {
                          <option [ngValue]="template.id">
                            {{ template.name }} ({{ template.category }})
                          </option>
                        }
                      </select>
                    </div>
                  }
                </div>
              </div>

              <!-- Segment Inputs -->
              @if (selectedTemplate()) {
                <div class="card bg-base-100 shadow-xl">
                  <div class="card-body">
                    <h2 class="card-title">{{ selectedTemplate()!.name }} Details</h2>

                    <!-- ID Preview -->
                    <div class="p-4 bg-primary/10 rounded-lg mb-4">
                      <p class="text-xs text-base-content/60 mb-1">Generated ID</p>
                      <code class="text-2xl font-mono font-bold text-primary">
                        {{ generatedId() || '...' }}
                      </code>
                    </div>

                    <!-- Segment Inputs -->
                    <div class="space-y-4">
                      @for (segment of selectedTemplate()!.segments; track segment.name) {
                        <div class="form-control">
                          <label class="label">
                            <span class="label-text font-semibold">{{ segment.name }}</span>
                            @if (segment.prefix || segment.suffix) {
                              <span class="label-text-alt">
                                @if (segment.prefix) { prefix: {{ segment.prefix }} }
                                @if (segment.suffix) { suffix: {{ segment.suffix }} }
                              </span>
                            }
                          </label>

                          @if (segment.type === 'select') {
                            <select
                              class="select select-bordered w-full"
                              [ngModel]="getSegmentValue(segment.name)"
                              (ngModelChange)="setSegmentValue(segment.name, $event)"
                            >
                              <option value="">-- Select --</option>
                              @for (option of segment.options; track option.code) {
                                <option [value]="option.code">
                                  {{ option.label }} ({{ option.code }})
                                </option>
                              }
                            </select>
                          } @else if (segment.type === 'number') {
                            <input
                              type="number"
                              class="input input-bordered w-full"
                              placeholder="Enter number"
                              [ngModel]="getSegmentValue(segment.name)"
                              (ngModelChange)="setSegmentValue(segment.name, $event)"
                            />
                          } @else {
                            <input
                              type="text"
                              class="input input-bordered w-full"
                              placeholder="Enter text"
                              [ngModel]="getSegmentValue(segment.name)"
                              (ngModelChange)="setSegmentValue(segment.name, $event)"
                            />
                          }
                        </div>
                      }
                    </div>

                    <!-- Additional Fields -->
                    <div class="divider">Additional Info</div>

                    <div class="grid grid-cols-2 gap-4">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Quantity</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered"
                          min="1"
                          [(ngModel)]="quantity"
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Name Override (optional)</span>
                        </label>
                        <input
                          type="text"
                          class="input input-bordered"
                          placeholder="Auto-generated"
                          [(ngModel)]="nameOverride"
                        />
                      </div>
                    </div>

                    <div class="card-actions justify-end mt-4">
                      <button
                        class="btn btn-primary"
                        [disabled]="!canAddToList()"
                        (click)="addToList()"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Right: Pending Items List -->
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="card-title">
                    Pending Items
                    @if (pendingItems().length > 0) {
                      <span class="badge badge-primary">{{ pendingItems().length }}</span>
                    }
                  </h2>
                  @if (pendingItems().length > 0) {
                    <button class="btn btn-ghost btn-xs text-error" (click)="clearAllPending()">
                      Clear All
                    </button>
                  }
                </div>

                @if (pendingItems().length === 0) {
                  <div class="text-center py-12 text-base-content/60">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No items in queue</p>
                    <p class="text-sm">Select a template and add items to the list</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of pendingItems(); track item.id) {
                          <tr>
                            <td>
                              <code class="font-mono text-primary">{{ item.generatedSku }}</code>
                            </td>
                            <td class="max-w-xs truncate">{{ item.name }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>
                              <button
                                class="btn btn-ghost btn-xs text-error"
                                (click)="removePendingItem(item.id)"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="divider"></div>

                  <div class="flex justify-between items-center">
                    <div>
                      <p class="text-sm text-base-content/60">Total items: {{ pendingItems().length }}</p>
                      <p class="text-sm text-base-content/60">Total quantity: {{ totalQuantity() }}</p>
                    </div>
                    <button
                      class="btn btn-success"
                      [disabled]="saving()"
                      (click)="createAllItems()"
                    >
                      @if (saving()) {
                        <span class="loading loading-spinner loading-sm"></span>
                        Creating...
                      } @else {
                        Create All Items
                      }
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Success Toast -->
        @if (showSuccess()) {
          <div class="toast toast-top toast-end">
            <div class="alert alert-success">
              <span>{{ successMessage() }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BulkItemAddComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templateService = inject(IdTemplateService);
  private itemService = inject(InventoryItemService);
  private locationService = inject(LocationService);

  loading = signal(true);
  saving = signal(false);
  templates = signal<IdTemplate[]>([]);
  location = signal<StorageLocation | null>(null);
  locationId = signal<number | null>(null);

  selectedTemplateId: number | null = null;
  selectedTemplate = signal<IdTemplate | null>(null);
  segmentValues = signal<Map<string, string>>(new Map());

  quantity = 1;
  nameOverride = '';

  pendingItems = signal<PendingBulkItem[]>([]);

  showSuccess = signal(false);
  successMessage = signal('');

  generatedId = computed(() => {
    const template = this.selectedTemplate();
    if (!template) return '';

    const values: SegmentValue[] = [];
    this.segmentValues().forEach((value, name) => {
      if (value) {
        values.push({ segmentName: name, value });
      }
    });

    return this.templateService.generateId(template, values);
  });

  totalQuantity = computed(() => {
    return this.pendingItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  canAddToList = computed(() => {
    const template = this.selectedTemplate();
    if (!template) return false;
    if (!this.generatedId()) return false;

    // Check all required segments have values
    for (const segment of template.segments) {
      const value = this.segmentValues().get(segment.name);
      if (!value) return false;
    }

    return true;
  });

  ngOnInit(): void {
    const locationIdParam = this.route.snapshot.queryParams['locationId'];
    if (locationIdParam) {
      this.locationId.set(Number(locationIdParam));
    }

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.templateService.getAll().subscribe({
      next: (templates) => {
        this.templates.set(templates);

        if (this.locationId()) {
          this.locationService.getById(this.locationId()!).subscribe({
            next: (location) => {
              this.location.set(location);
              this.loading.set(false);
            },
            error: () => {
              this.loading.set(false);
            },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onTemplateChange(): void {
    if (this.selectedTemplateId) {
      const template = this.templates().find((t) => t.id === this.selectedTemplateId);
      this.selectedTemplate.set(template || null);
      this.segmentValues.set(new Map());
    } else {
      this.selectedTemplate.set(null);
      this.segmentValues.set(new Map());
    }
  }

  getSegmentValue(name: string): string {
    return this.segmentValues().get(name) || '';
  }

  setSegmentValue(name: string, value: string): void {
    this.segmentValues.update((map) => {
      const newMap = new Map(map);
      newMap.set(name, value);
      return newMap;
    });
  }

  addToList(): void {
    const template = this.selectedTemplate();
    if (!template) return;

    const values: SegmentValue[] = [];
    this.segmentValues().forEach((value, name) => {
      values.push({ segmentName: name, value });
    });

    const generatedSku = this.templateService.generateId(template, values);
    const generatedName = this.nameOverride.trim() || this.templateService.generateName(template, values);

    const pendingItem: PendingBulkItem = {
      id: crypto.randomUUID(),
      generatedSku,
      name: generatedName,
      quantity: this.quantity,
      templateId: template.id,
      segmentValues: values,
    };

    this.pendingItems.update((items) => [...items, pendingItem]);

    // Reset form for next item
    this.quantity = 1;
    this.nameOverride = '';
    // Keep template and segment values for quick successive additions
  }

  removePendingItem(id: string): void {
    this.pendingItems.update((items) => items.filter((item) => item.id !== id));
  }

  clearAllPending(): void {
    this.pendingItems.set([]);
  }

  createAllItems(): void {
    if (this.pendingItems().length === 0) return;

    this.saving.set(true);

    const createRequests = this.pendingItems().map((item) =>
      this.itemService.create({
        name: item.name,
        sku: item.generatedSku,
        quantity: item.quantity,
        currentLocationId: this.locationId() || undefined,
        category: this.templates().find((t) => t.id === item.templateId)?.category || '',
        tags: [],
      })
    );

    forkJoin(createRequests).subscribe({
      next: (results) => {
        this.saving.set(false);
        this.showSuccessMessage(`Created ${results.length} items successfully!`);
        this.pendingItems.set([]);

        // Navigate back to location if we have one
        if (this.locationId()) {
          setTimeout(() => {
            this.router.navigate(['/locations', this.locationId()]);
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Error creating items:', err);
        this.saving.set(false);
      },
    });
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    this.showSuccess.set(true);
    setTimeout(() => {
      this.showSuccess.set(false);
    }, 3000);
  }

  goBack(): void {
    if (this.locationId()) {
      this.router.navigate(['/locations', this.locationId()]);
    } else {
      this.router.navigate(['/items']);
    }
  }
}
