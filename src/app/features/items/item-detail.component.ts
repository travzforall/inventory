import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryItemService, LocationService, AuthService } from '../../core/services';
import { InventoryItem, StorageLocation } from '../../core/models';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
          <h1 class="text-xl font-bold ml-2">{{ item()?.name || 'Loading...' }}</h1>
        </div>
        <div class="flex-none">
          @if (canEdit()) {
            <button class="btn btn-ghost btn-circle" (click)="openEditModal()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else if (item()) {
        <div class="container mx-auto p-4">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Info -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Image Gallery -->
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  @if (item()!.images.length > 0) {
                    <div class="carousel w-full rounded-lg">
                      @for (img of item()!.images; track img; let i = $index) {
                        <div [id]="'item-slide' + i" class="carousel-item relative w-full">
                          <img [src]="img" class="w-full object-contain max-h-80" alt="Item image" />
                          <div class="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                            @if (i > 0) {
                              <a [href]="'#item-slide' + (i - 1)" class="btn btn-circle btn-sm">❮</a>
                            } @else {
                              <span></span>
                            }
                            @if (i < item()!.images.length - 1) {
                              <a [href]="'#item-slide' + (i + 1)" class="btn btn-circle btn-sm">❯</a>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    <!-- Thumbnail Navigation -->
                    <div class="flex justify-center gap-2 mt-4">
                      @for (img of item()!.images; track img; let i = $index) {
                        <a [href]="'#item-slide' + i" class="w-16 h-16 rounded-lg overflow-hidden border-2 border-base-300 hover:border-primary">
                          <img [src]="img" class="w-full h-full object-cover" alt="Thumbnail" />
                        </a>
                      }
                    </div>
                  } @else {
                    <div class="h-48 bg-base-200 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  }
                </div>
              </div>

              <!-- Description -->
              @if (item()!.description) {
                <div class="card bg-base-100 shadow-xl">
                  <div class="card-body">
                    <h2 class="card-title">Description</h2>
                    <p class="text-base-content/80 whitespace-pre-wrap">{{ item()!.description }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <!-- Quick Info -->
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title">{{ item()!.name }}</h2>
                  <p class="text-sm text-base-content/60">SKU: {{ item()!.sku }}</p>

                  <!-- Quantity Control -->
                  <div class="divider"></div>
                  <div class="flex items-center justify-between">
                    <span class="text-lg font-semibold">Quantity</span>
                    <div class="flex items-center gap-2">
                      @if (canAdjustQuantity()) {
                        <button
                          class="btn btn-circle btn-sm"
                          (click)="adjustQuantity(-1)"
                          [disabled]="item()!.quantity <= 0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                          </svg>
                        </button>
                      }
                      <span
                        class="text-2xl font-bold min-w-[3rem] text-center"
                        [class.text-warning]="item()!.quantity <= item()!.minQuantity"
                      >
                        {{ item()!.quantity }}
                      </span>
                      @if (canAdjustQuantity()) {
                        <button
                          class="btn btn-circle btn-sm"
                          (click)="adjustQuantity(1)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      }
                    </div>
                  </div>

                  @if (item()!.quantity <= item()!.minQuantity) {
                    <div class="alert alert-warning mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Low stock! Min: {{ item()!.minQuantity }}</span>
                    </div>
                  }

                  <!-- Quick Adjust -->
                  @if (canAdjustQuantity()) {
                    <div class="divider"></div>
                    <div class="flex flex-wrap gap-2">
                      <button class="btn btn-sm btn-outline" (click)="adjustQuantity(-5)">-5</button>
                      <button class="btn btn-sm btn-outline" (click)="adjustQuantity(-10)">-10</button>
                      <button class="btn btn-sm btn-outline" (click)="adjustQuantity(5)">+5</button>
                      <button class="btn btn-sm btn-outline" (click)="adjustQuantity(10)">+10</button>
                      <button class="btn btn-sm btn-outline flex-1" (click)="openAdjustModal()">Custom</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Location -->
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h2>
                  @if (currentLocation()) {
                    <a
                      [routerLink]="['/locations', currentLocation()!.id]"
                      class="link link-primary"
                    >
                      {{ currentLocation()!.name }}
                    </a>
                    @if (locationPath().length > 1) {
                      <div class="text-sm text-base-content/60">
                        {{ locationPathString() }}
                      </div>
                    }
                  } @else {
                    <span class="text-base-content/60">Not assigned</span>
                  }

                  @if (canAdjustQuantity()) {
                    <button class="btn btn-sm btn-outline mt-2" (click)="openTransferModal()">
                      Transfer to Another Location
                    </button>
                  }
                </div>
              </div>

              <!-- Tags -->
              @if (item()!.tags.length > 0) {
                <div class="card bg-base-100 shadow-xl">
                  <div class="card-body">
                    <h2 class="card-title">Tags</h2>
                    <div class="flex flex-wrap gap-2">
                      @for (tag of item()!.tags; track tag) {
                        <span class="badge badge-outline">{{ tag }}</span>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Metadata -->
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-sm">Details</h2>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Created</span>
                      <span>{{ item()!.createdAt | date:'medium' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Updated</span>
                      <span>{{ item()!.updatedAt | date:'medium' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex justify-center items-center h-64">
          <div class="alert alert-error max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Item not found</span>
          </div>
        </div>
      }

      <!-- Adjust Quantity Modal -->
      <dialog id="adjust_modal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Adjust Quantity</h3>
          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text">Adjustment Amount</span>
            </label>
            <input
              type="number"
              class="input input-bordered"
              [(ngModel)]="customAdjustment"
              placeholder="Enter positive or negative number"
            />
            <label class="label">
              <span class="label-text-alt">Current: {{ item()?.quantity }} → New: {{ (item()?.quantity || 0) + customAdjustment }}</span>
            </label>
          </div>
          <div class="modal-action">
            <form method="dialog">
              <button class="btn btn-ghost">Cancel</button>
            </form>
            <button class="btn btn-primary" (click)="applyCustomAdjustment()">Apply</button>
          </div>
        </div>
      </dialog>

      <!-- Transfer Modal -->
      <dialog id="transfer_modal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Transfer Item</h3>
          <p class="py-4">Feature coming soon...</p>
          <div class="modal-action">
            <form method="dialog">
              <button class="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  `,
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(InventoryItemService);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  loading = signal(true);
  item = signal<InventoryItem | null>(null);
  currentLocation = signal<StorageLocation | null>(null);
  locationPath = signal<StorageLocation[]>([]);

  customAdjustment = 0;

  locationPathString = computed(() =>
    this.locationPath().map((l) => l.name).join(' > ')
  );

  canEdit = () => this.authService.hasPermission('canAdjustQuantity');
  canAdjustQuantity = () => this.authService.hasPermission('canAdjustQuantity');

  ngOnInit(): void {
    const itemId = Number(this.route.snapshot.params['id']);
    if (itemId) {
      this.loadItem(itemId);
    }
  }

  private loadItem(id: number): void {
    this.loading.set(true);

    this.itemService.getById(id).subscribe({
      next: (item) => {
        this.item.set(item);
        if (item.currentLocationId) {
          this.loadLocation(item.currentLocationId);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading item:', err);
        this.loading.set(false);
      },
    });
  }

  private loadLocation(locationId: number): void {
    this.locationService.getById(locationId).subscribe({
      next: (location) => {
        this.currentLocation.set(location);
        this.locationService.getLocationPath(location).subscribe({
          next: (path) => {
            this.locationPath.set(path);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  adjustQuantity(adjustment: number): void {
    const currentItem = this.item();
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + adjustment;
    if (newQuantity < 0) return;

    this.itemService.update(currentItem.id, { quantity: newQuantity }).subscribe({
      next: (updated) => this.item.set(updated),
    });
  }

  openAdjustModal(): void {
    this.customAdjustment = 0;
    const modal = document.getElementById('adjust_modal') as HTMLDialogElement;
    modal?.showModal();
  }

  applyCustomAdjustment(): void {
    const currentItem = this.item();
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + this.customAdjustment;
    if (newQuantity < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    this.itemService.update(currentItem.id, { quantity: newQuantity }).subscribe({
      next: (updated) => {
        this.item.set(updated);
        const modal = document.getElementById('adjust_modal') as HTMLDialogElement;
        modal?.close();
      },
    });
  }

  openEditModal(): void {
    // TODO: Implement edit modal
  }

  openTransferModal(): void {
    const modal = document.getElementById('transfer_modal') as HTMLDialogElement;
    modal?.showModal();
  }

  goBack(): void {
    const locationId = this.item()?.currentLocationId;
    if (locationId) {
      this.router.navigate(['/locations', locationId]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
