import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryItemService, LocationService } from '../../core/services';
import { InventoryItemCreate, StorageLocation } from '../../core/models';
import { CameraCaptureComponent } from '../../shared/components/camera-capture.component';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CameraCaptureComponent],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <button class="btn btn-ghost btn-circle" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold ml-2">{{ isEdit() ? 'Edit Item' : 'New Item' }}</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-2xl">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <form (ngSubmit)="onSubmit()">
              <!-- Photos Section -->
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Photos</span>
                </label>
                <app-camera-capture
                  #cameraCapture
                  (imagesChanged)="onImagesChanged($event)"
                />
              </div>

              <div class="divider"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Item name"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.name"
                    name="name"
                    required
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">SKU *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ITEM-001"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.sku"
                    name="sku"
                    required
                  />
                  @if (!form.sku && form.name) {
                    <label class="label">
                      <span class="label-text-alt">
                        <button type="button" class="link link-primary" (click)="generateSku()">
                          Generate SKU
                        </button>
                      </span>
                    </label>
                  }
                </div>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Optional description"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.description"
                  name="description"
                  rows="3"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Quantity</span>
                  </label>
                  <input
                    type="number"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.quantity"
                    name="quantity"
                    min="0"
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Min Quantity (Low Stock)</span>
                  </label>
                  <input
                    type="number"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.minQuantity"
                    name="minQuantity"
                    min="0"
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Location</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.currentLocationId"
                    name="currentLocationId"
                  >
                    <option [ngValue]="undefined">No Location</option>
                    @for (loc of locations(); track loc.id) {
                      <option [ngValue]="loc.id">{{ loc.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Category</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.category"
                    name="category"
                  >
                    <option value="">No category</option>
                    <option value="electronics">Electronics</option>
                    <option value="tools">Tools</option>
                    <option value="office">Office Supplies</option>
                    <option value="furniture">Furniture</option>
                    <option value="consumables">Consumables</option>
                    <option value="equipment">Equipment</option>
                    <option value="parts">Parts & Components</option>
                    <option value="packaging">Packaging</option>
                    <option value="safety">Safety & PPE</option>
                    <option value="cleaning">Cleaning Supplies</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Unit of Measure</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.unit"
                    name="unit"
                  >
                    <option value="">No unit</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (L)</option>
                    <option value="ml">Milliliters (mL)</option>
                    <option value="m">Meters (m)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="box">Boxes</option>
                    <option value="pack">Packs</option>
                    <option value="roll">Rolls</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Tags (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., fragile, hazmat, perishable"
                    class="input input-bordered w-full"
                    [(ngModel)]="tagsInput"
                    name="tags"
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      [(ngModel)]="form.manageInventory"
                      name="manageInventory"
                    />
                    <span class="label-text">Manage Inventory</span>
                  </label>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">Track quantity and low-stock alerts</span>
                  </label>
                </div>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Notes</span>
                </label>
                <textarea
                  placeholder="Additional notes"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.notes"
                  name="notes"
                  rows="2"
                ></textarea>
              </div>

              <div class="divider"></div>

              <div class="flex justify-end gap-2">
                <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving() || !form.name || !form.sku"
                >
                  @if (saving()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  {{ isEdit() ? 'Save Changes' : 'Create Item' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ItemFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private itemService = inject(InventoryItemService);
  private locationService = inject(LocationService);

  cameraCapture = viewChild<CameraCaptureComponent>('cameraCapture');

  isEdit = signal(false);
  saving = signal(false);
  itemId = signal<number | null>(null);
  locations = signal<StorageLocation[]>([]);

  tagsInput = '';
  images: string[] = [];
  private pendingLocationLookup: string | null = null;

  form: InventoryItemCreate = {
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    minQuantity: 0,
    currentLocationId: undefined,
    tags: [],
    images: [],
    unit: '',
    notes: '',
    category: '',
    manageInventory: true,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.itemId.set(Number(id));
      this.loadItem(Number(id));
    } else {
      // Pre-fill from query params (from NFC scan)
      this.prefillFromQueryParams();
    }
    this.loadLocations();
  }

  private prefillFromQueryParams(): void {
    const params = this.route.snapshot.queryParams;

    // Helper to get param with fallback short form
    const getParam = (full: string, short?: string): string | undefined => {
      return params[full] || (short ? params[short] : undefined);
    };

    // Fill form fields directly (support both full and short param names from QR codes)
    const name = getParam('name');
    if (name) {
      this.form.name = name;
    }

    const sku = getParam('sku');
    if (sku) {
      this.form.sku = sku;
    }

    // Description: 'description' or 'desc'
    const description = getParam('description', 'desc');
    if (description) {
      this.form.description = description;
    }

    // Quantity: 'quantity' or 'qty'
    const quantity = getParam('quantity', 'qty');
    if (quantity) {
      this.form.quantity = parseInt(quantity, 10) || 0;
    }

    // Min Quantity: 'minQuantity' or 'minQty'
    const minQuantity = getParam('minQuantity', 'minQty');
    if (minQuantity) {
      this.form.minQuantity = parseInt(minQuantity, 10) || 0;
    }

    // Location: 'locationId', 'locId' or 'locationName', 'loc'
    const locationId = getParam('locationId', 'locId');
    if (locationId) {
      this.form.currentLocationId = parseInt(locationId, 10);
    }
    // Store location name for lookup after locations load
    const locationName = getParam('locationName', 'loc');
    if (locationName && !locationId) {
      this.pendingLocationLookup = locationName;
    }

    // Unit field
    const unit = getParam('unit');
    if (unit) {
      this.form.unit = unit;
    }

    // Notes field
    const notes = getParam('notes');
    if (notes) {
      this.form.notes = notes;
    }

    // Category: 'category' or 'cat'
    const category = getParam('category', 'cat');
    if (category) {
      this.form.category = category;
    }

    // Manage Inventory: 'manageInventory', 'manage', or 'inv'
    const manageVal = params['manageInventory'] ?? params['manage'] ?? params['inv'];
    if (manageVal !== undefined) {
      this.form.manageInventory = manageVal === 'true' || manageVal === '1' || manageVal === true;
    }

    // Build tags from tags param
    const tags = getParam('tags');
    if (tags) {
      const tagParts: string[] = [];
      tags.split(',').forEach((tag: string) => {
        const trimmed = tag.trim();
        if (trimmed) tagParts.push(trimmed);
      });
      if (tagParts.length > 0) {
        this.tagsInput = tagParts.join(', ');
      }
    }
  }

  private loadItem(id: number): void {
    this.itemService.getById(id).subscribe({
      next: (item) => {
        this.form = {
          name: item.name,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          currentLocationId: item.currentLocationId ?? undefined,
          tags: item.tags,
          images: item.images,
          unit: item.unit || '',
          notes: item.notes || '',
          category: item.category || '',
          manageInventory: item.manageInventory ?? true,
        };
        this.tagsInput = item.tags.join(', ');
        this.images = item.images;
        // Set images in camera component after view init
        setTimeout(() => {
          this.cameraCapture()?.setImages(item.images);
        });
      },
    });
  }

  private loadLocations(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => {
        this.locations.set(locations);

        // Handle pending location lookup from QR code
        if (this.pendingLocationLookup) {
          const searchName = this.pendingLocationLookup.toLowerCase().trim();
          const matchingLocation = locations.find(
            (loc) => loc.name.toLowerCase().trim() === searchName
          );
          if (matchingLocation) {
            this.form.currentLocationId = matchingLocation.id;
          }
          this.pendingLocationLookup = null;
        }
      },
    });
  }

  onImagesChanged(images: string[]): void {
    this.images = images;
  }

  generateSku(): void {
    // Generate SKU from name
    const prefix = this.form.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    const timestamp = Date.now().toString().slice(-4);
    this.form.sku = `${prefix}-${timestamp}`;
  }

  onSubmit(): void {
    if (!this.form.name || !this.form.sku) return;

    this.saving.set(true);

    const data = {
      ...this.form,
      images: this.images,
      tags: this.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
    };

    const request = this.isEdit()
      ? this.itemService.update(this.itemId()!, data)
      : this.itemService.create(data);

    request.subscribe({
      next: (item) => {
        this.saving.set(false);
        this.router.navigate(['/items', item.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    if (this.isEdit() && this.itemId()) {
      this.router.navigate(['/items', this.itemId()]);
    } else {
      // Check if we came from a location
      const locationId = this.route.snapshot.queryParams['locationId'];
      if (locationId) {
        this.router.navigate(['/locations', locationId]);
      } else {
        this.router.navigate(['/items']);
      }
    }
  }
}
