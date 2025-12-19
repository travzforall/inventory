import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService, InventoryItemService } from '../../core/services';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NfcTagData {
  type: 'location' | 'item';
  name?: string;
  code?: string;
  sku?: string;
  quantity?: number;
  description?: string;
  parentId?: number;
  locationId?: number;
  minQuantity?: number;
  category?: string;
}

@Component({
  selector: 'app-nfc-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          @if (processing()) {
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <h2 class="card-title mt-4">Processing NFC Tag...</h2>
            <p class="text-base-content/70">
              @if (statusMessage()) {
                {{ statusMessage() }}
              } @else {
                Detected: {{ tagData()?.type | titlecase }}
              }
            </p>
          } @else if (error()) {
            <div class="text-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 class="card-title mt-4">Invalid Tag Data</h2>
            <p class="text-base-content/70">{{ errorMessage() }}</p>
            <div class="card-actions mt-4">
              <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class NfcEntryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationService = inject(LocationService);
  private itemService = inject(InventoryItemService);

  processing = signal(true);
  error = signal(false);
  errorMessage = signal('');
  statusMessage = signal('');
  tagData = signal<NfcTagData | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    // Parse the tag data from URL params
    const data = this.parseTagData(params);

    if (!data) {
      this.error.set(true);
      this.errorMessage.set('Missing or invalid tag type. URL must include ?type=location or ?type=item');
      this.processing.set(false);
      return;
    }

    this.tagData.set(data);
    this.statusMessage.set('Checking if already exists...');

    // Check if the location/item already exists
    this.checkExistingAndRedirect(data);
  }

  private parseTagData(params: Record<string, string>): NfcTagData | null {
    const type = params['type']?.toLowerCase();

    if (type !== 'location' && type !== 'item') {
      return null;
    }

    const data: NfcTagData = {
      type: type as 'location' | 'item',
      name: params['name'],
      code: params['code'],
      description: params['description'],
    };

    if (type === 'location') {
      if (params['parentId']) {
        data.parentId = parseInt(params['parentId'], 10);
      }
    }

    if (type === 'item') {
      data.sku = params['sku'];
      data.category = params['category'];
      if (params['quantity']) {
        data.quantity = parseInt(params['quantity'], 10);
      }
      if (params['minQuantity']) {
        data.minQuantity = parseInt(params['minQuantity'], 10);
      }
      if (params['locationId']) {
        data.locationId = parseInt(params['locationId'], 10);
      }
    }

    return data;
  }

  private checkExistingAndRedirect(data: NfcTagData): void {
    if (data.type === 'location') {
      this.checkExistingLocation(data);
    } else {
      this.checkExistingItem(data);
    }
  }

  private checkExistingLocation(data: NfcTagData): void {
    // Search for location by name
    this.locationService.getAll().pipe(
      map(locations => {
        // Find by exact name match (case-insensitive)
        const searchName = data.name?.toLowerCase().trim();
        return locations.find(loc => loc.name.toLowerCase().trim() === searchName);
      }),
      catchError(() => of(null))
    ).subscribe(existingLocation => {
      if (existingLocation) {
        // Location exists - go to detail view
        this.statusMessage.set(`Found: ${existingLocation.name}`);
        setTimeout(() => {
          this.router.navigate(['/locations', existingLocation.id]);
        }, 300);
      } else {
        // Location doesn't exist - go to add form
        this.statusMessage.set('New location - opening form...');
        setTimeout(() => {
          this.redirectToForm(data);
        }, 300);
      }
    });
  }

  private checkExistingItem(data: NfcTagData): void {
    // Search for item by SKU first (more unique), then by name
    this.itemService.getAll().pipe(
      map(items => {
        // First try to match by SKU if provided
        if (data.sku) {
          const searchSku = data.sku.toLowerCase().trim();
          const bySkU = items.find(item => item.sku.toLowerCase().trim() === searchSku);
          if (bySkU) return bySkU;
        }
        // Then try by name
        if (data.name) {
          const searchName = data.name.toLowerCase().trim();
          return items.find(item => item.name.toLowerCase().trim() === searchName);
        }
        return null;
      }),
      catchError(() => of(null))
    ).subscribe(existingItem => {
      if (existingItem) {
        // Item exists - go to detail view
        this.statusMessage.set(`Found: ${existingItem.name}`);
        setTimeout(() => {
          this.router.navigate(['/items', existingItem.id]);
        }, 300);
      } else {
        // Item doesn't exist - go to add form
        this.statusMessage.set('New item - opening form...');
        setTimeout(() => {
          this.redirectToForm(data);
        }, 300);
      }
    });
  }

  private redirectToForm(data: NfcTagData): void {
    const queryParams: Record<string, string | number> = {};

    // Build query params from tag data
    if (data.name) queryParams['name'] = data.name;
    if (data.code) queryParams['code'] = data.code;
    if (data.description) queryParams['description'] = data.description;

    if (data.type === 'location') {
      if (data.parentId) queryParams['parentId'] = data.parentId;
      this.router.navigate(['/locations/add'], { queryParams });
    } else {
      if (data.sku) queryParams['sku'] = data.sku;
      if (data.category) queryParams['category'] = data.category;
      if (data.quantity) queryParams['quantity'] = data.quantity;
      if (data.minQuantity) queryParams['minQuantity'] = data.minQuantity;
      if (data.locationId) queryParams['locationId'] = data.locationId;
      this.router.navigate(['/items/add'], { queryParams });
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
