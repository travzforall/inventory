import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationService } from '../../core/services';
import { StorageLocation, StorageLocationCreate } from '../../core/models';

@Component({
  selector: 'app-location-form',
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
          <h1 class="text-xl font-bold ml-2">{{ isEdit() ? 'Edit Location' : 'New Location' }}</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-2xl">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <form (ngSubmit)="onSubmit()">
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Shelf A1, Room 203"
                  class="input input-bordered w-full"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                />
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Optional description of this location"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.description"
                  name="description"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Parent Location</span>
                </label>
                <select
                  class="select select-bordered w-full"
                  [(ngModel)]="form.parentLocationId"
                  name="parentLocationId"
                >
                  <option [ngValue]="null">None (Root Location)</option>
                  @for (loc of availableParents(); track loc.id) {
                    <option [ngValue]="loc.id">{{ loc.name }}</option>
                  }
                </select>
              </div>

              <div class="divider"></div>

              <div class="flex justify-end gap-2">
                <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving() || !form.name"
                >
                  @if (saving()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  {{ isEdit() ? 'Save Changes' : 'Create Location' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LocationFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private locationService = inject(LocationService);

  isEdit = signal(false);
  saving = signal(false);
  locationId = signal<number | null>(null);
  availableParents = signal<StorageLocation[]>([]);

  form: StorageLocationCreate = {
    name: '',
    description: '',
    parentLocationId: undefined,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.locationId.set(Number(id));
      this.loadLocation(Number(id));
    } else {
      // Pre-fill from query params (from NFC scan)
      this.prefillFromQueryParams();
    }
    this.loadParentOptions();
  }

  private prefillFromQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params['name']) {
      this.form.name = params['name'];
    }
    if (params['code']) {
      // If there's a code, append it to description or use as name prefix
      this.form.name = params['name'] || params['code'];
    }
    if (params['description']) {
      this.form.description = params['description'];
    }
    if (params['parentId']) {
      this.form.parentLocationId = parseInt(params['parentId'], 10);
    }

    // Handle category - add to description for locations
    if (params['category']) {
      const categoryNote = `Type: ${params['category']}`;
      this.form.description = this.form.description
        ? `${categoryNote}\n${this.form.description}`
        : categoryNote;
    }

    // Handle notes
    if (params['notes'] && params['notes'].trim()) {
      this.form.description = this.form.description
        ? `${this.form.description}\n\nNotes: ${params['notes']}`
        : `Notes: ${params['notes']}`;
    }

    // Handle parentLocation string (search for matching location)
    if (params['parentLocation'] && !params['parentId']) {
      // Store it for later lookup once locations are loaded
      this.pendingParentLookup = params['parentLocation'];
    }
  }

  private pendingParentLookup: string | null = null;

  private loadLocation(id: number): void {
    this.locationService.getById(id).subscribe({
      next: (location) => {
        this.form = {
          name: location.name,
          description: location.description,
          parentLocationId: location.parentLocationId ?? undefined,
        };
      },
    });
  }

  private loadParentOptions(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => {
        // Filter out current location if editing
        const id = this.locationId();
        this.availableParents.set(
          id ? locations.filter((l) => l.id !== id) : locations
        );

        // Handle pending parent lookup from QR code
        if (this.pendingParentLookup) {
          const searchName = this.pendingParentLookup.toLowerCase().trim();
          const matchingParent = locations.find(
            (loc) => loc.name.toLowerCase().trim() === searchName
          );
          if (matchingParent) {
            this.form.parentLocationId = matchingParent.id;
          }
          this.pendingParentLookup = null;
        }
      },
    });
  }

  onSubmit(): void {
    if (!this.form.name) return;

    this.saving.set(true);

    const data = {
      ...this.form,
      parentLocationId: this.form.parentLocationId || undefined,
    };

    const request = this.isEdit()
      ? this.locationService.update(this.locationId()!, data)
      : this.locationService.create(data);

    request.subscribe({
      next: (location) => {
        this.saving.set(false);
        this.router.navigate(['/locations', location.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    if (this.isEdit() && this.locationId()) {
      this.router.navigate(['/locations', this.locationId()]);
    } else {
      this.router.navigate(['/locations']);
    }
  }
}
