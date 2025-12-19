import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryItemService, LocationService } from '../../core/services';
import { InventoryItemCreate, StorageLocation } from '../../core/models';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  isEdit = signal(false);
  saving = signal(false);
  itemId = signal<number | null>(null);
  locations = signal<StorageLocation[]>([]);

  tagsInput = '';

  form: InventoryItemCreate = {
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    minQuantity: 0,
    currentLocationId: undefined,
    tags: [],
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.itemId.set(Number(id));
      this.loadItem(Number(id));
    }
    this.loadLocations();
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
        };
        this.tagsInput = item.tags.join(', ');
      },
    });
  }

  private loadLocations(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => this.locations.set(locations),
    });
  }

  onSubmit(): void {
    if (!this.form.name || !this.form.sku) return;

    this.saving.set(true);

    const data = {
      ...this.form,
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
      this.router.navigate(['/items']);
    }
  }
}
