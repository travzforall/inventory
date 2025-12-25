import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServerService } from '../../core/services';
import { Server } from '../../core/models';

@Component({
  selector: 'app-server-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="flex-1">
          <a routerLink="/it-assets" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 class="text-xl font-bold ml-2">Servers</h1>
        </div>
        <div class="flex-none">
          <a routerLink="/it-assets/servers/add" class="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Server
          </a>
        </div>
      </div>

      <div class="container mx-auto p-4 max-w-7xl">
        <!-- Search and Filters -->
        <div class="card bg-base-100 shadow mb-4">
          <div class="card-body py-3">
            <div class="flex flex-wrap gap-4 items-center">
              <div class="form-control flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search servers..."
                  class="input input-bordered input-sm w-full"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="filterServers()"
                />
              </div>
              <div class="flex gap-2">
                <select class="select select-bordered select-sm" [(ngModel)]="filterStatus" (ngModelChange)="filterServers()">
                  <option value="">All Status</option>
                  <option value="live">Live</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        } @else if (filteredServers().length === 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
              <h2 class="text-xl font-bold mt-4">No servers found</h2>
              <p class="text-base-content/60">
                @if (searchQuery || filterStatus) {
                  Try adjusting your filters
                } @else {
                  Add your first server to get started
                }
              </p>
            </div>
          </div>
        } @else {
          <div class="card bg-base-100 shadow-xl">
            <div class="overflow-x-auto">
              <table class="table table-xs">
                <thead>
                  <tr>
                    <th>VM#</th>
                    <th>VM Name</th>
                    <th>Host Name</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>HDD</th>
                    <th>Bucket</th>
                    <th>OS</th>
                    <th>IP Address</th>
                    <th>Dockge</th>
                    <th>Software</th>
                    <th>VLAN</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (server of filteredServers(); track server.id) {
                    <tr class="hover">
                      <td class="font-mono">{{ server.vmNumber }}</td>
                      <td class="font-bold">{{ server.vmName }}</td>
                      <td class="text-sm">{{ server.hostName || '-' }}</td>
                      <td class="text-sm">{{ server.cpu || '-' }}</td>
                      <td class="text-sm">{{ server.ram || '-' }}</td>
                      <td class="text-sm">{{ server.hdd || '-' }}</td>
                      <td class="text-sm">{{ server.bucket || '-' }}</td>
                      <td class="text-sm">{{ server.serverOs || '-' }}</td>
                      <td class="font-mono text-sm">{{ server.ipAddress || '-' }}</td>
                      <td class="text-sm">{{ server.dockge || '-' }}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          @if (server.software1) {
                            <a
                              [href]="server.software1Link"
                              target="_blank"
                              class="badge badge-primary badge-sm cursor-pointer"
                              [title]="server.software1Link"
                            >
                              {{ server.software1 }}
                              @if (server.software1Ports) {
                                :{{ server.software1Ports }}
                              }
                            </a>
                          }
                          @if (server.software2) {
                            <a
                              [href]="server.software2Link"
                              target="_blank"
                              class="badge badge-secondary badge-sm cursor-pointer"
                              [title]="server.software2Link"
                            >
                              {{ server.software2 }}
                              @if (server.software2Ports) {
                                :{{ server.software2Ports }}
                              }
                            </a>
                          }
                          @if (server.software3) {
                            <a
                              [href]="server.software3Link"
                              target="_blank"
                              class="badge badge-accent badge-sm cursor-pointer"
                              [title]="server.software3Link"
                            >
                              {{ server.software3 }}
                              @if (server.software3Ports) {
                                :{{ server.software3Ports }}
                              }
                            </a>
                          }
                          @if (server.software4) {
                            <a
                              [href]="server.software4Link"
                              target="_blank"
                              class="badge badge-info badge-sm cursor-pointer"
                              [title]="server.software4Link"
                            >
                              {{ server.software4 }}
                              @if (server.software4Ports) {
                                :{{ server.software4Ports }}
                              }
                            </a>
                          }
                          @if (server.software5) {
                            <a
                              [href]="server.software5Link"
                              target="_blank"
                              class="badge badge-warning badge-sm cursor-pointer"
                              [title]="server.software5Link"
                            >
                              {{ server.software5 }}
                              @if (server.software5Ports) {
                                :{{ server.software5Ports }}
                              }
                            </a>
                          }
                        </div>
                      </td>
                      <td>{{ server.vlan }}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          @if (server.live) {
                            <span class="badge badge-success badge-xs">Live</span>
                          }
                          @if (server.https) {
                            <span class="badge badge-info badge-xs">HTTPS</span>
                          }
                          @if (server.setup) {
                            <span class="badge badge-primary badge-xs">Setup</span>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <a [routerLink]="['/it-assets/servers', server.id]" class="btn btn-ghost btn-xs">
                            View
                          </a>
                          <a [routerLink]="['/it-assets/servers', server.id, 'edit']" class="btn btn-ghost btn-xs">
                            Edit
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ServerListComponent implements OnInit {
  private serverService = inject(ServerService);

  loading = signal(true);
  servers = signal<Server[]>([]);
  filteredServers = signal<Server[]>([]);

  searchQuery = '';
  filterStatus = '';

  ngOnInit(): void {
    this.loadServers();
  }

  private loadServers(): void {
    this.serverService.getAll().subscribe({
      next: (servers) => {
        this.servers.set(servers);
        this.filteredServers.set(servers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterServers(): void {
    let result = this.servers();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.vmName.toLowerCase().includes(query) ||
          s.hostName.toLowerCase().includes(query) ||
          s.ipAddress.includes(query) ||
          s.serverOs.toLowerCase().includes(query) ||
          s.software1.toLowerCase().includes(query) ||
          s.software2.toLowerCase().includes(query) ||
          s.software3.toLowerCase().includes(query)
      );
    }

    if (this.filterStatus) {
      switch (this.filterStatus) {
        case 'live':
          result = result.filter((s) => s.live);
          break;
        case 'offline':
          result = result.filter((s) => !s.live);
          break;
      }
    }

    this.filteredServers.set(result);
  }
}
