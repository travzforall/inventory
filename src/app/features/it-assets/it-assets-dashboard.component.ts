import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServerService, SoftwareService } from '../../core/services';
import { Server, Software } from '../../core/models';

interface DashboardStats {
  totalServers: number;
  liveServers: number;
  pendingSetupServers: number;
  totalSoftware: number;
  completedSoftware: number;
  pendingSoftware: number;
}

@Component({
  selector: 'app-it-assets-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/dashboard" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">IT Assets</h1>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-6xl">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else {
          <!-- Stats Overview -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Total Servers</div>
              <div class="stat-value text-2xl text-primary">{{ stats().totalServers }}</div>
            </div>
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Live</div>
              <div class="stat-value text-2xl text-success">{{ stats().liveServers }}</div>
            </div>
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Pending Setup</div>
              <div class="stat-value text-2xl text-warning">{{ stats().pendingSetupServers }}</div>
            </div>
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Total Software</div>
              <div class="stat-value text-2xl text-primary">{{ stats().totalSoftware }}</div>
            </div>
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Completed</div>
              <div class="stat-value text-2xl text-success">{{ stats().completedSoftware }}</div>
            </div>
            <div class="stat bg-base-100 rounded-box shadow">
              <div class="stat-title text-xs">Pending Setup</div>
              <div class="stat-value text-2xl text-warning">{{ stats().pendingSoftware }}</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <a routerLink="/it-assets/servers" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
              <div class="card-body">
                <div class="flex items-center gap-4">
                  <div class="bg-primary/10 p-4 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Servers</h2>
                    <p class="text-base-content/60">Manage VMs and physical servers</p>
                  </div>
                </div>
              </div>
            </a>
            <a routerLink="/it-assets/software" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
              <div class="card-body">
                <div class="flex items-center gap-4">
                  <div class="bg-secondary/10 p-4 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Software</h2>
                    <p class="text-base-content/60">Track installed applications</p>
                  </div>
                </div>
              </div>
            </a>
          </div>

          <!-- Recent/Incomplete Items -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Pending Setup Servers -->
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Pending Setup Servers
                </h2>
                @if (pendingSetupServers().length === 0) {
                  <p class="text-base-content/60 py-4">All servers are set up!</p>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>VM</th>
                          <th>Name</th>
                          <th>IP</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (server of pendingSetupServers(); track server.id) {
                          <tr class="hover cursor-pointer" [routerLink]="['/it-assets/servers', server.id]">
                            <td>{{ server.vmNumber }}</td>
                            <td>{{ server.vmName }}</td>
                            <td class="font-mono text-xs">{{ server.ipAddress }}</td>
                            <td>
                              @if (server.live) {
                                <span class="badge badge-success badge-xs">Live</span>
                              } @else {
                                <span class="badge badge-ghost badge-xs">Offline</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <!-- Pending Software Setup -->
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Software Setup
                </h2>
                @if (pendingSoftware().length === 0) {
                  <p class="text-base-content/60 py-4">All software is set up!</p>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Instance</th>
                          <th>Class</th>
                          <th>IP:Port</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (sw of pendingSoftware(); track sw.id) {
                          <tr class="hover cursor-pointer" [routerLink]="['/it-assets/software', sw.id]">
                            <td>{{ sw.instance }}</td>
                            <td>
                              <span class="badge badge-outline badge-sm">{{ sw.class }}</span>
                            </td>
                            <td class="font-mono text-xs">{{ sw.ipAddress }}:{{ sw.port }}</td>
                            <td>
                              @if (sw.setup) {
                                <span class="badge badge-info badge-xs">Setup</span>
                              } @else {
                                <span class="badge badge-warning badge-xs">Pending</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Server Overview Table -->
          <div class="card bg-base-100 shadow-xl mt-6">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title">Server Overview</h2>
                <a routerLink="/it-assets/servers/add" class="btn btn-primary btn-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Server
                </a>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>VM#</th>
                      <th>Name</th>
                      <th>Host</th>
                      <th>CPU</th>
                      <th>RAM</th>
                      <th>HDD</th>
                      <th>OS</th>
                      <th>IP</th>
                      <th>VLAN</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (server of servers(); track server.id) {
                      <tr class="hover cursor-pointer" [routerLink]="['/it-assets/servers', server.id]">
                        <td>{{ server.vmNumber }}</td>
                        <td class="font-medium">{{ server.vmName }}</td>
                        <td class="text-xs">{{ server.hostName }}</td>
                        <td>{{ server.cpu }}</td>
                        <td>{{ server.ram }}</td>
                        <td>{{ server.hdd }}</td>
                        <td class="text-xs">{{ server.serverOs }}</td>
                        <td class="font-mono text-xs">{{ server.ipAddress }}</td>
                        <td>{{ server.vlan }}</td>
                        <td>
                          <div class="flex gap-1">
                            @if (server.live) {
                              <span class="badge badge-success badge-xs">Live</span>
                            }
                            @if (server.https) {
                              <span class="badge badge-info badge-xs">HTTPS</span>
                            }
                            @if (server.dockge) {
                              <span class="badge badge-secondary badge-xs">Dockge</span>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ItAssetsDashboardComponent implements OnInit {
  private serverService = inject(ServerService);
  private softwareService = inject(SoftwareService);

  loading = signal(true);
  servers = signal<Server[]>([]);
  software = signal<Software[]>([]);
  pendingSetupServers = signal<Server[]>([]);
  pendingSoftware = signal<Software[]>([]);
  stats = signal<DashboardStats>({
    totalServers: 0,
    liveServers: 0,
    pendingSetupServers: 0,
    totalSoftware: 0,
    completedSoftware: 0,
    pendingSoftware: 0,
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.serverService.getAll().subscribe({
      next: (servers) => {
        this.servers.set(servers);
        this.pendingSetupServers.set(servers.filter((s) => !s.setup));
        this.updateStats();
      },
    });

    this.softwareService.getAll().subscribe({
      next: (software) => {
        this.software.set(software);
        this.pendingSoftware.set(software.filter((s) => !s.done));
        this.updateStats();
        this.loading.set(false);
      },
    });
  }

  private updateStats(): void {
    const servers = this.servers();
    const software = this.software();

    this.stats.set({
      totalServers: servers.length,
      liveServers: servers.filter((s) => s.live).length,
      pendingSetupServers: servers.filter((s) => !s.setup).length,
      totalSoftware: software.length,
      completedSoftware: software.filter((s) => s.done).length,
      pendingSoftware: software.filter((s) => !s.done).length,
    });
  }
}
