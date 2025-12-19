import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { BaserowService } from './baserow.service';
import { User, AuthUser, LoginCredentials, UserPermissions, getUserPermissions } from '../models';
import { environment } from '../../../environments/environment';

const AUTH_STORAGE_KEY = 'homely_auth_user';
const PENDING_SCAN_KEY = 'homely_pending_scan';

interface BaserowUser {
  id: number;
  // Field names (when user_field_names=true)
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean | string;
  password_hash?: string;
  created_at?: string;
  last_login_at?: string | null;
  // Field IDs (fallback)
  field_5572?: string; // email
  field_5573?: string; // name
  field_5574?: string; // role
  field_5575?: string; // is_active
  field_5576?: string; // password_hash
  field_5577?: string; // created_at
  field_5578?: string; // last_login_at
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baserow = inject(BaserowService);
  private router = inject(Router);
  private readonly tableId = environment.baserow.tables.users;

  private currentUserSignal = signal<AuthUser | null>(this.loadStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly permissions = computed(() => {
    const user = this.currentUserSignal();
    return user ? getUserPermissions(user.role) : null;
  });

  private loadStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveUser(user: AuthUser): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private mapFromBaserow(row: BaserowUser): User {
    // Handle both field names and field IDs
    const email = row.email ?? row.field_5572 ?? '';
    const name = row.name ?? row.field_5573 ?? '';
    const role = row.role ?? row.field_5574 ?? 'viewer';
    const isActiveVal = row.is_active ?? row.field_5575;
    const isActive = String(isActiveVal).toLowerCase() === 'true' || isActiveVal === true;
    const createdAt = row.created_at ?? row.field_5577 ?? '';
    const lastLoginAt = row.last_login_at ?? row.field_5578 ?? null;

    return {
      id: row.id,
      email,
      name,
      role: role as User['role'],
      isActive,
      createdAt,
      lastLoginAt: lastLoginAt === 'None' ? null : lastLoginAt,
    };
  }

  login(credentials: LoginCredentials): Observable<AuthUser | null> {
    return this.baserow
      .getAll<BaserowUser>(this.tableId, {
        filters: [{ field: 'email', type: 'equal', value: credentials.email }],
        size: 1,
      })
      .pipe(
        map((res) => res.results[0]),
        map((row) => {
          if (!row) {
            throw new Error('User not found');
          }
          console.log('User row from Baserow:', row); // Debug log
          // Check is_active - handle boolean, string (True/true), or missing field
          // Baserow returns "True" as string when user_field_names isn't applied
          const isActiveValue = (row as any).is_active ?? (row as any).field_5575;
          const isActive = isActiveValue === true ||
                          String(isActiveValue).toLowerCase() === 'true' ||
                          isActiveValue === undefined;
          if (!isActive) {
            throw new Error('User account is disabled');
          }
          const user = this.mapFromBaserow(row);
          const authUser: AuthUser = {
            ...user,
            token: btoa(`${user.id}:${Date.now()}`), // Simple token for demo
          };
          this.saveUser(authUser);
          return authUser;
        }),
        tap(() => {
          // Check for pending scan to resume
          const pendingScan = this.getPendingScan();
          if (pendingScan) {
            this.clearPendingScan();
            this.router.navigate(['/scan', pendingScan]);
          }
        }),
        catchError((err) => {
          console.error('Login error:', err);
          return of(null);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permission: keyof UserPermissions): boolean {
    const perms = this.permissions();
    return perms ? perms[permission] : false;
  }

  // Pending scan management for auth flow
  setPendingScan(tagId: string): void {
    sessionStorage.setItem(PENDING_SCAN_KEY, tagId);
  }

  getPendingScan(): string | null {
    return sessionStorage.getItem(PENDING_SCAN_KEY);
  }

  clearPendingScan(): void {
    sessionStorage.removeItem(PENDING_SCAN_KEY);
  }

  // Get current user ID for scan events
  getCurrentUserId(): number | null {
    return this.currentUserSignal()?.id ?? null;
  }
}
