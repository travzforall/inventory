import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SoftwareService } from '../../core/services';
import { Software } from '../../core/models';

@Component({
  selector: 'app-software-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/it-assets" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Software</h1>
        </div>
        <div class="flex-none">
          <a routerLink="/it-assets/software/add" class="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Software
          </a>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-6xl">
        <!-- Search and Filters -->
        <div class="card bg-base-100 shadow mb-4">
          <div class="card-body py-3">
            <div class="flex flex-wrap gap-4 items-center">
              <div class="form-control flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search software..."
                  class="input input-bordered input-sm w-full"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="filterSoftware()"
                />
              </div>
              <div class="flex gap-2">
                <select class="select select-bordered select-sm" [(ngModel)]="filterClass" (ngModelChange)="filterSoftware()">
                  <option value="">All Classes</option>
                  @for (cls of classes(); track cls) {
                    <option [value]="cls">{{ cls }}</option>
                  }
                </select>
                <select class="select select-bordered select-sm" [(ngModel)]="filterStatus" (ngModelChange)="filterSoftware()">
                  <option value="">All Status</option>
                  <option value="done">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="setup">Setup Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (filteredSoftware().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <h2 class="text-xl font-bold mt-4">No software found</h2>
              <p class="text-base-content/60">
                @if (searchQuery || filterClass || filterStatus) {
                  Try adjusting your filters
                } @else {
                  Add your first software entry to get started
                }
              </p>
            </div>
          </div>
        } @else {
          <div class="card bg-base-100 shadow-xl">
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Instance</th>
                    <th>Class</th>
                    <th>Description</th>
                    <th>IP:Port</th>
                    <th>Links</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sw of filteredSoftware(); track sw.id) {
                    <tr class="hover">
                      <td>
                        <div class="font-bold">{{ sw.instance }}</div>
                      </td>
                      <td>
                        <span class="badge badge-outline">{{ sw.class }}</span>
                      </td>
                      <td class="text-sm text-base-content/70 max-w-xs truncate">{{ sw.description }}</td>
                      <td class="font-mono text-sm">
                        @if (sw.ipAddress && sw.port) {
                          {{ sw.ipAddress }}:{{ sw.port }}
                        } @else if (sw.ipAddress) {
                          {{ sw.ipAddress }}
                        } @else {
                          -
                        }
                      </td>
                      <td>
                        <div class="flex gap-1">
                          @if (sw.local) {
                            <a [href]="sw.local" target="_blank" class="btn btn-ghost btn-xs" title="Local">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </a>
                          }
                          @if (sw.global) {
                            <a [href]="sw.global" target="_blank" class="btn btn-ghost btn-xs" title="Global">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            </a>
                          }
                          @if (sw.dockerComposeLink) {
                            <a [href]="sw.dockerComposeLink" target="_blank" class="btn btn-ghost btn-xs" title="Docker Compose">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </a>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          @if (sw.done) {
                            <span class="badge badge-success badge-sm">Done</span>
                          } @else if (sw.setup) {
                            <span class="badge badge-info badge-sm">Setup</span>
                          } @else {
                            <span class="badge badge-warning badge-sm">Pending</span>
                          }
                          @if (sw.https) {
                            <span class="badge badge-info badge-sm">HTTPS</span>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <a [routerLink]="['/it-assets/software', sw.id]" class="btn btn-ghost btn-xs">
                            View
                          </a>
                          <a [routerLink]="['/it-assets/software', sw.id, 'edit']" class="btn btn-ghost btn-xs">
                            Edit
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class SoftwareListComponent implements OnInit {
  private softwareService = inject(SoftwareService);

  loading = signal(true);
  software = signal<Software[]>([]);
  filteredSoftware = signal<Software[]>([]);
  classes = signal<string[]>([]);

  searchQuery = '';
  filterClass = '';
  filterStatus = '';

  ngOnInit(): void {
    this.loadSoftware();
  }

  private loadSoftware(): void {
    this.softwareService.getAll().subscribe({
      next: (software) => {
        this.software.set(software);
        this.filteredSoftware.set(software);
        // Extract unique classes
        const uniqueClasses = [...new Set(software.map((s) => s.class).filter((c) => c))].sort();
        this.classes.set(uniqueClasses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterSoftware(): void {
    let result = this.software();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.instance.toLowerCase().includes(query) ||
          s.class.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.ipAddress.includes(query)
      );
    }

    if (this.filterClass) {
      result = result.filter((s) => s.class === this.filterClass);
    }

    if (this.filterStatus) {
      switch (this.filterStatus) {
        case 'done':
          result = result.filter((s) => s.done);
          break;
        case 'pending':
          result = result.filter((s) => !s.done && !s.setup);
          break;
        case 'setup':
          result = result.filter((s) => s.setup && !s.done);
          break;
      }
    }

    this.filteredSoftware.set(result);
  }
}
