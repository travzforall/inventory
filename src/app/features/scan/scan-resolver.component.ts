import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NfcTagService, LocationService, ScanEventService, AuthService } from '../../core/services';
import { NfcTag } from '../../core/models';

type ResolveState = 'loading' | 'resolved' | 'error' | 'unknown' | 'disabled';

@Component({
  selector: 'app-scan-resolver',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          @switch (state()) {
            @case ('loading') {
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <h2 class="card-title mt-4">Resolving Tag...</h2>
              <p class="text-base-content/70">Please wait while we process your scan</p>
            }
            @case ('error') {
              <div class="text-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="card-title mt-4">Error</h2>
              <p class="text-base-content/70">{{ errorMessage() }}</p>
              <div class="card-actions mt-4">
                <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
              </div>
            }
            @case ('unknown') {
              <div class="text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="card-title mt-4">Unknown Tag</h2>
              <p class="text-base-content/70">This NFC tag is not registered in the system</p>
              <p class="text-sm text-base-content/50 mt-2">Tag ID: {{ tagId() }}</p>
              <div class="card-actions mt-4">
                <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
                @if (canRegister()) {
                  <button class="btn btn-outline" (click)="registerTag()">Register Tag</button>
                }
              </div>
            }
            @case ('disabled') {
              <div class="text-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 class="card-title mt-4">Tag Disabled</h2>
              <p class="text-base-content/70">This NFC tag has been disabled</p>
              <div class="card-actions mt-4">
                <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ScanResolverComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nfcTagService = inject(NfcTagService);
  private locationService = inject(LocationService);
  private scanEventService = inject(ScanEventService);
  private authService = inject(AuthService);

  state = signal<ResolveState>('loading');
  tagId = signal<string>('');
  errorMessage = signal<string>('');

  canRegister = () => this.authService.hasPermission('canAssignNfcTag');

  ngOnInit(): void {
    const tagIdParam = this.route.snapshot.params['tagId'];
    this.tagId.set(tagIdParam);

    if (!tagIdParam) {
      this.state.set('error');
      this.errorMessage.set('No tag ID provided');
      return;
    }

    this.resolveTag(tagIdParam);
  }

  private resolveTag(tagId: string): void {
    this.nfcTagService.getByUid(tagId).subscribe({
      next: (tag) => {
        if (!tag) {
          this.state.set('unknown');
          return;
        }

        if (tag.status === 'disabled' || tag.status === 'lost') {
          this.state.set('disabled');
          return;
        }

        // Log the scan event
        this.logScan(tag);

        // Route based on tag type
        this.routeByTagType(tag);
      },
      error: (err) => {
        console.error('Error resolving tag:', err);
        this.state.set('error');
        this.errorMessage.set('Failed to resolve tag. Please try again.');
      },
    });
  }

  private logScan(tag: NfcTag): void {
    const deviceType = this.detectDeviceType();
    this.scanEventService
      .logScan(tag.id, deviceType, this.authService.getCurrentUserId() ?? undefined)
      .subscribe({
        error: (err) => console.error('Failed to log scan:', err),
      });
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Mobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  private routeByTagType(tag: NfcTag): void {
    switch (tag.tagType) {
      case 'location':
        if (tag.linkedEntityId) {
          this.router.navigate(['/locations', tag.linkedEntityId]);
        } else {
          this.state.set('error');
          this.errorMessage.set('Location tag is not linked to a location');
        }
        break;

      case 'item':
        if (tag.linkedEntityId) {
          this.router.navigate(['/items', tag.linkedEntityId]);
        } else {
          this.state.set('error');
          this.errorMessage.set('Item tag is not linked to an item');
        }
        break;

      case 'action':
        // Future: route to workflow view
        this.router.navigate(['/workflows', tag.linkedEntityId || 'default']);
        break;

      default:
        this.state.set('error');
        this.errorMessage.set('Unknown tag type');
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  registerTag(): void {
    this.router.navigate(['/admin/tags/new'], {
      queryParams: { tagUid: this.tagId() },
    });
  }
}
