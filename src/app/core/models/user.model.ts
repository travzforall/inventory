export type UserRole = 'viewer' | 'inventory_staff' | 'manager' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserPermissions {
  canAdjustQuantity: boolean;
  canCreateLocation: boolean;
  canAssignNfcTag: boolean;
  canViewScanLogs: boolean;
  canManageUsers: boolean;
}

export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canAdjustQuantity: true,
        canCreateLocation: true,
        canAssignNfcTag: true,
        canViewScanLogs: true,
        canManageUsers: true,
      };
    case 'manager':
      return {
        canAdjustQuantity: true,
        canCreateLocation: true,
        canAssignNfcTag: true,
        canViewScanLogs: true,
        canManageUsers: false,
      };
    case 'inventory_staff':
      return {
        canAdjustQuantity: true,
        canCreateLocation: false,
        canAssignNfcTag: false,
        canViewScanLogs: false,
        canManageUsers: false,
      };
    case 'viewer':
    default:
      return {
        canAdjustQuantity: false,
        canCreateLocation: false,
        canAssignNfcTag: false,
        canViewScanLogs: false,
        canManageUsers: false,
      };
  }
}
