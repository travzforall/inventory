import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerService } from '../../core/services';
import { ServerCreate } from '../../core/models';

@Component({
  selector: 'app-server-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <button class="btn btn-ghost btn-circle" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold ml-2">{{ isEdit() ? 'Edit Server' : 'Add Server' }}</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-4xl">
        @if (loadingServers()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <form (ngSubmit)="onSubmit()">
                <!-- Naming Configuration -->
                <div class="bg-base-200 rounded-box p-4 mb-6">
                  <h4 class="font-bold text-sm mb-4">Server Naming</h4>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <!-- Network Type -->
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-xs">Network</span>
                      </label>
                      <div class="join w-full">
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.network === 'P'" [class.btn-ghost]="naming.network !== 'P'" (click)="setNaming('network', 'P')">Public</button>
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.network === 'X'" [class.btn-ghost]="naming.network !== 'X'" (click)="setNaming('network', 'X')">Private</button>
                      </div>
                    </div>

                    <!-- Machine Type -->
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-xs">Type</span>
                      </label>
                      <div class="join w-full">
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.type === 'S'" [class.btn-ghost]="naming.type !== 'S'" (click)="setNaming('type', 'S')">Server</button>
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.type === 'H'" [class.btn-ghost]="naming.type !== 'H'" (click)="setNaming('type', 'H')">Host</button>
                      </div>
                    </div>

                    <!-- Install Type -->
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-xs">Install</span>
                      </label>
                      <div class="join w-full">
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.install === 'app'" [class.btn-ghost]="naming.install !== 'app'" (click)="setNaming('install', 'app')">App</button>
                        <button type="button" class="join-item btn btn-sm flex-1" [class.btn-primary]="naming.install === 'os'" [class.btn-ghost]="naming.install !== 'os'" (click)="setNaming('install', 'os')">OS</button>
                      </div>
                    </div>

                    <!-- Sequence Number -->
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-xs">Number</span>
                      </label>
                      <input
                        type="number"
                        class="input input-bordered input-sm w-full font-mono"
                        [(ngModel)]="naming.sequence"
                        name="sequence"
                        min="1"
                        max="99"
                        (ngModelChange)="updateGeneratedNames()"
                      />
                    </div>
                  </div>

                  <!-- Generated Names Preview -->
                  <div class="flex flex-wrap gap-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-base-content/60">VM Name:</span>
                      <span class="font-mono font-bold text-primary">{{ form.vmName }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-base-content/60">Host Name:</span>
                      <span class="font-mono font-bold text-secondary">{{ form.hostName }}</span>
                    </div>
                  </div>
                </div>

                <!-- VM Number -->
                <h3 class="font-bold text-lg mb-4">Server Identity</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">VM Number *</span>
                      <span class="label-text-alt text-base-content/50">Proxmox ID</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 118"
                      class="input input-bordered w-full font-mono"
                      [(ngModel)]="form.vmNumber"
                      name="vmNumber"
                      min="100"
                    />
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">VM Name</span>
                      <span class="label-text-alt text-info">Auto</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full font-mono bg-base-200"
                      [(ngModel)]="form.vmName"
                      name="vmName"
                      readonly
                    />
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">Host Name</span>
                      <span class="label-text-alt text-info">Auto</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full font-mono bg-base-200"
                      [(ngModel)]="form.hostName"
                      name="hostName"
                      readonly
                    />
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Specs - with sensible defaults -->
                <h3 class="font-bold text-lg mb-4">Specifications</h3>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">CPU</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="form.cpu" name="cpu">
                      <option value="2 cores">2 cores</option>
                      <option value="3 cores">3 cores</option>
                      <option value="4 cores">4 cores</option>
                      <option value="6 cores">6 cores</option>
                      <option value="8 cores">8 cores</option>
                    </select>
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">RAM</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="form.ram" name="ram">
                      <option value="8">8 GB</option>
                      <option value="16">16 GB</option>
                      <option value="19.53">19.53 GB</option>
                      <option value="32">32 GB</option>
                      <option value="64">64 GB</option>
                    </select>
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">HDD</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="form.hdd" name="hdd">
                      <option value="32 GB SCSI">32 GB</option>
                      <option value="50 GB SCSI">50 GB</option>
                      <option value="85 GB SCSI">85 GB</option>
                      <option value="100 GB SCSI">100 GB</option>
                      <option value="200 GB SCSI">200 GB</option>
                      <option value="350 GB SCSI">350 GB</option>
                    </select>
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">Bucket</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="form.bucket" name="bucket">
                      <option value="bucket">bucket</option>
                      <option value="bucket2">bucket2</option>
                    </select>
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">Server OS</span>
                    </label>
                    <select class="select select-bordered w-full" [(ngModel)]="form.serverOs" name="serverOs">
                      <option value="Ubuntu 24">Ubuntu 24</option>
                      <option value="Ubuntu 22">Ubuntu 22</option>
                      <option value="Debian 12">Debian 12</option>
                      <option value="Debian 11">Debian 11</option>
                    </select>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Network -->
                <h3 class="font-bold text-lg mb-4">Network</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">IP Address *</span>
                    </label>
                    <div class="join w-full">
                      <span class="join-item btn btn-disabled bg-base-200 font-mono text-sm">192.168.1.</span>
                      <input
                        type="text"
                        placeholder="xxx"
                        class="input input-bordered join-item w-full font-mono"
                        [(ngModel)]="ipLastOctet"
                        (ngModelChange)="onIpChange()"
                        name="ipLastOctet"
                        maxlength="3"
                      />
                    </div>
                    <label class="label">
                      <span class="label-text-alt font-mono">{{ form.ipAddress }}</span>
                    </label>
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">Dockge Port</span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full bg-base-200 font-mono"
                      [(ngModel)]="form.dockge"
                      name="dockge"
                      readonly
                    />
                  </div>
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text">VLAN</span>
                    </label>
                    <input
                      type="number"
                      class="input input-bordered w-full bg-base-200"
                      [(ngModel)]="form.vlan"
                      name="vlan"
                      readonly
                    />
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Software -->
                <h3 class="font-bold text-lg mb-4">Installed Software</h3>
                <p class="text-sm text-base-content/60 mb-4">Enter software name and port. Links auto-generate.</p>

                <!-- Software entries -->
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <div class="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div class="col-span-1 text-center font-mono text-sm text-base-content/60 pb-3">
                      {{ i }}
                    </div>
                    <div class="col-span-4">
                      @if (i === 1) {
                        <label class="label py-1">
                          <span class="label-text text-xs">Software Name</span>
                        </label>
                      }
                      <input
                        type="text"
                        placeholder="e.g., Dockge"
                        class="input input-bordered input-sm w-full"
                        [(ngModel)]="softwareEntries[i - 1].name"
                        [name]="'software' + i"
                        (ngModelChange)="updateSoftwareLink(i - 1)"
                      />
                    </div>
                    <div class="col-span-2">
                      @if (i === 1) {
                        <label class="label py-1">
                          <span class="label-text text-xs">Port</span>
                        </label>
                      }
                      <input
                        type="text"
                        placeholder="5001"
                        class="input input-bordered input-sm w-full font-mono"
                        [(ngModel)]="softwareEntries[i - 1].port"
                        [name]="'software' + i + 'Port'"
                        (ngModelChange)="updateSoftwareLink(i - 1)"
                      />
                    </div>
                    <div class="col-span-5">
                      @if (i === 1) {
                        <label class="label py-1">
                          <span class="label-text text-xs">Link</span>
                          <span class="label-text-alt text-info text-xs">Auto</span>
                        </label>
                      }
                      <input
                        type="text"
                        class="input input-bordered input-sm w-full font-mono text-xs bg-base-200"
                        [(ngModel)]="softwareEntries[i - 1].link"
                        [name]="'software' + i + 'Link'"
                        readonly
                      />
                    </div>
                  </div>
                }

                <div class="divider"></div>

                <!-- Status Flags -->
                <h3 class="font-bold text-lg mb-4">Status</h3>
                <div class="flex flex-wrap gap-6">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" class="toggle toggle-success" [(ngModel)]="form.live" name="live" />
                      <span class="label-text">Live</span>
                    </label>
                  </div>
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" class="toggle toggle-info" [(ngModel)]="form.https" name="https" />
                      <span class="label-text">HTTPS</span>
                    </label>
                  </div>
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" class="toggle toggle-primary" [(ngModel)]="form.setup" name="setup" />
                      <span class="label-text">Setup Complete</span>
                    </label>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Submit -->
                <div class="flex justify-end gap-2">
                  <button type="button" class="btn btn-ghost" (click)="goBack()">Cancel</button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="saving() || !form.vmNumber || !form.vmName || !form.ipAddress"
                  >
                    @if (saving()) {
                      <span class="loading loading-spinner loading-sm"></span>
                    }
                    {{ isEdit() ? 'Save Changes' : 'Create Server' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ServerFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private serverService = inject(ServerService);

  isEdit = signal(false);
  saving = signal(false);
  loadingServers = signal(true);
  serverId = signal<number | null>(null);

  // Naming configuration
  naming = {
    network: 'P' as 'P' | 'X',      // P = Public, X = Private
    type: 'S' as 'S' | 'H',          // S = Server, H = Host
    install: 'app' as 'app' | 'os',  // app = Docker/Dockge, os = Full ISO
    sequence: 1,
  };

  ipLastOctet = '';

  softwareEntries = [
    { name: '', port: '', link: '' },
    { name: '', port: '', link: '' },
    { name: '', port: '', link: '' },
    { name: '', port: '', link: '' },
    { name: '', port: '', link: '' },
  ];

  form: ServerCreate = {
    vmNumber: 0,
    vmName: '',
    hostName: '',
    cpu: '3 cores',
    ram: '19.53',
    hdd: '50 GB SCSI',
    bucket: 'bucket',
    serverOs: 'Ubuntu 24',
    ipAddress: '',
    dockge: '5001',
    software1: '',
    software1Ports: '',
    software1Link: '',
    software2: '',
    software2Ports: '',
    software2Link: '',
    software3: '',
    software3Ports: '',
    software3Link: '',
    software4: '',
    software4Ports: '',
    software4Link: '',
    software5: '',
    software5Ports: '',
    software5Link: '',
    vlan: 1,
    live: false,
    https: false,
    setup: false,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.serverId.set(Number(id));
      this.loadServer(Number(id));
    } else {
      this.updateGeneratedNames();
      this.loadingServers.set(false);
    }
  }

  setNaming(field: 'network' | 'type' | 'install', value: string): void {
    if (field === 'network') {
      this.naming.network = value as 'P' | 'X';
    } else if (field === 'type') {
      this.naming.type = value as 'S' | 'H';
    } else if (field === 'install') {
      this.naming.install = value as 'app' | 'os';
    }
    this.updateGeneratedNames();
  }

  updateGeneratedNames(): void {
    // Generate VM Name: PS-01, XS-02, PH-03, XH-04
    const seq = this.naming.sequence.toString().padStart(2, '0');
    this.form.vmName = `${this.naming.network}${this.naming.type}-${seq}`;

    // Generate Host Name: p-app-vm-01, x-os-vm-02
    const networkLower = this.naming.network.toLowerCase();
    this.form.hostName = `${networkLower}-${this.naming.install}-vm-${seq}`;
  }

  private loadServer(id: number): void {
    this.serverService.getById(id).subscribe({
      next: (server) => {
        this.form = {
          vmNumber: server.vmNumber,
          vmName: server.vmName,
          hostName: server.hostName,
          cpu: server.cpu,
          ram: server.ram,
          hdd: server.hdd,
          bucket: server.bucket,
          serverOs: server.serverOs,
          ipAddress: server.ipAddress,
          dockge: server.dockge,
          software1: server.software1,
          software1Ports: server.software1Ports,
          software1Link: server.software1Link,
          software2: server.software2,
          software2Ports: server.software2Ports,
          software2Link: server.software2Link,
          software3: server.software3,
          software3Ports: server.software3Ports,
          software3Link: server.software3Link,
          software4: server.software4,
          software4Ports: server.software4Ports,
          software4Link: server.software4Link,
          software5: server.software5,
          software5Ports: server.software5Ports,
          software5Link: server.software5Link,
          vlan: server.vlan,
          live: server.live,
          https: server.https,
          setup: server.setup,
        };

        // Extract last octet from IP
        const ipParts = server.ipAddress.split('.');
        if (ipParts.length === 4) {
          this.ipLastOctet = ipParts[3];
        }

        // Populate software entries array
        this.softwareEntries = [
          { name: server.software1, port: server.software1Ports, link: server.software1Link },
          { name: server.software2, port: server.software2Ports, link: server.software2Link },
          { name: server.software3, port: server.software3Ports, link: server.software3Link },
          { name: server.software4, port: server.software4Ports, link: server.software4Link },
          { name: server.software5, port: server.software5Ports, link: server.software5Link },
        ];

        this.loadingServers.set(false);
      },
    });
  }

  onIpChange(): void {
    // Build full IP from last octet
    if (this.ipLastOctet) {
      this.form.ipAddress = `192.168.1.${this.ipLastOctet}`;
    } else {
      this.form.ipAddress = '';
    }

    // Update all software links
    for (let i = 0; i < 5; i++) {
      this.updateSoftwareLink(i);
    }
  }

  updateSoftwareLink(index: number): void {
    const entry = this.softwareEntries[index];
    const ip = this.form.ipAddress || '';

    if (ip && entry.name) {
      entry.link = `http://${ip}:${entry.port || ''}`;
    } else {
      entry.link = '';
    }
  }

  private syncSoftwareToForm(): void {
    this.form.software1 = this.softwareEntries[0].name;
    this.form.software1Ports = this.softwareEntries[0].port;
    this.form.software1Link = this.softwareEntries[0].link;
    this.form.software2 = this.softwareEntries[1].name;
    this.form.software2Ports = this.softwareEntries[1].port;
    this.form.software2Link = this.softwareEntries[1].link;
    this.form.software3 = this.softwareEntries[2].name;
    this.form.software3Ports = this.softwareEntries[2].port;
    this.form.software3Link = this.softwareEntries[2].link;
    this.form.software4 = this.softwareEntries[3].name;
    this.form.software4Ports = this.softwareEntries[3].port;
    this.form.software4Link = this.softwareEntries[3].link;
    this.form.software5 = this.softwareEntries[4].name;
    this.form.software5Ports = this.softwareEntries[4].port;
    this.form.software5Link = this.softwareEntries[4].link;
  }

  onSubmit(): void {
    if (!this.form.vmNumber || !this.form.vmName || !this.form.ipAddress) return;

    // Sync software entries to form before submitting
    this.syncSoftwareToForm();

    this.saving.set(true);

    const request = this.isEdit()
      ? this.serverService.update(this.serverId()!, this.form)
      : this.serverService.create(this.form);

    request.subscribe({
      next: (server) => {
        this.saving.set(false);
        this.router.navigate(['/it-assets/servers', server.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  goBack(): void {
    if (this.isEdit() && this.serverId()) {
      this.router.navigate(['/it-assets/servers', this.serverId()]);
    } else {
      this.router.navigate(['/it-assets/servers']);
    }
  }
}
