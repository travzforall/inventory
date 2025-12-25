import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServerService } from '../../core/services';
import { Server } from '../../core/models';

@Component({
  selector: 'app-server-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/it-assets/servers" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Server Details</h1>
        </div>
        <div class="flex-none gap-2">
          @if (server()) {
            <a [routerLink]="['/it-assets/servers', server()!.id, 'edit']" class="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </a>
            <button class="btn btn-error btn-sm" (click)="confirmDelete()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          }
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-4xl">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (server()) {
          <!-- Status Badges -->
          <div class="flex flex-wrap gap-2 mb-4">
            @if (server()!.live) {
              <span class="badge badge-success badge-lg">Live</span>
            } @else {
              <span class="badge badge-ghost badge-lg">Offline</span>
            }
            @if (server()!.https) {
              <span class="badge badge-info badge-lg">HTTPS</span>
            }
            @if (server()!.setup) {
              <span class="badge badge-primary badge-lg">Setup</span>
            }
          </div>

          <!-- Main Info Card -->
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <h2 class="card-title text-2xl">{{ server()!.vmName }}</h2>
              <p class="text-base-content/60 font-mono">{{ server()!.hostName || 'No hostname' }}</p>

              <div class="divider"></div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="text-sm text-base-content/60">VM Number</label>
                  <p class="font-mono text-lg">{{ server()!.vmNumber }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">IP Address</label>
                  <p class="font-mono text-lg">{{ server()!.ipAddress || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">Dockge Port</label>
                  <p class="text-lg">{{ server()!.dockge || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">VLAN</label>
                  <p class="text-lg">{{ server()!.vlan }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Specs Card -->
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <h3 class="card-title">Specifications</h3>

              <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="stat bg-base-200 rounded-box p-4">
                  <div class="stat-title text-xs">CPU</div>
                  <div class="stat-value text-lg text-primary">{{ server()!.cpu || '-' }}</div>
                </div>
                <div class="stat bg-base-200 rounded-box p-4">
                  <div class="stat-title text-xs">RAM</div>
                  <div class="stat-value text-lg text-secondary">{{ server()!.ram || '-' }}</div>
                </div>
                <div class="stat bg-base-200 rounded-box p-4">
                  <div class="stat-title text-xs">HDD</div>
                  <div class="stat-value text-lg text-accent">{{ server()!.hdd || '-' }}</div>
                </div>
                <div class="stat bg-base-200 rounded-box p-4">
                  <div class="stat-title text-xs">Bucket</div>
                  <div class="stat-value text-lg">{{ server()!.bucket || '-' }}</div>
                </div>
                <div class="stat bg-base-200 rounded-box p-4">
                  <div class="stat-title text-xs">OS</div>
                  <div class="stat-value text-lg">{{ server()!.serverOs || '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Software Card -->
          @if (hasSoftware()) {
            <div class="card bg-base-100 shadow-xl mb-4">
              <div class="card-body">
                <h3 class="card-title">Installed Software</h3>
                <div class="flex flex-wrap gap-2">
                  @if (server()!.software1) {
                    <a
                      [href]="server()!.software1Link"
                      target="_blank"
                      class="badge badge-primary badge-lg gap-2 cursor-pointer hover:opacity-80"
                    >
                      {{ server()!.software1 }}
                      @if (server()!.software1Ports) {
                        <span class="badge badge-ghost badge-sm">{{ server()!.software1Ports }}</span>
                      }
                    </a>
                  }
                  @if (server()!.software2) {
                    <a
                      [href]="server()!.software2Link"
                      target="_blank"
                      class="badge badge-secondary badge-lg gap-2 cursor-pointer hover:opacity-80"
                    >
                      {{ server()!.software2 }}
                      @if (server()!.software2Ports) {
                        <span class="badge badge-ghost badge-sm">{{ server()!.software2Ports }}</span>
                      }
                    </a>
                  }
                  @if (server()!.software3) {
                    <a
                      [href]="server()!.software3Link"
                      target="_blank"
                      class="badge badge-accent badge-lg gap-2 cursor-pointer hover:opacity-80"
                    >
                      {{ server()!.software3 }}
                      @if (server()!.software3Ports) {
                        <span class="badge badge-ghost badge-sm">{{ server()!.software3Ports }}</span>
                      }
                    </a>
                  }
                  @if (server()!.software4) {
                    <a
                      [href]="server()!.software4Link"
                      target="_blank"
                      class="badge badge-info badge-lg gap-2 cursor-pointer hover:opacity-80"
                    >
                      {{ server()!.software4 }}
                      @if (server()!.software4Ports) {
                        <span class="badge badge-ghost badge-sm">{{ server()!.software4Ports }}</span>
                      }
                    </a>
                  }
                  @if (server()!.software5) {
                    <a
                      [href]="server()!.software5Link"
                      target="_blank"
                      class="badge badge-warning badge-lg gap-2 cursor-pointer hover:opacity-80"
                    >
                      {{ server()!.software5 }}
                      @if (server()!.software5Ports) {
                        <span class="badge badge-ghost badge-sm">{{ server()!.software5Ports }}</span>
                      }
                    </a>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Timestamps -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="grid grid-cols-2 gap-4 text-sm text-base-content/60">
                <div>
                  <label>Created</label>
                  <p>{{ server()!.createdAt | date : 'medium' }}</p>
                </div>
                <div>
                  <label>Last Updated</label>
                  <p>{{ server()!.updatedAt | date : 'medium' }}</p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog #deleteModal class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirm Delete</h3>
        <p class="py-4">Are you sure you want to delete this server? This action cannot be undone.</p>
        <div class="modal-action">
          <button class="btn" (click)="deleteModal.close()">Cancel</button>
          <button class="btn btn-error" (click)="deleteServer(); deleteModal.close()">Delete</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  `,
})
export class ServerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serverService = inject(ServerService);

  loading = signal(true);
  server = signal<Server | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (id) {
      this.loadServer(id);
    }
  }

  private loadServer(id: number): void {
    this.serverService.getById(id).subscribe({
      next: (server) => {
        this.server.set(server);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/it-assets/servers']);
      },
    });
  }

  hasSoftware(): boolean {
    const s = this.server();
    return !!(s && (s.software1 || s.software2 || s.software3 || s.software4 || s.software5));
  }

  confirmDelete(): void {
    const modal = document.querySelector('dialog') as HTMLDialogElement;
    modal?.showModal();
  }

  deleteServer(): void {
    const server = this.server();
    if (!server) return;

    this.serverService.delete(server.id).subscribe({
      next: () => this.router.navigate(['/it-assets/servers']),
    });
  }
}
