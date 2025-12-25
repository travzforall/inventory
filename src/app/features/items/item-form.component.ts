import { Component, OnInit, inject, signal, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  InventoryItemService,
  LocationService,
  CidRegistryService,
  LabelQueueService,
} from '../../core/services';
import { InventoryItemCreate, StorageLocation } from '../../core/models';
import { CameraCaptureComponent } from '../../shared/components/camera-capture.component';

interface UnitOption {
  value: string;
  label: string;
  categories: string[]; // Empty array means available for all
}

// Category codes for CID generation (2 characters each)
const CATEGORY_CODES: Record<string, string> = {
  books: 'BK',
  cables: 'CB',
  electronics: 'EL',
  tools: 'TL',
  hardware: 'HW',
  office: 'OF',
  furniture: 'FN',
  consumables: 'CS',
  equipment: 'EQ',
  parts: 'PT',
  packaging: 'PK',
  safety: 'SF',
  cleaning: 'CL',
  media: 'MD',
  other: 'OT',
};

// Subcategory and Sub-subcategory structure
interface SubSubcategoryOption {
  value: string;
  label: string;
  code: string; // 1-2 char code for CID
}

interface SubcategoryOption {
  value: string;
  label: string;
  code: string; // 1-2 char code for CID
  subsubcategories?: SubSubcategoryOption[];
}

const SUBCATEGORIES: Record<string, SubcategoryOption[]> = {
  books: [
    { value: 'tech', label: 'Technical / Programming', code: 'T', subsubcategories: [
      { value: 'programming', label: 'Programming', code: 'P' },
      { value: 'networking', label: 'Networking / IT', code: 'N' },
      { value: 'electronics', label: 'Electronics', code: 'E' },
      { value: 'diy', label: 'DIY / Maker', code: 'D' },
    ]},
    { value: 'music', label: 'Music / Audio', code: 'M', subsubcategories: [
      { value: 'theory', label: 'Music Theory', code: 'T' },
      { value: 'instrument', label: 'Instrument Methods', code: 'I' },
      { value: 'production', label: 'Audio Production', code: 'P' },
      { value: 'songwriting', label: 'Songwriting', code: 'S' },
    ]},
    { value: 'notebook', label: 'Notebooks / Journals', code: 'N' },
    { value: 'fiction', label: 'Fiction', code: 'F' },
    { value: 'nonfiction', label: 'Non-Fiction', code: 'NF' },
    { value: 'reference', label: 'Reference', code: 'R' },
    { value: 'textbook', label: 'Textbooks', code: 'X' },
  ],
  cables: [
    { value: 'audio', label: 'Audio / Music', code: 'A', subsubcategories: [
      { value: 'xlr', label: 'XLR', code: 'XL' },
      { value: 'quarter-trs', label: '1/4" TRS (Balanced)', code: 'QT' },
      { value: 'quarter-ts', label: '1/4" TS (Unbalanced)', code: 'QS' },
      { value: 'rca', label: 'RCA', code: 'RC' },
      { value: 'speakon', label: 'Speakon', code: 'SP' },
      { value: 'midi', label: 'MIDI', code: 'MI' },
      { value: '3.5mm', label: '3.5mm / Aux', code: 'AX' },
      { value: 'optical', label: 'Optical / TOSLINK', code: 'OP' },
      { value: 'coax-audio', label: 'Coaxial (S/PDIF)', code: 'CX' },
    ]},
    { value: 'video', label: 'Video / Display', code: 'V', subsubcategories: [
      { value: 'hdmi', label: 'HDMI', code: 'HD' },
      { value: 'displayport', label: 'DisplayPort', code: 'DP' },
      { value: 'vga', label: 'VGA', code: 'VG' },
      { value: 'dvi', label: 'DVI', code: 'DV' },
      { value: 'sdi', label: 'SDI', code: 'SD' },
      { value: 'component', label: 'Component', code: 'CM' },
      { value: 'composite', label: 'Composite / RCA Video', code: 'CV' },
      { value: 'svideo', label: 'S-Video', code: 'SV' },
    ]},
    { value: 'network', label: 'Network / IT', code: 'N', subsubcategories: [
      { value: 'ethernet-cat5', label: 'Cat5 / Cat5e', code: 'C5' },
      { value: 'ethernet-cat6', label: 'Cat6 / Cat6a', code: 'C6' },
      { value: 'ethernet-cat7', label: 'Cat7 / Cat8', code: 'C7' },
      { value: 'fiber-sc', label: 'Fiber SC', code: 'FS' },
      { value: 'fiber-lc', label: 'Fiber LC', code: 'FL' },
      { value: 'coax-network', label: 'Coaxial', code: 'CX' },
      { value: 'phone', label: 'Phone / RJ11', code: 'PH' },
    ]},
    { value: 'usb', label: 'USB', code: 'U', subsubcategories: [
      { value: 'usb-a-to-b', label: 'USB-A to USB-B', code: 'AB' },
      { value: 'usb-a-to-c', label: 'USB-A to USB-C', code: 'AC' },
      { value: 'usb-c-to-c', label: 'USB-C to USB-C', code: 'CC' },
      { value: 'usb-a-to-micro', label: 'USB-A to Micro', code: 'AM' },
      { value: 'usb-a-to-mini', label: 'USB-A to Mini', code: 'AN' },
      { value: 'usb-ext', label: 'USB Extension', code: 'EX' },
    ]},
    { value: 'data', label: 'Data / Storage', code: 'D', subsubcategories: [
      { value: 'sata', label: 'SATA', code: 'SA' },
      { value: 'esata', label: 'eSATA', code: 'ES' },
      { value: 'thunderbolt', label: 'Thunderbolt', code: 'TB' },
      { value: 'firewire', label: 'FireWire', code: 'FW' },
      { value: 'ide', label: 'IDE / PATA', code: 'ID' },
      { value: 'scsi', label: 'SCSI', code: 'SC' },
    ]},
    { value: 'power', label: 'Power', code: 'P', subsubcategories: [
      { value: 'power-iec', label: 'IEC C13/C14', code: 'IC' },
      { value: 'power-c7', label: 'IEC C7 (Figure 8)', code: 'C7' },
      { value: 'power-ext', label: 'Extension Cord', code: 'EX' },
      { value: 'power-strip', label: 'Power Strip', code: 'PS' },
      { value: 'dc-barrel', label: 'DC Barrel', code: 'DC' },
    ]},
    { value: 'adapters', label: 'Adapters / Converters', code: 'X', subsubcategories: [
      { value: 'audio-adapter', label: 'Audio Adapter', code: 'AU' },
      { value: 'video-adapter', label: 'Video Adapter', code: 'VD' },
      { value: 'usb-adapter', label: 'USB Adapter', code: 'US' },
      { value: 'network-adapter', label: 'Network Adapter', code: 'NT' },
    ]},
  ],
  electronics: [
    { value: 'computer', label: 'Computers', code: 'C', subsubcategories: [
      { value: 'laptop', label: 'Laptops', code: 'L' },
      { value: 'desktop', label: 'Desktops', code: 'D' },
      { value: 'mini-pc', label: 'Mini PCs / NUCs', code: 'M' },
      { value: 'server', label: 'Servers', code: 'S' },
      { value: 'raspberry-pi', label: 'Raspberry Pi / SBC', code: 'R' },
    ]},
    { value: 'mobile', label: 'Mobile Devices', code: 'M', subsubcategories: [
      { value: 'phone', label: 'Phones', code: 'P' },
      { value: 'tablet', label: 'Tablets', code: 'T' },
      { value: 'ereader', label: 'E-Readers', code: 'E' },
      { value: 'smartwatch', label: 'Smartwatches', code: 'W' },
    ]},
    { value: 'audio', label: 'Audio Equipment', code: 'A', subsubcategories: [
      { value: 'speakers', label: 'Speakers', code: 'SP' },
      { value: 'headphones', label: 'Headphones', code: 'HP' },
      { value: 'microphones', label: 'Microphones', code: 'MC' },
      { value: 'interfaces', label: 'Audio Interfaces', code: 'IF' },
      { value: 'mixers', label: 'Mixers', code: 'MX' },
      { value: 'amps', label: 'Amplifiers', code: 'AM' },
      { value: 'recorders', label: 'Recorders', code: 'RC' },
    ]},
    { value: 'video', label: 'Video Equipment', code: 'V', subsubcategories: [
      { value: 'cameras', label: 'Cameras', code: 'CM' },
      { value: 'monitors', label: 'Monitors', code: 'MN' },
      { value: 'projectors', label: 'Projectors', code: 'PJ' },
      { value: 'capture', label: 'Capture Cards', code: 'CP' },
      { value: 'streaming', label: 'Streaming Gear', code: 'ST' },
    ]},
    { value: 'networking', label: 'Networking', code: 'N', subsubcategories: [
      { value: 'routers', label: 'Routers', code: 'RT' },
      { value: 'switches', label: 'Switches', code: 'SW' },
      { value: 'access-points', label: 'Access Points', code: 'AP' },
      { value: 'modems', label: 'Modems', code: 'MD' },
      { value: 'firewalls', label: 'Firewalls', code: 'FW' },
    ]},
    { value: 'storage', label: 'Storage Devices', code: 'S', subsubcategories: [
      { value: 'hdd', label: 'Hard Drives (HDD)', code: 'HD' },
      { value: 'ssd', label: 'Solid State (SSD)', code: 'SS' },
      { value: 'nvme', label: 'NVMe', code: 'NV' },
      { value: 'usb-flash', label: 'USB Flash Drives', code: 'UF' },
      { value: 'sd-cards', label: 'SD / Memory Cards', code: 'SD' },
      { value: 'nas', label: 'NAS Devices', code: 'NA' },
    ]},
    { value: 'peripherals', label: 'Peripherals', code: 'P', subsubcategories: [
      { value: 'keyboard', label: 'Keyboards', code: 'KB' },
      { value: 'mouse', label: 'Mice', code: 'MS' },
      { value: 'webcam', label: 'Webcams', code: 'WC' },
      { value: 'docking', label: 'Docking Stations', code: 'DK' },
      { value: 'hubs', label: 'USB Hubs', code: 'HB' },
    ]},
    { value: 'components', label: 'Components', code: 'X', subsubcategories: [
      { value: 'ram', label: 'RAM / Memory', code: 'RM' },
      { value: 'cpu', label: 'CPUs / Processors', code: 'CP' },
      { value: 'gpu', label: 'Graphics Cards', code: 'GP' },
      { value: 'psu', label: 'Power Supplies', code: 'PS' },
      { value: 'motherboard', label: 'Motherboards', code: 'MB' },
      { value: 'cooling', label: 'Cooling / Fans', code: 'CL' },
    ]},
  ],
  tools: [
    { value: 'hand', label: 'Hand Tools', code: 'H', subsubcategories: [
      { value: 'screwdrivers', label: 'Screwdrivers', code: 'SD' },
      { value: 'wrenches', label: 'Wrenches', code: 'WR' },
      { value: 'pliers', label: 'Pliers', code: 'PL' },
      { value: 'hammers', label: 'Hammers', code: 'HM' },
      { value: 'hex-keys', label: 'Hex Keys / Allen', code: 'HX' },
    ]},
    { value: 'power', label: 'Power Tools', code: 'P', subsubcategories: [
      { value: 'drills', label: 'Drills', code: 'DR' },
      { value: 'saws', label: 'Saws', code: 'SW' },
      { value: 'sanders', label: 'Sanders', code: 'SN' },
      { value: 'grinders', label: 'Grinders', code: 'GR' },
      { value: 'routers', label: 'Routers', code: 'RT' },
    ]},
    { value: 'measuring', label: 'Measuring', code: 'M', subsubcategories: [
      { value: 'tape-measure', label: 'Tape Measures', code: 'TM' },
      { value: 'level', label: 'Levels', code: 'LV' },
      { value: 'caliper', label: 'Calipers', code: 'CL' },
      { value: 'multimeter', label: 'Multimeters', code: 'MM' },
    ]},
    { value: 'cutting', label: 'Cutting', code: 'C' },
    { value: 'soldering', label: 'Soldering', code: 'S', subsubcategories: [
      { value: 'irons', label: 'Soldering Irons', code: 'IR' },
      { value: 'stations', label: 'Soldering Stations', code: 'ST' },
      { value: 'accessories', label: 'Accessories', code: 'AC' },
    ]},
    { value: 'gardening', label: 'Gardening', code: 'G' },
  ],
  hardware: [
    { value: 'screws', label: 'Screws', code: 'SC', subsubcategories: [
      { value: 'wood', label: 'Wood Screws', code: 'W' },
      { value: 'machine', label: 'Machine Screws', code: 'M' },
      { value: 'self-tapping', label: 'Self-Tapping', code: 'T' },
      { value: 'drywall', label: 'Drywall', code: 'D' },
      { value: 'deck', label: 'Deck / Exterior', code: 'X' },
    ]},
    { value: 'bolts', label: 'Bolts / Nuts', code: 'BL', subsubcategories: [
      { value: 'hex-bolt', label: 'Hex Bolts', code: 'H' },
      { value: 'carriage', label: 'Carriage Bolts', code: 'C' },
      { value: 'lag', label: 'Lag Bolts', code: 'L' },
      { value: 'nuts', label: 'Nuts', code: 'N' },
    ]},
    { value: 'nails', label: 'Nails', code: 'NL' },
    { value: 'anchors', label: 'Anchors', code: 'AN' },
    { value: 'brackets', label: 'Brackets / Mounts', code: 'BR' },
    { value: 'hinges', label: 'Hinges', code: 'HN' },
    { value: 'hooks', label: 'Hooks', code: 'HK' },
    { value: 'washers', label: 'Washers', code: 'WS' },
  ],
  office: [
    { value: 'paper', label: 'Paper Products', code: 'P' },
    { value: 'writing', label: 'Writing Instruments', code: 'W' },
    { value: 'filing', label: 'Filing / Organization', code: 'F' },
    { value: 'desk', label: 'Desk Accessories', code: 'D' },
    { value: 'printing', label: 'Printing Supplies', code: 'R' },
  ],
  furniture: [
    { value: 'seating', label: 'Seating', code: 'S' },
    { value: 'tables', label: 'Tables / Desks', code: 'T' },
    { value: 'storage', label: 'Storage / Shelving', code: 'R' },
    { value: 'outdoor', label: 'Outdoor', code: 'O' },
  ],
  consumables: [
    { value: 'batteries', label: 'Batteries', code: 'BT', subsubcategories: [
      { value: 'aa', label: 'AA', code: 'A' },
      { value: 'aaa', label: 'AAA', code: '3' },
      { value: '9v', label: '9V', code: '9' },
      { value: 'button', label: 'Button Cells', code: 'B' },
      { value: 'rechargeable', label: 'Rechargeable', code: 'R' },
    ]},
    { value: 'bulbs', label: 'Light Bulbs', code: 'LB' },
    { value: 'tape', label: 'Tape / Adhesives', code: 'TP' },
    { value: 'lubricants', label: 'Lubricants', code: 'LU' },
  ],
  equipment: [
    { value: 'av', label: 'AV Equipment', code: 'AV' },
    { value: 'lighting', label: 'Lighting', code: 'LT', subsubcategories: [
      { value: 'stage-lights', label: 'Stage Lights', code: 'SL' },
      { value: 'led-panels', label: 'LED Panels', code: 'LP' },
      { value: 'moving-heads', label: 'Moving Heads', code: 'MH' },
      { value: 'controllers', label: 'DMX Controllers', code: 'DM' },
    ]},
    { value: 'stage', label: 'Stage / Rigging', code: 'ST' },
    { value: 'test', label: 'Test Equipment', code: 'TE' },
  ],
  parts: [
    { value: 'electronic', label: 'Electronic Parts', code: 'E', subsubcategories: [
      { value: 'resistors', label: 'Resistors', code: 'R' },
      { value: 'capacitors', label: 'Capacitors', code: 'C' },
      { value: 'transistors', label: 'Transistors', code: 'T' },
      { value: 'ics', label: 'ICs / Chips', code: 'I' },
      { value: 'leds', label: 'LEDs', code: 'L' },
      { value: 'connectors', label: 'Connectors', code: 'N' },
    ]},
    { value: 'mechanical', label: 'Mechanical Parts', code: 'M' },
    { value: 'replacement', label: 'Replacement Parts', code: 'R' },
  ],
  media: [
    { value: 'cd', label: 'CDs', code: 'CD' },
    { value: 'dvd', label: 'DVDs / Blu-ray', code: 'DV' },
    { value: 'vinyl', label: 'Vinyl Records', code: 'VN' },
    { value: 'tape', label: 'Cassettes / Tapes', code: 'TP' },
  ],
};

const UNIT_OPTIONS: UnitOption[] = [
  { value: 'pcs', label: 'Pieces (pcs)', categories: [] },
  { value: 'box', label: 'Boxes', categories: [] },
  { value: 'pack', label: 'Packs', categories: [] },
  { value: 'set', label: 'Sets', categories: [] },
  // Length units - for cables, hardware
  { value: 'ft', label: 'Feet (ft)', categories: ['cables', 'hardware'] },
  { value: 'm', label: 'Meters (m)', categories: ['cables', 'hardware'] },
  { value: 'cm', label: 'Centimeters (cm)', categories: ['cables', 'hardware'] },
  { value: 'in', label: 'Inches (in)', categories: ['cables', 'hardware'] },
  // Weight units - for consumables, cleaning, parts
  { value: 'kg', label: 'Kilograms (kg)', categories: ['consumables', 'cleaning', 'parts'] },
  { value: 'g', label: 'Grams (g)', categories: ['consumables', 'cleaning', 'parts'] },
  { value: 'lb', label: 'Pounds (lb)', categories: ['consumables', 'cleaning', 'parts'] },
  { value: 'oz', label: 'Ounces (oz)', categories: ['consumables', 'cleaning', 'parts'] },
  // Volume units - for consumables, cleaning
  { value: 'l', label: 'Liters (L)', categories: ['consumables', 'cleaning'] },
  { value: 'ml', label: 'Milliliters (mL)', categories: ['consumables', 'cleaning'] },
  { value: 'gal', label: 'Gallons (gal)', categories: ['consumables', 'cleaning'] },
  // Other
  { value: 'roll', label: 'Rolls', categories: ['packaging', 'office'] },
  { value: 'sheet', label: 'Sheets', categories: ['packaging', 'office'] },
  { value: 'ream', label: 'Reams', categories: ['office'] },
  { value: 'pair', label: 'Pairs', categories: ['safety', 'cables'] },
];

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CameraCaptureComponent],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <button class="btn btn-ghost btn-circle" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold ml-2">{{ isEdit() ? 'Edit Item' : 'New Item' }}</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-2xl">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <form (ngSubmit)="onSubmit()">
              <!-- Photos Section -->
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Photos</span>
                </label>
                <app-camera-capture
                  #cameraCapture
                  (imagesChanged)="onImagesChanged($event)"
                />
              </div>

              <div class="divider"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Item name"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.name"
                    name="name"
                    required
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">CID (Custom ID)</span>
                    <span class="label-text-alt text-base-content/60">Auto-generated</span>
                  </label>
                  <div class="join w-full">
                    <input
                      type="text"
                      class="input input-bordered join-item w-full font-mono bg-base-200"
                      [value]="generatedCid()"
                      readonly
                      placeholder="Select category first"
                    />
                    <button
                      type="button"
                      class="btn btn-square join-item"
                      (click)="regenerateCid()"
                      title="Regenerate CID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">
                      Format: [Category][Sub][Type][Unique] = 8-10 chars
                    </span>
                  </label>
                </div>
              </div>

              <!-- Label Quantity & Queue Section -->
              <div class="card bg-base-200 mt-4">
                <div class="card-body p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Labels
                    </h3>
                    @if (labelQueueCount() > 0) {
                      <a routerLink="/labels" class="badge badge-primary badge-sm">
                        {{ labelQueueCount() }} in queue
                      </a>
                    }
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control w-full">
                      <label class="label py-1">
                        <span class="label-text text-sm">Label Quantity</span>
                      </label>
                      <input
                        type="number"
                        class="input input-bordered input-sm w-full"
                        [ngModel]="labelQuantity()"
                        (ngModelChange)="onLabelQuantityChange($event)"
                        name="labelQuantity"
                        min="1"
                        max="100"
                      />
                      <label class="label py-1">
                        <span class="label-text-alt text-base-content/60">
                          Each label gets a unique CID
                        </span>
                      </label>
                    </div>

                    <div class="form-control">
                      <label class="label cursor-pointer justify-start gap-3 py-1">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-primary checkbox-sm"
                          [ngModel]="addToLabelQueue()"
                          (ngModelChange)="addToLabelQueue.set($event)"
                          name="addToLabelQueue"
                        />
                        <span class="label-text text-sm">Add to print queue</span>
                      </label>
                    </div>
                  </div>

                  <!-- Show all generated CIDs when quantity > 1 -->
                  @if (allGeneratedCids().length > 1) {
                    <div class="mt-3">
                      <label class="label py-1">
                        <span class="label-text text-sm">Generated CIDs ({{ allGeneratedCids().length }})</span>
                      </label>
                      <div class="flex flex-wrap gap-1">
                        @for (cid of allGeneratedCids(); track cid) {
                          <span class="badge badge-outline font-mono text-xs">{{ cid }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Optional description"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.description"
                  name="description"
                  rows="3"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Min Quantity (Low Stock Alert)</span>
                  </label>
                  <input
                    type="number"
                    class="input input-bordered w-full"
                    [(ngModel)]="form.minQuantity"
                    name="minQuantity"
                    min="0"
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Location</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.currentLocationId"
                    name="currentLocationId"
                  >
                    <option [ngValue]="undefined">No Location</option>
                    @for (loc of locations(); track loc.id) {
                      <option [ngValue]="loc.id">{{ loc.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Category</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.category"
                    name="category"
                    (ngModelChange)="onCategoryChange($event)"
                  >
                    <option value="">No category</option>
                    <option value="books">Books</option>
                    <option value="cables">Cables</option>
                    <option value="electronics">Electronics</option>
                    <option value="tools">Tools</option>
                    <option value="hardware">Hardware</option>
                    <option value="office">Office Supplies</option>
                    <option value="furniture">Furniture</option>
                    <option value="consumables">Consumables</option>
                    <option value="equipment">Equipment</option>
                    <option value="parts">Parts & Components</option>
                    <option value="packaging">Packaging</option>
                    <option value="safety">Safety & PPE</option>
                    <option value="cleaning">Cleaning Supplies</option>
                    <option value="media">Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Subcategory</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [ngModel]="selectedSubcategory()"
                    name="subcategory"
                    (ngModelChange)="onSubcategoryChange($event)"
                    [disabled]="!hasSubcategories()"
                  >
                    <option value="">{{ hasSubcategories() ? 'Select subcategory' : 'No subcategories' }}</option>
                    @for (sub of availableSubcategories(); track sub.value) {
                      <option [value]="sub.value">{{ sub.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Type</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [ngModel]="selectedSubSubcategory()"
                    name="subsubcategory"
                    (ngModelChange)="onSubSubcategoryChange($event)"
                    [disabled]="!hasSubSubcategories()"
                  >
                    <option value="">{{ hasSubSubcategories() ? 'Select type' : 'No types available' }}</option>
                    @for (subSub of availableSubSubcategories(); track subSub.value) {
                      <option [value]="subSub.value">{{ subSub.label }}</option>
                    }
                  </select>
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Unit of Measure</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    [(ngModel)]="form.unit"
                    name="unit"
                  >
                    <option value="">No unit</option>
                    @for (unit of filteredUnits(); track unit.value) {
                      <option [value]="unit.value">{{ unit.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">Tags</span>
                  </label>
                  <div class="flex flex-wrap gap-2 p-2 min-h-12 border border-base-300 rounded-lg bg-base-100">
                    @for (tag of tags(); track tag) {
                      <span class="badge badge-primary gap-1">
                        {{ tag }}
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs p-0 h-auto min-h-0"
                          (click)="removeTag(tag)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    }
                    <input
                      type="text"
                      placeholder="{{ tags().length === 0 ? 'Type and press Enter...' : '' }}"
                      class="flex-1 min-w-24 bg-transparent outline-none text-sm"
                      [(ngModel)]="tagInput"
                      name="tagInput"
                      (keydown)="onTagKeydown($event)"
                    />
                  </div>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">Press Enter to add a tag</span>
                  </label>
                </div>

                <div class="form-control w-full">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      [(ngModel)]="form.manageInventory"
                      name="manageInventory"
                    />
                    <span class="label-text">Manage Inventory</span>
                  </label>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">Track quantity and low-stock alerts</span>
                  </label>
                </div>
              </div>

              <div class="form-control w-full mt-4">
                <label class="label">
                  <span class="label-text">Notes</span>
                </label>
                <textarea
                  placeholder="Additional notes"
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="form.notes"
                  name="notes"
                  rows="2"
                ></textarea>
              </div>

              <div class="divider"></div>

              <div class="flex justify-end gap-2">
                <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving() || !form.name || !generatedCid()"
                >
                  @if (saving()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  {{ isEdit() ? 'Save Changes' : 'Create Item' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ItemFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private itemService = inject(InventoryItemService);
  private locationService = inject(LocationService);
  private cidRegistry = inject(CidRegistryService);
  private labelQueue = inject(LabelQueueService);

  cameraCapture = viewChild<CameraCaptureComponent>('cameraCapture');

  isEdit = signal(false);
  saving = signal(false);
  itemId = signal<number | null>(null);
  locations = signal<StorageLocation[]>([]);
  selectedCategory = signal('');

  tags = signal<string[]>([]);
  tagInput = '';
  images: string[] = [];
  cidSuffix = signal(''); // Stores the unique part of CID
  selectedSubcategory = signal('');
  selectedSubSubcategory = signal('');

  // Label queue
  addToLabelQueue = signal(true);
  labelQuantity = signal(1);
  generatedCids = signal<string[]>([]);

  // Computed: label queue count for badge
  labelQueueCount = computed(() => this.labelQueue.pendingCount());

  availableSubcategories = computed(() => {
    const category = this.selectedCategory();
    return SUBCATEGORIES[category] || [];
  });

  hasSubcategories = computed(() => {
    return this.availableSubcategories().length > 0;
  });

  selectedSubcategoryCode = computed(() => {
    const category = this.selectedCategory();
    const subcategory = this.selectedSubcategory();
    const subcategories = SUBCATEGORIES[category];
    if (!subcategories || !subcategory) return '';
    const sub = subcategories.find((s) => s.value === subcategory);
    return sub?.code || '';
  });

  availableSubSubcategories = computed(() => {
    const category = this.selectedCategory();
    const subcategory = this.selectedSubcategory();
    const subcategories = SUBCATEGORIES[category];
    if (!subcategories || !subcategory) return [];
    const sub = subcategories.find((s) => s.value === subcategory);
    return sub?.subsubcategories || [];
  });

  hasSubSubcategories = computed(() => {
    return this.availableSubSubcategories().length > 0;
  });

  selectedSubSubcategoryCode = computed(() => {
    const subSubcategory = this.selectedSubSubcategory();
    const subSubcategories = this.availableSubSubcategories();
    if (!subSubcategories.length || !subSubcategory) return '';
    const subSub = subSubcategories.find((s) => s.value === subSubcategory);
    return subSub?.code || '';
  });

  // CID prefix based on category/subcategory/type
  cidPrefix = computed(() => {
    const category = this.selectedCategory();
    if (!category) return '';
    const categoryCode = CATEGORY_CODES[category] || 'XX';
    const subCode = this.selectedSubcategoryCode();
    const subSubCode = this.selectedSubSubcategoryCode();

    if (subCode && subSubCode) {
      return `${categoryCode}${subCode}${subSubCode}`;
    } else if (subCode) {
      return `${categoryCode}${subCode}`;
    }
    return categoryCode;
  });

  // First CID in sequence (shown in UI)
  generatedCid = computed(() => {
    const prefix = this.cidPrefix();
    if (!prefix) return '';
    const cids = this.generatedCids();
    return cids.length > 0 ? cids[0] : '';
  });

  // All CIDs for this item (based on label quantity)
  allGeneratedCids = computed(() => {
    return this.generatedCids();
  });

  filteredUnits = computed(() => {
    const category = this.selectedCategory();
    if (!category) {
      // Show only universal units when no category selected
      return UNIT_OPTIONS.filter((u) => u.categories.length === 0);
    }
    // Show universal units + category-specific units
    return UNIT_OPTIONS.filter(
      (u) => u.categories.length === 0 || u.categories.includes(category)
    );
  });
  private pendingLocationLookup: string | null = null;

  form: InventoryItemCreate = {
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    minQuantity: 0,
    currentLocationId: undefined,
    tags: [],
    images: [],
    unit: '',
    notes: '',
    category: '',
    manageInventory: true,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.itemId.set(Number(id));
      this.loadItem(Number(id));
    } else {
      // Pre-fill from query params (from NFC scan)
      this.prefillFromQueryParams();
    }
    this.loadLocations();
  }

  private prefillFromQueryParams(): void {
    const params = this.route.snapshot.queryParams;

    // Helper to get param with fallback short form
    const getParam = (full: string, short?: string): string | undefined => {
      return params[full] || (short ? params[short] : undefined);
    };

    // Fill form fields directly (support both full and short param names from QR codes)
    const name = getParam('name');
    if (name) {
      this.form.name = name;
    }

    const sku = getParam('sku');
    if (sku) {
      this.form.sku = sku;
    }

    // Description: 'description' or 'desc'
    const description = getParam('description', 'desc');
    if (description) {
      this.form.description = description;
    }

    // Quantity: 'quantity' or 'qty'
    const quantity = getParam('quantity', 'qty');
    if (quantity) {
      this.form.quantity = parseInt(quantity, 10) || 0;
    }

    // Min Quantity: 'minQuantity' or 'minQty'
    const minQuantity = getParam('minQuantity', 'minQty');
    if (minQuantity) {
      this.form.minQuantity = parseInt(minQuantity, 10) || 0;
    }

    // Location: 'locationId', 'locId' or 'locationName', 'loc'
    const locationId = getParam('locationId', 'locId');
    if (locationId) {
      this.form.currentLocationId = parseInt(locationId, 10);
    }
    // Store location name for lookup after locations load
    const locationName = getParam('locationName', 'loc');
    if (locationName && !locationId) {
      this.pendingLocationLookup = locationName;
    }

    // Unit field
    const unit = getParam('unit');
    if (unit) {
      this.form.unit = unit;
    }

    // Notes field
    const notes = getParam('notes');
    if (notes) {
      this.form.notes = notes;
    }

    // Category: 'category' or 'cat'
    const category = getParam('category', 'cat');
    if (category) {
      this.form.category = category;
    }

    // Manage Inventory: 'manageInventory', 'manage', or 'inv'
    const manageVal = params['manageInventory'] ?? params['manage'] ?? params['inv'];
    if (manageVal !== undefined) {
      this.form.manageInventory = manageVal === 'true' || manageVal === '1' || manageVal === true;
    }

    // Build tags from tags param
    const tagsParam = getParam('tags');
    if (tagsParam) {
      const tagParts: string[] = [];
      tagsParam.split(',').forEach((tag: string) => {
        const trimmed = tag.trim().toLowerCase();
        if (trimmed) tagParts.push(trimmed);
      });
      if (tagParts.length > 0) {
        this.tags.set(tagParts);
      }
    }

    // Set category signal for filtered units
    if (this.form.category) {
      this.selectedCategory.set(this.form.category);
    }
  }

  private loadItem(id: number): void {
    this.itemService.getById(id).subscribe({
      next: (item) => {
        this.form = {
          name: item.name,
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          currentLocationId: item.currentLocationId ?? undefined,
          tags: item.tags,
          images: item.images,
          unit: item.unit || '',
          notes: item.notes || '',
          category: item.category || '',
          manageInventory: item.manageInventory ?? true,
        };
        this.tags.set(item.tags);
        this.selectedCategory.set(item.category || '');
        // Extract CID suffix from existing SKU (last 6 characters)
        if (item.sku && item.sku.length >= 6) {
          this.cidSuffix.set(item.sku.slice(-6));
        }
        this.images = item.images;
        // Set images in camera component after view init
        setTimeout(() => {
          this.cameraCapture()?.setImages(item.images);
        });
      },
    });
  }

  private loadLocations(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => {
        this.locations.set(locations);

        // Handle pending location lookup from QR code
        if (this.pendingLocationLookup) {
          const searchName = this.pendingLocationLookup.toLowerCase().trim();
          const matchingLocation = locations.find(
            (loc) => loc.name.toLowerCase().trim() === searchName
          );
          if (matchingLocation) {
            this.form.currentLocationId = matchingLocation.id;
          }
          this.pendingLocationLookup = null;
        }
      },
    });
  }

  onImagesChanged(images: string[]): void {
    this.images = images;
  }

  /**
   * Generate sequential CIDs using the registry
   */
  generateSequentialCids(): void {
    const prefix = this.cidPrefix();
    if (!prefix) return;

    const quantity = this.labelQuantity();
    const cids = this.cidRegistry.generateSequentialCids(prefix, quantity, 2);
    this.generatedCids.set(cids);
    // Use first CID as the item's SKU
    this.form.sku = cids[0] || '';
  }

  regenerateCid(): void {
    this.generateSequentialCids();
  }

  onLabelQuantityChange(quantity: number): void {
    this.labelQuantity.set(Math.max(1, quantity));
    this.generateSequentialCids();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);

    // Reset subcategory and sub-subcategory when category changes
    this.selectedSubcategory.set('');
    this.selectedSubSubcategory.set('');

    // Auto-generate CIDs
    if (category) {
      this.generateSequentialCids();
    } else {
      this.generatedCids.set([]);
    }
    // Update form.sku with the new CID
    this.form.sku = this.generatedCid();

    // Reset unit if current unit is not valid for new category
    const currentUnit = this.form.unit;
    if (currentUnit) {
      const validUnits = this.filteredUnits();
      if (!validUnits.find((u) => u.value === currentUnit)) {
        this.form.unit = '';
      }
    }
  }

  onSubcategoryChange(subcategory: string): void {
    this.selectedSubcategory.set(subcategory);
    // Reset sub-subcategory when subcategory changes
    this.selectedSubSubcategory.set('');
    // Regenerate CIDs with new prefix
    this.generateSequentialCids();
  }

  onSubSubcategoryChange(subSubcategory: string): void {
    this.selectedSubSubcategory.set(subSubcategory);
    // Regenerate CIDs with new prefix
    this.generateSequentialCids();
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && !this.tagInput && this.tags().length > 0) {
      // Remove last tag on backspace if input is empty
      const currentTags = this.tags();
      this.tags.set(currentTags.slice(0, -1));
    }
  }

  addTag(): void {
    const tag = this.tagInput.trim().toLowerCase();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update((tags) => [...tags, tag]);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
  }

  onSubmit(): void {
    const cids = this.generatedCids();
    const primaryCid = cids[0];
    if (!this.form.name || !primaryCid) return;

    this.saving.set(true);

    const data = {
      ...this.form,
      sku: primaryCid, // Use the first CID as the item's SKU
      images: this.images,
      tags: this.tags(),
      quantity: this.labelQuantity(), // Use label quantity as item quantity
    };

    const request = this.isEdit()
      ? this.itemService.update(this.itemId()!, data)
      : this.itemService.create(data);

    request.subscribe({
      next: (item) => {
        // Register all CIDs in the registry
        const cidEntries = cids.map((cid) => ({
          cid,
          name: this.form.name,
          itemId: item.id,
        }));
        this.cidRegistry.registerBatch(cidEntries);

        // Add to label queue if checkbox is checked
        if (this.addToLabelQueue() && cids.length > 0) {
          const labelItems = cids.map((cid) => ({
            cid,
            name: this.form.name,
            quantity: 1, // One label per CID
          }));
          this.labelQueue.addBatchToQueue(labelItems);
        }

        this.saving.set(false);
        this.router.navigate(['/items', item.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    if (this.isEdit() && this.itemId()) {
      this.router.navigate(['/items', this.itemId()]);
    } else {
      // Check if we came from a location
      const locationId = this.route.snapshot.queryParams['locationId'];
      if (locationId) {
        this.router.navigate(['/locations', locationId]);
      } else {
        this.router.navigate(['/items']);
      }
    }
  }
}
