import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IdTemplateService } from '../../core/services/id-template.service';
import { IdTemplate } from '../../core/models/id-template.model';

@Component({
  selector: 'app-id-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          <h1 class="text-xl font-bold ml-2">ID Templates</h1>
        </div>
        <div class="flex-none gap-2">
          <button class="btn btn-primary btn-sm" routerLink="add">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>
      </div>

      <div class="container mx-auto p-4">
        <!-- Info Card -->
        <div class="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="font-semibold">ID Templates for Quick Item Cataloging</p>
            <p class="text-sm">Create patterns to generate consistent IDs. Example: "WEP2.5" for Wood screw, Exterior, Phillips, 2.5 length</p>
          </div>
        </div>

        @if (loading()) {
          <div class="flex justify-center items-center h-64">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (templates().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 class="text-xl font-semibold mt-4">No templates yet</h3>
              <p class="text-base-content/70 mb-4">Create your first ID template to start cataloging items</p>
              <button class="btn btn-primary" routerLink="add">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create First Template
              </button>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (template of templates(); track template.id) {
              <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div class="card-body">
                  <div class="flex justify-between items-start">
                    <div>
                      <h2 class="card-title">{{ template.name }}</h2>
                      <p class="badge badge-outline">{{ template.category }}</p>
                    </div>
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </label>
                      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-10">
                        <li><a [routerLink]="[template.id, 'edit']">Edit</a></li>
                        <li><a class="text-error" (click)="confirmDelete(template)">Delete</a></li>
                      </ul>
                    </div>
                  </div>

                  <!-- Example ID -->
                  <div class="mt-4 p-3 bg-base-200 rounded-lg">
                    <p class="text-xs text-base-content/60 mb-1">Example ID Pattern</p>
                    <code class="text-lg font-mono font-bold text-primary">{{ getExampleId(template) }}</code>
                  </div>

                  <!-- Segments -->
                  <div class="mt-4">
                    <p class="text-xs text-base-content/60 mb-2">Segments ({{ template.segments.length }})</p>
                    <div class="flex flex-wrap gap-2">
                      @for (segment of template.segments; track segment.name) {
                        <span class="badge badge-ghost">
                          {{ segment.name }}
                          @if (segment.type === 'select') {
                            ({{ segment.options?.length }} options)
                          } @else {
                            ({{ segment.type }})
                          }
                        </span>
                      }
                    </div>
                  </div>

                  <div class="card-actions justify-end mt-4">
                    <button class="btn btn-outline btn-sm" [routerLink]="[template.id, 'edit']">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Reset to defaults button -->
          <div class="mt-8 flex justify-center">
            <button class="btn btn-ghost btn-sm" (click)="confirmReset()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Defaults
            </button>
          </div>
        }

        <!-- Delete Confirmation Modal -->
        <dialog #deleteModal class="modal">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Template</h3>
            <p class="py-4">Are you sure you want to delete "{{ templateToDelete()?.name }}"? This action cannot be undone.</p>
            <div class="modal-action">
              <button class="btn" (click)="deleteModal.close()">Cancel</button>
              <button class="btn btn-error" (click)="deleteTemplate(); deleteModal.close()">Delete</button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>

        <!-- Reset Confirmation Modal -->
        <dialog #resetModal class="modal">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Reset to Defaults</h3>
            <p class="py-4">This will delete all your custom templates and restore the default templates. Are you sure?</p>
            <div class="modal-action">
              <button class="btn" (click)="resetModal.close()">Cancel</button>
              <button class="btn btn-warning" (click)="resetToDefaults(); resetModal.close()">Reset</button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </div>
  `,
})
export class IdTemplateListComponent implements OnInit {
  private router = inject(Router);
  private templateService = inject(IdTemplateService);

  loading = signal(true);
  templates = signal<IdTemplate[]>([]);
  templateToDelete = signal<IdTemplate | null>(null);

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.templateService.getAll().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.loading.set(false);
      },
    });
  }

  getExampleId(template: IdTemplate): string {
    return this.templateService.generateExampleId(template);
  }

  confirmDelete(template: IdTemplate): void {
    this.templateToDelete.set(template);
    const modal = document.querySelector('#deleteModal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  deleteTemplate(): void {
    const template = this.templateToDelete();
    if (template) {
      this.templateService.delete(template.id).subscribe({
        next: () => {
          this.loadTemplates();
          this.templateToDelete.set(null);
        },
      });
    }
  }

  confirmReset(): void {
    const modal = document.querySelector('#resetModal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  resetToDefaults(): void {
    this.templateService.resetToDefaults();
    this.loadTemplates();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
