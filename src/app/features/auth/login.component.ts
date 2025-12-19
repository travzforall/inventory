import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services';

interface TestUser {
  label: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>

          <h2 class="card-title justify-center">Homely Inventory</h2>
          <p class="text-center text-base-content/70 mb-4">Sign in to your account</p>

          <!-- Test User Dropdown -->
          <div class="form-control w-full mb-4">
            <label class="label">
              <span class="label-text text-xs text-base-content/50">Quick Login (Dev)</span>
            </label>
            <select
              class="select select-bordered select-sm w-full"
              (change)="selectTestUser($event)"
            >
              @for (user of testUsers; track user.email) {
                <option [value]="user.email">{{ user.label }}</option>
              }
            </select>
          </div>

          @if (error()) {
            <div class="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ error() }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                class="input input-bordered w-full"
                [(ngModel)]="email"
                name="email"
                required
                [disabled]="loading()"
              />
            </div>

            <div class="form-control w-full mt-4">
              <label class="label">
                <span class="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                class="input input-bordered w-full"
                [(ngModel)]="password"
                name="password"
                required
                [disabled]="loading()"
              />
            </div>

            <div class="form-control mt-6">
              <button
                type="submit"
                class="btn btn-primary w-full"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Signing in...
                } @else {
                  Sign In
                }
              </button>
            </div>
          </form>

          @if (pendingScan()) {
            <div class="alert alert-info mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sign in to continue with your NFC scan</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  testUsers: TestUser[] = [
    { label: 'Admin - admin@homely.local', email: 'admin@homely.local', password: 'admin123' },
    { label: 'Manager - manager@homely.local', email: 'manager@homely.local', password: 'manager123' },
    { label: 'Staff - staff@homely.local', email: 'staff@homely.local', password: 'staff123' },
    { label: 'Viewer - viewer@homely.local', email: 'viewer@homely.local', password: 'viewer123' },
  ];

  email = this.testUsers[0].email;
  password = this.testUsers[0].password;
  loading = signal(false);
  error = signal<string | null>(null);
  pendingScan = signal<string | null>(this.authService.getPendingScan());

  selectTestUser(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const user = this.testUsers.find((u) => u.email === select.value);
    if (user) {
      this.email = user.email;
      this.password = user.password;
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.error.set('Invalid email or password');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('An error occurred. Please try again.');
        console.error('Login error:', err);
      },
    });
  }
}
