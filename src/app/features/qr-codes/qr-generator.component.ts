import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRCodeService, QRCodeItem, PDFConfig } from '../../core/services/qr-code.service';

@Component({
  selector: 'app-qr-generator',
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
          <h1 class="text-xl font-bold ml-2">QR Code Generator</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-4xl">
        <!-- Step 1: Configuration -->
        @if (step() === 1) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <span class="badge badge-primary">Step 1</span>
                Configure QR Codes
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <!-- Left column: Generation settings -->
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Number of QR Codes *</span>
                    </label>
                    <input
                      type="number"
                      class="input input-bordered w-full"
                      [(ngModel)]="codeCount"
                      min="1"
                      max="100"
                      placeholder="How many codes to generate?"
                    />
                    <label class="label">
                      <span class="label-text-alt">Maximum 100 per batch</span>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Code Type</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="codeType">
                      <option value="location">Location Tags</option>
                      <option value="item">Item Tags</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Prefix</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full"
                      [(ngModel)]="prefix"
                      placeholder="e.g., LOC, ITEM, WH"
                      maxlength="10"
                    />
                    <label class="label">
                      <span class="label-text-alt">Will be used in the ID: {{ prefix || 'TAG' }}-XXXXX</span>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Base URL</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full"
                      [(ngModel)]="baseUrl"
                      placeholder="https://your-app.netlify.app"
                    />
                  </div>

                  <!-- Category -->
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Category</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="category">
                      <option value="">No category</option>
                      @if (codeType === 'location') {
                        <option value="warehouse">Warehouse</option>
                        <option value="shelf">Shelf</option>
                        <option value="bin">Bin</option>
                        <option value="room">Room</option>
                        <option value="zone">Zone</option>
                        <option value="rack">Rack</option>
                      } @else {
                        <option value="electronics">Electronics</option>
                        <option value="tools">Tools</option>
                        <option value="consumables">Consumables</option>
                        <option value="parts">Parts</option>
                        <option value="equipment">Equipment</option>
                        <option value="materials">Materials</option>
                      }
                    </select>
                  </div>

                  <!-- Parent Location (for location type) -->
                  @if (codeType === 'location') {
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Parent Location ID</span>
                      </label>
                      <input
                        type="text"
                        class="input input-bordered w-full"
                        [(ngModel)]="parentLocation"
                        placeholder="e.g., LOC-ABC123"
                      />
                      <label class="label">
                        <span class="label-text-alt">Pre-fills parent when creating location</span>
                      </label>
                    </div>
                  }
                </div>

                <!-- Right column: PDF settings + Additional Data -->
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Label Size</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="labelSize">
                      <option value="small">Small (25mm / 1 inch)</option>
                      <option value="medium">Medium (50mm / 2 inch)</option>
                      <option value="large">Large (75mm / 3 inch)</option>
                      <option value="custom">Custom Size</option>
                    </select>
                  </div>

                  @if (labelSize === 'custom') {
                    <div class="grid grid-cols-2 gap-4">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Width (mm)</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered w-full"
                          [(ngModel)]="customWidth"
                          min="20"
                          max="100"
                        />
                      </div>
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Height (mm)</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered w-full"
                          [(ngModel)]="customHeight"
                          min="20"
                          max="100"
                        />
                      </div>
                    </div>
                  }

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Columns per Row</span>
                    </label>
                    <input
                      type="number"
                      class="input input-bordered w-full"
                      [(ngModel)]="columns"
                      min="1"
                      max="8"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer">
                      <span class="label-text">Show ID Label</span>
                      <input type="checkbox" class="toggle toggle-primary" [(ngModel)]="showLabel" />
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer">
                      <span class="label-text">Show URL (truncated)</span>
                      <input type="checkbox" class="toggle toggle-primary" [(ngModel)]="showUrl" />
                    </label>
                  </div>
                </div>
              </div>

              <!-- Additional Data Section -->
              <div class="divider">
                <span class="text-sm text-base-content/60">Additional Data (embedded in QR)</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Description -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered w-full"
                    [(ngModel)]="description"
                    placeholder="Brief description (max 100 chars)"
                    maxlength="100"
                    rows="2"
                  ></textarea>
                  <label class="label">
                    <span class="label-text-alt">{{ description.length }}/100 chars</span>
                  </label>
                </div>

                <!-- Default Quantity (for items) -->
                @if (codeType === 'item') {
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Default Quantity</span>
                    </label>
                    <input
                      type="number"
                      class="input input-bordered w-full"
                      [(ngModel)]="defaultQuantity"
                      min="0"
                      placeholder="Pre-fill quantity on scan"
                    />
                  </div>
                }

                <!-- Unit -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Unit of Measure</span>
                  </label>
                  <select class="select select-bordered w-full" [(ngModel)]="unit">
                    <option value="">No unit</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (L)</option>
                    <option value="ml">Milliliters (mL)</option>
                    <option value="m">Meters (m)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="box">Boxes</option>
                    <option value="pack">Packs</option>
                    <option value="roll">Rolls</option>
                  </select>
                </div>

                <!-- Tags -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Tags</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    [(ngModel)]="tagsInput"
                    placeholder="comma-separated: fragile, heavy, flammable"
                  />
                  <label class="label">
                    <span class="label-text-alt">Comma-separated list</span>
                  </label>
                </div>

                <!-- Notes -->
                <div class="form-control md:col-span-2">
                  <label class="label">
                    <span class="label-text font-semibold">Notes</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    [(ngModel)]="notes"
                    placeholder="Short note (max 50 chars)"
                    maxlength="50"
                  />
                  <label class="label">
                    <span class="label-text-alt">{{ notes.length }}/50 chars</span>
                  </label>
                </div>
              </div>

              <!-- URL Preview -->
              <div class="mt-4 p-3 bg-base-200 rounded-lg">
                <div class="text-sm font-semibold mb-1">URL Preview:</div>
                <div class="text-xs font-mono break-all text-base-content/70">
                  {{ getUrlPreview() }}
                </div>
                <div class="text-xs mt-2 text-base-content/50">
                  Estimated URL length: {{ getUrlPreview().length }} chars (recommended &lt; 500)
                </div>
              </div>

              <div class="divider"></div>

              <div class="flex justify-end">
                <button
                  class="btn btn-primary"
                  [disabled]="!codeCount || codeCount < 1 || codeCount > 100 || generating()"
                  (click)="generateCodes()"
                >
                  @if (generating()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  Generate {{ codeCount || 0 }} QR Codes
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Preview and Export -->
        @if (step() === 2) {
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <div class="flex justify-between items-center">
                <h2 class="card-title">
                  <span class="badge badge-success">Step 2</span>
                  Preview & Export
                </h2>
                <button class="btn btn-ghost btn-sm" (click)="step.set(1)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Settings
                </button>
              </div>

              <div class="stats shadow mt-4">
                <div class="stat">
                  <div class="stat-title">Generated</div>
                  <div class="stat-value text-primary">{{ generatedCodes().length }}</div>
                  <div class="stat-desc">QR Codes</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Type</div>
                  <div class="stat-value text-secondary capitalize">{{ codeType }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Size</div>
                  <div class="stat-value">{{ getLabelSizeDisplay() }}</div>
                </div>
              </div>

              <div class="flex gap-2 mt-4">
                <button class="btn btn-primary flex-1" (click)="downloadPDF()" [disabled]="exporting()">
                  @if (exporting()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  }
                  Download PDF
                </button>
                <button class="btn btn-secondary flex-1" (click)="printPDF()" [disabled]="exporting()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>

          <!-- QR Code Preview Grid -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="font-semibold mb-4">Preview ({{ generatedCodes().length }} codes)</h3>
              <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                @for (code of generatedCodes(); track code.id) {
                  <div class="flex flex-col items-center p-2 border rounded-lg bg-white">
                    <img [src]="code.dataUrl" [alt]="code.name" class="w-full aspect-square" />
                    <span class="text-xs mt-1 text-center truncate w-full">{{ code.name }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Export as CSV for tracking -->
          <div class="card bg-base-100 shadow-xl mt-4">
            <div class="card-body">
              <h3 class="font-semibold">Export Code List</h3>
              <p class="text-sm text-base-content/70">
                Download a CSV file with all generated codes for your records.
              </p>
              <button class="btn btn-outline btn-sm w-fit mt-2" (click)="downloadCSV()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class QRGeneratorComponent {
  private router = inject(Router);
  private qrService = inject(QRCodeService);

  step = signal(1);
  generating = signal(false);
  exporting = signal(false);
  generatedCodes = signal<QRCodeItem[]>([]);

  // Form fields - Basic
  codeCount = 10;
  codeType: 'location' | 'item' = 'location';
  prefix = 'LOC';
  baseUrl = window.location.origin;
  labelSize: 'small' | 'medium' | 'large' | 'custom' = 'medium';
  customWidth = 50;
  customHeight = 50;
  columns = 4;
  showLabel = true;
  showUrl = false;

  // Form fields - Additional data
  category = '';
  parentLocation = '';
  description = '';
  defaultQuantity: number | undefined;
  unit = '';
  tagsInput = '';
  notes = '';

  async generateCodes(): Promise<void> {
    this.generating.set(true);

    try {
      const tags = this.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const codes = await this.qrService.generateQRCodes(this.codeCount, {
        baseUrl: this.baseUrl,
        prefix: this.prefix || 'TAG',
        type: this.codeType,
        category: this.category || undefined,
        description: this.description || undefined,
        parentLocation: this.parentLocation || undefined,
        defaultQuantity: this.defaultQuantity,
        unit: this.unit || undefined,
        tags: tags.length > 0 ? tags : undefined,
        notes: this.notes || undefined,
      });

      this.generatedCodes.set(codes);
      this.step.set(2);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      this.generating.set(false);
    }
  }

  getUrlPreview(): string {
    const params = new URLSearchParams();
    params.set('type', this.codeType);
    params.set('name', `${this.prefix || 'TAG'}-XXXXX`);

    if (this.category) params.set('cat', this.category);
    if (this.description) params.set('desc', this.description.substring(0, 100));
    if (this.parentLocation) params.set('parent', this.parentLocation);
    if (this.defaultQuantity) params.set('qty', this.defaultQuantity.toString());
    if (this.unit) params.set('unit', this.unit);
    if (this.tagsInput) {
      const tags = this.tagsInput.split(',').map((t) => t.trim()).filter((t) => t).join(',');
      if (tags) params.set('tags', tags);
    }
    if (this.notes) params.set('notes', this.notes.substring(0, 50));

    return `${this.baseUrl}/nfc?${params.toString()}`;
  }

  async downloadPDF(): Promise<void> {
    this.exporting.set(true);

    try {
      const config: PDFConfig = {
        labelSize: this.labelSize,
        customWidth: this.customWidth,
        customHeight: this.customHeight,
        columns: this.columns,
        showLabel: this.showLabel,
        showUrl: this.showUrl,
      };

      const blob = await this.qrService.generatePDF(this.generatedCodes(), config);
      const filename = `qr-codes-${this.codeType}-${new Date().toISOString().slice(0, 10)}.pdf`;
      this.qrService.downloadPDF(blob, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      this.exporting.set(false);
    }
  }

  async printPDF(): Promise<void> {
    this.exporting.set(true);

    try {
      const config: PDFConfig = {
        labelSize: this.labelSize,
        customWidth: this.customWidth,
        customHeight: this.customHeight,
        columns: this.columns,
        showLabel: this.showLabel,
        showUrl: this.showUrl,
      };

      const blob = await this.qrService.generatePDF(this.generatedCodes(), config);
      this.qrService.printPDF(blob);
    } catch (error) {
      console.error('Error printing PDF:', error);
    } finally {
      this.exporting.set(false);
    }
  }

  downloadCSV(): void {
    const codes = this.generatedCodes();
    const csv = [
      ['ID', 'Type', 'Category', 'Description', 'Unit', 'Tags', 'Notes', 'URL', 'Created'],
      ...codes.map((code) => [
        code.name,
        this.codeType,
        this.category || '',
        `"${(this.description || '').replace(/"/g, '""')}"`,
        this.unit || '',
        `"${this.tagsInput || ''}"`,
        `"${(this.notes || '').replace(/"/g, '""')}"`,
        `"${code.url}"`,
        new Date().toISOString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-codes-${this.codeType}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getLabelSizeDisplay(): string {
    switch (this.labelSize) {
      case 'small':
        return '25mm';
      case 'medium':
        return '50mm';
      case 'large':
        return '75mm';
      case 'custom':
        return `${this.customWidth}×${this.customHeight}mm`;
      default:
        return '';
    }
  }

  goBack(): void {
    if (this.step() === 2) {
      this.step.set(1);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
