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
                </div>

                <!-- Right column: PDF settings -->
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

  // Form fields
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

  async generateCodes(): Promise<void> {
    this.generating.set(true);

    try {
      const codes = await this.qrService.generateQRCodes(this.codeCount, {
        baseUrl: this.baseUrl,
        prefix: this.prefix || 'TAG',
        type: this.codeType,
      });

      this.generatedCodes.set(codes);
      this.step.set(2);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      this.generating.set(false);
    }
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
      ['ID', 'Type', 'URL', 'Created'],
      ...codes.map((code) => [
        code.name,
        this.codeType,
        code.url,
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
