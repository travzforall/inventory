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

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Tags (comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., electronics, tools, office"
                  class="input input-bordered w-full"
                  [(ngModel)]="tagsInput"
                  name="tags"
                />
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

  form: InventoryItemCreate = {
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    minQuantity: 0,
    currentLocationId: undefined,
    tags: [],
    images: [],
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
    if (params['name']) {
      this.form.name = params['name'];
    }
    if (params['sku']) {
      this.form.sku = params['sku'];
    }
    if (params['description']) {
      this.form.description = params['description'];
    }
    if (params['quantity']) {
      this.form.quantity = parseInt(params['quantity'], 10) || 0;
    }
    if (params['minQuantity']) {
      this.form.minQuantity = parseInt(params['minQuantity'], 10) || 0;
    }
    if (params['locationId']) {
      this.form.currentLocationId = parseInt(params['locationId'], 10);
    }
    if (params['category']) {
      this.tagsInput = params['category'];
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
      next: (locations) => this.locations.set(locations),
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
