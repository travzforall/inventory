import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRCodeService, QRCodeItem, PDFConfig } from '../../core/services/qr-code.service';
import { LocationService } from '../../core/services';
import { StorageLocation } from '../../core/models';

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
        <!-- Mode Selection Tabs -->
        @if (step() === 1) {
          <div class="tabs tabs-boxed mb-4 justify-center">
            <a class="tab" [class.tab-active]="generationMode === 'standard'" (click)="generationMode = 'standard'">
              Standard Mode
            </a>
            <a class="tab" [class.tab-active]="generationMode === 'bulk'" (click)="generationMode = 'bulk'">
              Bulk Unique Data
            </a>
          </div>
        }

        <!-- BULK MODE: Generate multiple with same settings -->
        @if (step() === 1 && generationMode === 'bulk') {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <span class="badge badge-secondary">Bulk Mode</span>
                Generate Multiple QR Codes
              </h2>
              <p class="text-base-content/60 text-sm">Generate multiple codes with the same settings - each gets a unique ID</p>

              <!-- Quick Count Selection -->
              <div class="bg-base-200 rounded-box p-4 mt-4">
                <label class="label">
                  <span class="label-text font-semibold">How many QR codes?</span>
                </label>
                <div class="grid grid-cols-4 md:grid-cols-8 gap-2 mb-3">
                  @for (preset of bulkPresets; track preset.count) {
                    <button
                      class="btn btn-sm"
                      [class.btn-primary]="codeCount === preset.count"
                      [class.btn-outline]="codeCount !== preset.count"
                      (click)="codeCount = preset.count"
                    >
                      {{ preset.count }}
                    </button>
                  }
                </div>
                <input
                  type="number"
                  class="input input-bordered w-full"
                  [(ngModel)]="codeCount"
                  min="1"
                  max="500"
                  placeholder="Or enter custom count"
                />
              </div>

              <div class="divider"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left column: Generation settings -->
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Code Type</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="codeType" (ngModelChange)="onCodeTypeChange($event)">
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
                      <span class="label-text-alt">ID format: {{ prefix || 'TAG' }}-XXXXX</span>
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
                    <label class="label">
                      <span class="label-text-alt">The host URL for QR code links</span>
                    </label>
                  </div>

                  <!-- Location-specific fields -->
                  @if (codeType === 'location') {
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Category</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="category">
                        <option value="">No category</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="shelf">Shelf</option>
                        <option value="bin">Bin</option>
                        <option value="room">Room</option>
                        <option value="zone">Zone</option>
                        <option value="rack">Rack</option>
                      </select>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Parent Location</span>
                      </label>
                      <input
                        type="text"
                        class="input input-bordered w-full"
                        [(ngModel)]="parentLocation"
                        placeholder="e.g., Warehouse A"
                      />
                    </div>

                    <div class="collapse collapse-arrow bg-base-200">
                      <input type="checkbox" />
                      <div class="collapse-title text-sm font-semibold">Capacity Rules</div>
                      <div class="collapse-content space-y-3">
                        <div class="form-control">
                          <label class="label"><span class="label-text">Max Items</span></label>
                          <input type="number" class="input input-bordered w-full input-sm" [(ngModel)]="maxItems" min="0" />
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <div class="form-control">
                            <label class="label"><span class="label-text">Max Weight</span></label>
                            <input type="number" class="input input-bordered w-full input-sm" [(ngModel)]="maxWeight" min="0" />
                          </div>
                          <div class="form-control">
                            <label class="label"><span class="label-text">Unit</span></label>
                            <select class="select select-bordered w-full select-sm" [(ngModel)]="weightUnit">
                              <option value="">-</option>
                              <option value="kg">kg</option>
                              <option value="lb">lb</option>
                            </select>
                          </div>
                        </div>
                        <div class="form-control">
                          <label class="label"><span class="label-text">Allowed Categories</span></label>
                          <input type="text" class="input input-bordered w-full input-sm" [(ngModel)]="allowedCategoriesInput" placeholder="electronics, tools" />
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Item-specific fields -->
                  @if (codeType === 'item') {
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Category</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="category">
                        <option value="">No category</option>
                        <option value="electronics">Electronics</option>
                        <option value="tools">Tools</option>
                        <option value="office">Office Supplies</option>
                        <option value="furniture">Furniture</option>
                        <option value="consumables">Consumables</option>
                        <option value="equipment">Equipment</option>
                        <option value="parts">Parts & Components</option>
                        <option value="packaging">Packaging</option>
                        <option value="safety">Safety & PPE</option>
                        <option value="cleaning">Cleaning Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Default Quantity</span>
                        </label>
                        <input type="number" class="input input-bordered w-full" [(ngModel)]="defaultQuantity" min="0" />
                      </div>
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Min Quantity</span>
                        </label>
                        <input type="number" class="input input-bordered w-full" [(ngModel)]="minQuantity" min="0" />
                      </div>
                    </div>

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
                        <option value="box">Boxes</option>
                        <option value="pack">Packs</option>
                      </select>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Default Location</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="defaultLocationId">
                        <option [ngValue]="undefined">No default location</option>
                        @for (loc of locations(); track loc.id) {
                          <option [ngValue]="loc.id">{{ loc.name }}</option>
                        }
                      </select>
                    </div>

                    <div class="form-control">
                      <label class="label cursor-pointer justify-start gap-4">
                        <input type="checkbox" class="toggle toggle-primary" [(ngModel)]="manageInventory" />
                        <span class="label-text font-semibold">Manage Inventory</span>
                      </label>
                    </div>
                  }
                </div>

                <!-- Right column: PDF settings + Additional Data -->
                <div class="space-y-4">
                  <!-- Label Sheet Mode Toggle -->
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" class="toggle toggle-accent" [(ngModel)]="labelSheetMode" />
                      <div>
                        <span class="label-text font-semibold">Label Sheet Mode</span>
                        <p class="text-xs text-base-content/60">Print multiple QR codes on physical label sheets</p>
                      </div>
                    </label>
                  </div>

                  @if (labelSheetMode) {
                    <!-- Label Sheet Grid Settings -->
                    <div class="bg-accent/10 rounded-box p-3 space-y-3">
                      <label class="label pt-0">
                        <span class="label-text font-semibold">Label Sheet Size (mm)</span>
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Width</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetWidth" min="40" max="300" />
                        </div>
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Height</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetHeight" min="40" max="300" />
                        </div>
                      </div>

                      <label class="label pt-2 pb-0">
                        <span class="label-text font-semibold">Grid Layout</span>
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Columns</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetCols" min="1" max="6" />
                        </div>
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Rows</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetRows" min="1" max="6" />
                        </div>
                      </div>

                      @if (getCodesPerSheet() > 0) {
                        <div class="text-xs text-accent font-medium mt-2">
                          {{ getCodesPerSheet() }} codes per sheet ({{ getQRCodeSize() }}mm each) &bull; {{ getSheetsNeeded() }} sheet(s) needed
                        </div>
                      }
                    </div>
                  } @else {
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
                          <label class="label"><span class="label-text">Width (mm)</span></label>
                          <input type="number" class="input input-bordered w-full" [(ngModel)]="customWidth" min="20" max="100" />
                        </div>
                        <div class="form-control">
                          <label class="label"><span class="label-text">Height (mm)</span></label>
                          <input type="number" class="input input-bordered w-full" [(ngModel)]="customHeight" min="20" max="100" />
                        </div>
                      </div>
                    }

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Columns per Row</span>
                      </label>
                      <input type="number" class="input input-bordered w-full" [(ngModel)]="columns" min="1" max="8" />
                    </div>
                  }

                  <div class="flex gap-4">
                    <label class="label cursor-pointer gap-2">
                      <input type="checkbox" class="checkbox" [(ngModel)]="showLabel" />
                      <span class="label-text">Show ID Label</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input type="checkbox" class="checkbox" [(ngModel)]="showUrl" />
                      <span class="label-text">Show URL</span>
                    </label>
                  </div>

                  <div class="divider text-xs">Additional Data</div>

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
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">Tags</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full"
                      [(ngModel)]="tagsInput"
                      placeholder="fragile, heavy, flammable"
                    />
                  </div>

                  <div class="form-control">
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
                  </div>
                </div>
              </div>

              <div class="divider"></div>

              <!-- Generate Button -->
              <button
                class="btn btn-primary btn-lg w-full"
                [disabled]="!codeCount || codeCount < 1 || generating()"
                (click)="generateCodes()"
              >
                @if (generating()) {
                  <span class="loading loading-spinner"></span>
                  Generating...
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Generate {{ codeCount }} QR Codes
                }
              </button>
            </div>
          </div>
        }

        <!-- STANDARD MODE: Step 1: Configuration -->
        @if (step() === 1 && generationMode === 'standard') {
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
                    <select class="select select-bordered w-full" [(ngModel)]="codeType" (ngModelChange)="onCodeTypeChange($event)">
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

                  <!-- Parent Location (for location type) -->
                  @if (codeType === 'location') {
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Location Category</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="category">
                        <option value="">No category</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="shelf">Shelf</option>
                        <option value="bin">Bin</option>
                        <option value="room">Room</option>
                        <option value="zone">Zone</option>
                        <option value="rack">Rack</option>
                      </select>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Parent Location</span>
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

                    <div class="divider text-xs text-base-content/50">Capacity Rules</div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Max Items</span>
                      </label>
                      <input
                        type="number"
                        class="input input-bordered w-full"
                        [(ngModel)]="maxItems"
                        min="0"
                        placeholder="Maximum items allowed"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Max Weight</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered w-full"
                          [(ngModel)]="maxWeight"
                          min="0"
                          placeholder="Weight limit"
                        />
                      </div>
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text font-semibold">Unit</span>
                        </label>
                        <select class="select select-bordered w-full" [(ngModel)]="weightUnit">
                          <option value="">-</option>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Allowed Categories</span>
                      </label>
                      <input
                        type="text"
                        class="input input-bordered w-full"
                        [(ngModel)]="allowedCategoriesInput"
                        placeholder="electronics, tools, parts"
                      />
                      <label class="label">
                        <span class="label-text-alt">Comma-separated list of allowed item categories</span>
                      </label>
                    </div>
                  }

                  <!-- Item-specific fields -->
                  @if (codeType === 'item') {
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">SKU</span>
                      </label>
                      <input
                        type="text"
                        class="input input-bordered w-full"
                        [(ngModel)]="sku"
                        placeholder="e.g., ITEM-001"
                      />
                      <label class="label">
                        <span class="label-text-alt">Pre-fills SKU when creating item</span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Category</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="category">
                        <option value="">No category</option>
                        <option value="electronics">Electronics</option>
                        <option value="tools">Tools</option>
                        <option value="office">Office Supplies</option>
                        <option value="furniture">Furniture</option>
                        <option value="consumables">Consumables</option>
                        <option value="equipment">Equipment</option>
                        <option value="parts">Parts & Components</option>
                        <option value="packaging">Packaging</option>
                        <option value="safety">Safety & PPE</option>
                        <option value="cleaning">Cleaning Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

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

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Min Quantity (Low Stock)</span>
                      </label>
                      <input
                        type="number"
                        class="input input-bordered w-full"
                        [(ngModel)]="minQuantity"
                        min="0"
                        placeholder="Low stock alert threshold"
                      />
                    </div>

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

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-semibold">Default Location</span>
                      </label>
                      <select class="select select-bordered w-full" [(ngModel)]="defaultLocationId">
                        <option [ngValue]="undefined">No default location</option>
                        @for (loc of locations(); track loc.id) {
                          <option [ngValue]="loc.id">{{ loc.name }}</option>
                        }
                      </select>
                      <label class="label">
                        <span class="label-text-alt">Pre-assign items to this location</span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          class="toggle toggle-primary"
                          [(ngModel)]="manageInventory"
                        />
                        <span class="label-text font-semibold">Manage Inventory</span>
                      </label>
                      <label class="label">
                        <span class="label-text-alt">Track quantity and low-stock alerts</span>
                      </label>
                    </div>
                  }
                </div>

                <!-- Right column: PDF settings + Additional Data -->
                <div class="space-y-4">
                  <!-- Label Sheet Mode Toggle -->
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" class="toggle toggle-accent" [(ngModel)]="labelSheetMode" />
                      <div>
                        <span class="label-text font-semibold">Label Sheet Mode</span>
                        <p class="text-xs text-base-content/60">Print multiple QR codes per label sheet</p>
                      </div>
                    </label>
                  </div>

                  @if (labelSheetMode) {
                    <!-- Label Sheet Grid Settings -->
                    <div class="bg-accent/10 rounded-box p-3 space-y-3">
                      <label class="label pt-0">
                        <span class="label-text font-semibold">Label Sheet Size (mm)</span>
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Width</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetWidth" min="40" max="300" />
                        </div>
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Height</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetHeight" min="40" max="300" />
                        </div>
                      </div>

                      <label class="label pt-2 pb-0">
                        <span class="label-text font-semibold">Grid Layout</span>
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Columns</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetCols" min="1" max="6" />
                        </div>
                        <div class="form-control">
                          <label class="label py-1"><span class="label-text text-xs">Rows</span></label>
                          <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="sheetRows" min="1" max="6" />
                        </div>
                      </div>

                      @if (getCodesPerSheet() > 0) {
                        <div class="text-xs text-accent font-medium mt-2">
                          {{ getCodesPerSheet() }} codes per sheet ({{ getQRCodeSize() }}mm each) &bull; {{ getSheetsNeeded() }} sheet(s) needed
                        </div>
                      }
                    </div>
                  } @else {
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
                  }

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
                @if (labelSheetMode) {
                  <div class="stat">
                    <div class="stat-title">Sheet Size</div>
                    <div class="stat-value text-accent">{{ sheetWidth }}×{{ sheetHeight }}</div>
                    <div class="stat-desc">mm ({{ getCodesPerSheet() }}/sheet)</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Sheets</div>
                    <div class="stat-value">{{ getSheetsNeeded() }}</div>
                    <div class="stat-desc">to print</div>
                  </div>
                } @else {
                  <div class="stat">
                    <div class="stat-title">Size</div>
                    <div class="stat-value">{{ getLabelSizeDisplay() }}</div>
                  </div>
                }
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
export class QRGeneratorComponent implements OnInit {
  private router = inject(Router);
  private qrService = inject(QRCodeService);
  private locationService = inject(LocationService);

  step = signal(1);
  generating = signal(false);
  exporting = signal(false);
  generatedCodes = signal<QRCodeItem[]>([]);
  locations = signal<StorageLocation[]>([]);

  ngOnInit(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => this.locations.set(locations),
    });
  }

  // Generation mode
  generationMode: 'standard' | 'bulk' = 'bulk';

  // Bulk mode fields
  bulkCount = 10;
  bulkType: 'location' | 'item' = 'location';
  bulkPrefix = '';
  bulkPresets = [
    { count: 10, label: 'Small batch' },
    { count: 25, label: 'Medium batch' },
    { count: 50, label: 'Large batch' },
    { count: 100, label: 'Extra large' },
  ];

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

  // Label sheet mode - for printing on physical label sheets
  labelSheetMode = false;
  sheetWidth = 110; // Label sheet width in mm
  sheetHeight = 80; // Label sheet height in mm
  sheetRows = 2;    // Number of rows of QR codes
  sheetCols = 2;    // Number of columns of QR codes

  // Form fields - Additional data
  category = '';
  parentLocation = '';
  sku = '';
  description = '';
  defaultQuantity: number | undefined;
  minQuantity: number | undefined;
  manageInventory = true;
  unit = '';
  tagsInput = '';
  notes = '';
  // Item-specific: default location
  defaultLocationId: number | undefined;
  // Location-specific: capacity rules
  maxItems: number | undefined;
  maxWeight: number | undefined;
  weightUnit: 'kg' | 'lb' | '' = '';
  allowedCategoriesInput = '';

  onCodeTypeChange(type: 'location' | 'item'): void {
    // Update prefix based on code type
    if (type === 'location') {
      this.prefix = 'LOC';
    } else {
      this.prefix = 'ITEM';
    }
    // Clear type-specific fields when switching
    this.category = '';
    this.parentLocation = '';
    this.sku = '';
    this.defaultQuantity = undefined;
    this.minQuantity = undefined;
    this.unit = '';
    this.manageInventory = true;
    this.defaultLocationId = undefined;
    this.maxItems = undefined;
    this.maxWeight = undefined;
    this.weightUnit = '';
    this.allowedCategoriesInput = '';
  }

  getCodesPerSheet(): number {
    if (!this.labelSheetMode) return 0;
    return this.sheetRows * this.sheetCols;
  }

  getSheetsNeeded(): number {
    const perSheet = this.getCodesPerSheet();
    if (perSheet === 0) return 0;
    return Math.ceil(this.codeCount / perSheet);
  }

  getQRCodeSize(): number {
    if (!this.labelSheetMode) return 0;
    const margin = 3;
    const gap = 2;
    const textHeight = this.showLabel ? 6 : 0;

    const availableWidth = this.sheetWidth - 2 * margin - (this.sheetCols - 1) * gap;
    const availableHeight = this.sheetHeight - 2 * margin - (this.sheetRows - 1) * gap;

    const maxWidthPerCell = availableWidth / this.sheetCols;
    const maxHeightPerCell = (availableHeight / this.sheetRows) - textHeight;

    return Math.floor(Math.min(maxWidthPerCell, maxHeightPerCell));
  }

  async generateBulkCodes(): Promise<void> {
    this.generating.set(true);

    try {
      const prefix = this.bulkPrefix || (this.bulkType === 'location' ? 'LOC' : 'ITEM');

      const codes = await this.qrService.generateQRCodes(this.bulkCount, {
        baseUrl: this.baseUrl,
        prefix: prefix,
        type: this.bulkType,
      });

      this.generatedCodes.set(codes);
      this.codeType = this.bulkType; // For CSV export
      this.step.set(2);
    } catch (error) {
      console.error('Error generating bulk QR codes:', error);
    } finally {
      this.generating.set(false);
    }
  }

  async generateCodes(): Promise<void> {
    this.generating.set(true);

    try {
      const tags = this.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Parse allowed categories for locations
      const allowedCategories = this.allowedCategoriesInput
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      // Get location name for item default location
      const defaultLocationName = this.defaultLocationId
        ? this.locations().find((l) => l.id === this.defaultLocationId)?.name
        : undefined;

      const codes = await this.qrService.generateQRCodes(this.codeCount, {
        baseUrl: this.baseUrl,
        prefix: this.prefix || 'TAG',
        type: this.codeType,
        category: this.category || undefined,
        description: this.description || undefined,
        parentLocation: this.parentLocation || undefined,
        sku: this.codeType === 'item' ? (this.sku || undefined) : undefined,
        defaultQuantity: this.codeType === 'item' ? this.defaultQuantity : undefined,
        minQuantity: this.codeType === 'item' ? this.minQuantity : undefined,
        manageInventory: this.codeType === 'item' ? this.manageInventory : undefined,
        unit: this.codeType === 'item' ? (this.unit || undefined) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        notes: this.notes || undefined,
        // Item-specific: default location
        defaultLocationId: this.codeType === 'item' ? this.defaultLocationId : undefined,
        defaultLocationName: this.codeType === 'item' ? defaultLocationName : undefined,
        // Location-specific: capacity rules
        maxItems: this.codeType === 'location' ? this.maxItems : undefined,
        maxWeight: this.codeType === 'location' ? this.maxWeight : undefined,
        weightUnit: this.codeType === 'location' && this.weightUnit ? this.weightUnit : undefined,
        allowedCategories: this.codeType === 'location' && allowedCategories.length > 0 ? allowedCategories : undefined,
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

    // Item-specific params
    if (this.codeType === 'item') {
      if (this.sku) params.set('sku', this.sku);
      if (this.defaultQuantity) params.set('qty', this.defaultQuantity.toString());
      if (this.minQuantity) params.set('minQty', this.minQuantity.toString());
      if (this.unit) params.set('unit', this.unit);
      params.set('inv', this.manageInventory ? '1' : '0');
      if (this.defaultLocationId) {
        const loc = this.locations().find((l) => l.id === this.defaultLocationId);
        if (loc) params.set('loc', loc.name);
      }
    }

    // Location-specific params
    if (this.codeType === 'location') {
      if (this.maxItems) params.set('maxItems', this.maxItems.toString());
      if (this.maxWeight) params.set('maxWt', this.maxWeight.toString());
      if (this.weightUnit) params.set('wtUnit', this.weightUnit);
      if (this.allowedCategoriesInput) {
        const cats = this.allowedCategoriesInput.split(',').map((c) => c.trim()).filter((c) => c).join(',');
        if (cats) params.set('allowCat', cats);
      }
    }

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
        labelSheetMode: this.labelSheetMode,
        sheetWidth: this.sheetWidth,
        sheetHeight: this.sheetHeight,
        sheetRows: this.sheetRows,
        sheetCols: this.sheetCols,
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
        labelSheetMode: this.labelSheetMode,
        sheetWidth: this.sheetWidth,
        sheetHeight: this.sheetHeight,
        sheetRows: this.sheetRows,
        sheetCols: this.sheetCols,
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
      ['ID', 'Type', 'SKU', 'Category', 'Quantity', 'Min Quantity', 'Unit', 'Description', 'Tags', 'Notes', 'Manage Inventory', 'URL', 'Created'],
      ...codes.map((code) => [
        code.name,
        this.codeType,
        this.codeType === 'item' ? (this.sku || '') : '',
        this.category || '',
        this.codeType === 'item' ? (this.defaultQuantity?.toString() || '') : '',
        this.codeType === 'item' ? (this.minQuantity?.toString() || '') : '',
        this.codeType === 'item' ? (this.unit || '') : '',
        `"${(this.description || '').replace(/"/g, '""')}"`,
        `"${this.tagsInput || ''}"`,
        `"${(this.notes || '').replace(/"/g, '""')}"`,
        this.codeType === 'item' ? (this.manageInventory ? 'Yes' : 'No') : '',
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
