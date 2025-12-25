import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SoftwareService } from '../../core/services';
import { Software } from '../../core/models';

@Component({
  selector: 'app-software-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/it-assets/software" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Software Details</h1>
        </div>
        <div class="flex-none gap-2">
          @if (software()) {
            <a [routerLink]="['/it-assets/software', software()!.id, 'edit']" class="btn btn-ghost btn-sm">
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
        } @else if (software()) {
          <!-- Status Badges -->
          <div class="flex flex-wrap gap-2 mb-4">
            @if (software()!.done) {
              <span class="badge badge-success badge-lg">Completed</span>
            } @else if (software()!.setup) {
              <span class="badge badge-info badge-lg">Setup Complete</span>
            } @else {
              <span class="badge badge-warning badge-lg">Pending Setup</span>
            }
            @if (software()!.https) {
              <span class="badge badge-info badge-lg">HTTPS Enabled</span>
            }
            <span class="badge badge-outline badge-lg">{{ software()!.class }}</span>
          </div>

          <!-- Main Info Card -->
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <h2 class="card-title text-2xl">{{ software()!.instance }}</h2>
              <p class="text-base-content/60">{{ software()!.description }}</p>

              <div class="divider"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label class="text-sm text-base-content/60">IP Address</label>
                  <p class="font-mono text-lg">{{ software()!.ipAddress || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">Port</label>
                  <p class="font-mono text-lg">{{ software()!.port || '-' }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">Install Date</label>
                  <p class="text-lg">{{ software()!.installDate || '-' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Access Links Card -->
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <h3 class="card-title">Access Links</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @if (software()!.local) {
                  <div>
                    <label class="text-sm text-base-content/60">Local URL</label>
                    <div class="flex items-center gap-2 mt-1">
                      <a [href]="software()!.local" target="_blank" class="btn btn-primary btn-sm">
                        Open Local
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span class="font-mono text-sm text-base-content/60 truncate">{{ software()!.local }}</span>
                    </div>
                  </div>
                }
                @if (software()!.global) {
                  <div>
                    <label class="text-sm text-base-content/60">Global URL</label>
                    <div class="flex items-center gap-2 mt-1">
                      <a [href]="software()!.global" target="_blank" class="btn btn-secondary btn-sm">
                        Open Global
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span class="font-mono text-sm text-base-content/60 truncate">{{ software()!.global }}</span>
                    </div>
                  </div>
                }
                @if (software()!.link) {
                  <div>
                    <label class="text-sm text-base-content/60">Documentation</label>
                    <div class="flex items-center gap-2 mt-1">
                      <a [href]="software()!.link" target="_blank" class="btn btn-ghost btn-sm">
                        View Docs
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                }
                @if (software()!.dockerComposeLink) {
                  <div>
                    <label class="text-sm text-base-content/60">Docker Compose</label>
                    <div class="flex items-center gap-2 mt-1">
                      <a [href]="software()!.dockerComposeLink" target="_blank" class="btn btn-ghost btn-sm">
                        View Compose
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Credentials Card -->
          @if (software()!.username || software()!.email) {
            <div class="card bg-base-100 shadow-xl mb-4">
              <div class="card-body">
                <h3 class="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Credentials
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  @if (software()!.email) {
                    <div>
                      <label class="text-sm text-base-content/60">Email</label>
                      <p class="font-mono">{{ software()!.email }}</p>
                    </div>
                  }
                  @if (software()!.username) {
                    <div>
                      <label class="text-sm text-base-content/60">Username</label>
                      <p class="font-mono">{{ software()!.username }}</p>
                    </div>
                  }
                  @if (software()!.password) {
                    <div>
                      <label class="text-sm text-base-content/60">Password</label>
                      <div class="flex items-center gap-2">
                        <p class="font-mono">{{ showPassword() ? software()!.password : '••••••••' }}</p>
                        <button class="btn btn-ghost btn-xs" (click)="showPassword.set(!showPassword())">
                          @if (showPassword()) {
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          }
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Additional Info Card -->
          @if (software()!.otherUsefulComponents) {
            <div class="card bg-base-100 shadow-xl mb-4">
              <div class="card-body">
                <h3 class="card-title">Other Components</h3>
                <p>{{ software()!.otherUsefulComponents }}</p>
              </div>
            </div>
          }

          <!-- Timestamps -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="grid grid-cols-2 gap-4 text-sm text-base-content/60">
                <div>
                  <label>Created</label>
                  <p>{{ software()!.createdAt | date:'medium' }}</p>
                </div>
                <div>
                  <label>Last Updated</label>
                  <p>{{ software()!.updatedAt | date:'medium' }}</p>
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
        <p class="py-4">Are you sure you want to delete this software entry? This action cannot be undone.</p>
        <div class="modal-action">
          <button class="btn" (click)="deleteModal.close()">Cancel</button>
          <button class="btn btn-error" (click)="deleteSoftware(); deleteModal.close()">Delete</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  `,
})
export class SoftwareDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private softwareService = inject(SoftwareService);

  loading = signal(true);
  software = signal<Software | null>(null);
  showPassword = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (id) {
      this.loadSoftware(id);
    }
  }

  private loadSoftware(id: number): void {
    this.softwareService.getById(id).subscribe({
      next: (software) => {
        this.software.set(software);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/it-assets/software']);
      },
    });
  }

  confirmDelete(): void {
    const modal = document.querySelector('dialog') as HTMLDialogElement;
    modal?.showModal();
  }

  deleteSoftware(): void {
    const software = this.software();
    if (!software) return;

    this.softwareService.delete(software.id).subscribe({
      next: () => this.router.navigate(['/it-assets/software']),
    });
  }
}
