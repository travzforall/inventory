import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
            <p class="text-base-content/70">Detected: {{ tagData()?.type | titlecase }}</p>
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

  processing = signal(true);
  error = signal(false);
  errorMessage = signal('');
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

    // Small delay for visual feedback, then redirect
    setTimeout(() => {
      this.redirectToForm(data);
    }, 500);
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
