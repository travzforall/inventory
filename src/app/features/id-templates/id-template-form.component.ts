import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IdTemplateService } from '../../core/services/id-template.service';
import { IdTemplate, IdSegment, IdOption } from '../../core/models/id-template.model';

interface EditableSegment extends IdSegment {
  tempId: string; // Temporary ID for tracking in UI
}

@Component({
  selector: 'app-id-template-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <h1 class="text-xl font-bold ml-2">{{ isEditMode() ? 'Edit Template' : 'New Template' }}</h1>
        </div>
        <div class="flex-none gap-2">
          <button class="btn btn-primary btn-sm" [disabled]="!canSave()" (click)="save()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save
          </button>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-3xl">
        @if (loading()) {
          <div class="flex justify-center items-center h-64">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else {
          <!-- Preview Card -->
          <div class="card bg-primary text-primary-content mb-6">
            <div class="card-body py-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm opacity-80">Generated ID Preview</p>
                  <code class="text-2xl font-mono font-bold">{{ previewId() || '...' }}</code>
                </div>
                <div class="text-right">
                  <p class="text-sm opacity-80">Example Name</p>
                  <p class="font-semibold">{{ previewName() || '...' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Info -->
          <div class="card bg-base-100 shadow-xl mb-6">
            <div class="card-body">
              <h2 class="card-title">Basic Information</h2>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Template Name</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered"
                  placeholder="e.g., Screws, Audio Cables, Books"
                  [(ngModel)]="name"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Category</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered"
                  placeholder="e.g., Hardware, Cables, Media"
                  [(ngModel)]="category"
                />
              </div>
            </div>
          </div>

          <!-- Segments -->
          <div class="card bg-base-100 shadow-xl mb-6">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title">ID Segments</h2>
                <button class="btn btn-sm btn-outline" (click)="addSegment()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Segment
                </button>
              </div>

              @if (segments().length === 0) {
                <div class="text-center py-8 text-base-content/60">
                  <p>No segments yet. Add segments to define your ID pattern.</p>
                </div>
              } @else {
                <div class="space-y-4">
                  @for (segment of segments(); track segment.tempId; let i = $index) {
                    <div class="card bg-base-200">
                      <div class="card-body p-4">
                        <div class="flex justify-between items-start">
                          <div class="flex items-center gap-2">
                            <span class="badge badge-primary">{{ i + 1 }}</span>
                            <h3 class="font-semibold">{{ segment.name || 'New Segment' }}</h3>
                          </div>
                          <div class="flex gap-1">
                            @if (i > 0) {
                              <button class="btn btn-ghost btn-xs" (click)="moveSegment(i, -1)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            }
                            @if (i < segments().length - 1) {
                              <button class="btn btn-ghost btn-xs" (click)="moveSegment(i, 1)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            }
                            <button class="btn btn-ghost btn-xs text-error" (click)="removeSegment(i)">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Segment Name</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              placeholder="e.g., Material, Type, Length"
                              [(ngModel)]="segment.name"
                              (ngModelChange)="updatePreview()"
                            />
                          </div>

                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Type</span>
                            </label>
                            <select
                              class="select select-bordered select-sm"
                              [(ngModel)]="segment.type"
                              (ngModelChange)="onTypeChange(segment)"
                            >
                              <option value="select">Select (dropdown)</option>
                              <option value="number">Number</option>
                              <option value="text">Text</option>
                            </select>
                          </div>

                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Prefix (optional)</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              placeholder="e.g., -, _"
                              [(ngModel)]="segment.prefix"
                              (ngModelChange)="updatePreview()"
                            />
                          </div>

                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Suffix (optional)</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              placeholder="e.g., mm, ft"
                              [(ngModel)]="segment.suffix"
                              (ngModelChange)="updatePreview()"
                            />
                          </div>
                        </div>

                        @if (segment.type === 'select') {
                          <div class="mt-4">
                            <div class="flex justify-between items-center mb-2">
                              <label class="label-text font-semibold">Options</label>
                              <button class="btn btn-ghost btn-xs" (click)="addOption(segment)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Option
                              </button>
                            </div>

                            @if (!segment.options || segment.options.length === 0) {
                              <p class="text-sm text-base-content/60">No options yet. Add options for the dropdown.</p>
                            } @else {
                              <div class="overflow-x-auto">
                                <table class="table table-xs">
                                  <thead>
                                    <tr>
                                      <th>Code</th>
                                      <th>Label</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (option of segment.options; track $index; let j = $index) {
                                      <tr>
                                        <td>
                                          <input
                                            type="text"
                                            class="input input-bordered input-xs w-16"
                                            placeholder="W"
                                            [(ngModel)]="option.code"
                                            (ngModelChange)="updatePreview()"
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            class="input input-bordered input-xs w-32"
                                            placeholder="Wood"
                                            [(ngModel)]="option.label"
                                          />
                                        </td>
                                        <td>
                                          <button class="btn btn-ghost btn-xs text-error" (click)="removeOption(segment, j)">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </td>
                                      </tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class IdTemplateFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templateService = inject(IdTemplateService);

  loading = signal(false);
  isEditMode = signal(false);
  templateId = signal<number | null>(null);

  name = '';
  category = '';
  segments = signal<EditableSegment[]>([]);

  previewId = computed(() => {
    if (!this.name || this.segments().length === 0) return '';
    return this.templateService.generateExampleId({
      id: 0,
      name: this.name,
      category: this.category,
      segments: this.segments(),
      createdAt: '',
      updatedAt: '',
    });
  });

  previewName = computed(() => {
    if (!this.name) return '';
    const parts = [this.name];
    for (const segment of this.segments()) {
      if (segment.type === 'select' && segment.options && segment.options.length > 0) {
        parts.push(segment.options[0].label);
      } else if (segment.type === 'number') {
        parts.push('##');
      }
    }
    return parts.join(' ');
  });

  canSave = computed(() => {
    return (
      this.name.trim().length > 0 &&
      this.category.trim().length > 0 &&
      this.segments().length > 0 &&
      this.segments().every((s) => {
        if (!s.name.trim()) return false;
        if (s.type === 'select') {
          return s.options && s.options.length > 0 && s.options.every((o) => o.code && o.label);
        }
        return true;
      })
    );
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.templateId.set(Number(id));
      this.isEditMode.set(true);
      this.loadTemplate(Number(id));
    }
  }

  private loadTemplate(id: number): void {
    this.loading.set(true);
    this.templateService.getById(id).subscribe({
      next: (template) => {
        if (template) {
          this.name = template.name;
          this.category = template.category;
          this.segments.set(
            template.segments.map((s) => ({
              ...s,
              tempId: crypto.randomUUID(),
            }))
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/id-templates']);
      },
    });
  }

  addSegment(): void {
    this.segments.update((segments) => [
      ...segments,
      {
        tempId: crypto.randomUUID(),
        name: '',
        position: segments.length,
        type: 'select' as const,
        options: [],
      },
    ]);
  }

  removeSegment(index: number): void {
    this.segments.update((segments) => {
      const updated = segments.filter((_, i) => i !== index);
      // Update positions
      return updated.map((s, i) => ({ ...s, position: i }));
    });
  }

  moveSegment(index: number, direction: -1 | 1): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.segments().length) return;

    this.segments.update((segments) => {
      const updated = [...segments];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      // Update positions
      return updated.map((s, i) => ({ ...s, position: i }));
    });
  }

  onTypeChange(segment: EditableSegment): void {
    if (segment.type === 'select' && !segment.options) {
      segment.options = [];
    }
    this.updatePreview();
  }

  addOption(segment: EditableSegment): void {
    if (!segment.options) {
      segment.options = [];
    }
    segment.options.push({ code: '', label: '' });
    this.segments.update((s) => [...s]); // Trigger change detection
  }

  removeOption(segment: EditableSegment, index: number): void {
    if (segment.options) {
      segment.options.splice(index, 1);
      this.segments.update((s) => [...s]); // Trigger change detection
    }
  }

  updatePreview(): void {
    // Force recompute of computed signals
    this.segments.update((s) => [...s]);
  }

  save(): void {
    const segments: IdSegment[] = this.segments().map((s) => ({
      name: s.name,
      position: s.position,
      type: s.type,
      options: s.options,
      prefix: s.prefix,
      suffix: s.suffix,
    }));

    const data = {
      name: this.name.trim(),
      category: this.category.trim(),
      segments,
    };

    if (this.isEditMode() && this.templateId()) {
      this.templateService.update(this.templateId()!, data).subscribe({
        next: () => this.router.navigate(['/id-templates']),
      });
    } else {
      this.templateService.create(data).subscribe({
        next: () => this.router.navigate(['/id-templates']),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/id-templates']);
  }
}
