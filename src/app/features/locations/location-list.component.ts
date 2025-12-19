import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocationService, AuthService } from '../../core/services';
import { StorageLocation } from '../../core/models';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/dashboard" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">All Locations</h1>
        </div>
        <div class="flex-none">
          @if (canCreate()) {
            <a routerLink="/locations/new" class="btn btn-primary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Location
            </a>
          }
        </div>
      </div>

      <div class="container mx-auto p-4">
        <!-- Search -->
        <div class="form-control mb-4">
          <input
            type="text"
            placeholder="Search locations..."
            class="input input-bordered w-full"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterLocations()"
          />
        </div>

        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (filteredLocations().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 class="text-xl font-semibold mt-4">No locations found</h3>
              <p class="text-base-content/70">
                @if (searchQuery) {
                  Try adjusting your search
                } @else {
                  Get started by creating your first location
                }
              </p>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (location of filteredLocations(); track location.id) {
              <a
                [routerLink]="['/locations', location.id]"
                class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
              >
                <figure class="h-32 bg-base-200">
                  @if (location.imageGallery.length > 0) {
                    <img [src]="location.imageGallery[0]" [alt]="location.name" class="w-full h-full object-cover" />
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  }
                </figure>
                <div class="card-body p-4">
                  <h2 class="card-title text-lg">{{ location.name }}</h2>
                  @if (location.description) {
                    <p class="text-sm text-base-content/60 line-clamp-2">{{ location.description }}</p>
                  }
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LocationListComponent implements OnInit {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  loading = signal(true);
  locations = signal<StorageLocation[]>([]);
  filteredLocations = signal<StorageLocation[]>([]);
  searchQuery = '';

  canCreate = () => this.authService.hasPermission('canCreateLocation');

  ngOnInit(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.loading.set(true);
    this.locationService.getAll().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.filteredLocations.set(locations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterLocations(): void {
    if (!this.searchQuery) {
      this.filteredLocations.set(this.locations());
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredLocations.set(
      this.locations().filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query)
      )
    );
  }
}
