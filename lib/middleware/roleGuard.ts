/**
 * Role-based access control middleware
 * Enforces role hierarchy and permissions throughout the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  UserRole, 
  isAuthorizedForRoute, 
  hasPermission,
  getDashboardRoute,
  ROLE_HIERARCHY 
} from '@/lib/roleHierarchy';

export interface RoleGuardOptions {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  redirectOnFail?: string;
  allowSelfAccess?: boolean; // For routes like /account/[userId]
}

/**
 * Role-based route protection middleware
 */
export async function roleGuard(
  request: NextRequest,
  options: RoleGuardOptions = {}
): Promise<NextResponse | null> {
  try {
    const user = await getCurrentUser();
    
    // Check if user is authenticated
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = user.role as UserRole;
    const pathname = request.nextUrl.pathname;

    // Check route-based authorization
    if (!isAuthorizedForRoute(userRole, pathname)) {
      return createUnauthorizedResponse(request, userRole, options.redirectOnFail);
    }

    // Check specific role requirements
    if (options.requiredRole) {
      const requiredRoles = Array.isArray(options.requiredRole) 
        ? options.requiredRole 
        : [options.requiredRole];
      
      if (!requiredRoles.includes(userRole)) {
        return createUnauthorizedResponse(request, userRole, options.redirectOnFail);
      }
    }

    // Check permission requirements
    if (options.requiredPermission) {
      const requiredPermissions = Array.isArray(options.requiredPermission)
        ? options.requiredPermission
        : [options.requiredPermission];
      
      const hasRequiredPermissions = requiredPermissions.every(
        permission => hasPermission(userRole, permission)
      );

      if (!hasRequiredPermissions) {
        return createUnauthorizedResponse(request, userRole, options.redirectOnFail);
      }
    }

    // Check self-access for user-specific routes
    if (options.allowSelfAccess) {
      const pathUserId = extractUserIdFromPath(pathname);
      if (pathUserId && pathUserId !== user.userId.toString()) {
        // Only allow if user has management permissions for the target user's role
        const targetUser = await getUserById(pathUserId);
        if (targetUser && !canManageUser(userRole, targetUser.role as UserRole)) {
          return createUnauthorizedResponse(request, userRole, options.redirectOnFail);
        }
      }
    }

    return null; // Allow access
  } catch (error) {
    console.error('Role guard error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

/**
 * Create unauthorized response with appropriate redirect
 */
function createUnauthorizedResponse(
  request: NextRequest, 
  userRole: UserRole, 
  customRedirect?: string
): NextResponse {
  if (customRedirect) {
    return NextResponse.redirect(new URL(customRedirect, request.url));
  }

  // Redirect to appropriate dashboard
  const dashboardRoute = getDashboardRoute(userRole);
  const redirectUrl = new URL(dashboardRoute, request.url);
  redirectUrl.searchParams.set('error', 'unauthorized');
  
  return NextResponse.redirect(redirectUrl);
}

/**
 * Extract user ID from URL path (e.g., /account/123 -> "123")
 */
function extractUserIdFromPath(pathname: string): string | null {
  const matches = pathname.match(/\/(\d+)(?:\/|$)/);
  return matches ? matches[1] : null;
}

/**
 * Check if a user can manage another user based on roles
 */
function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const manager = ROLE_HIERARCHY[managerRole];
  return manager.canManage.includes(targetRole) || 
         hasPermission(managerRole, 'system.all');
}

/**
 * Mock function - replace with actual user lookup
 */
async function getUserById(userId: string): Promise<{ role: string } | null> {
  // TODO: Implement actual user lookup from database
  return null;
}

/**
 * API route protection decorator
 */
export function protectApiRoute(options: RoleGuardOptions = {}) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const guardResult = await roleGuard(req, options);
      
      if (guardResult) {
        // Return JSON error for API routes
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        );
      }

      return handler(req);
    };
  };
}

/**
 * Component-level role check hook (for client components)
 */
export interface UseRoleAuthResult {
  isAuthorized: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
}

/**
 * Permission check utilities for components
 */
export const roleUtils = {
  /**
   * Check if current user can create a specific role
   */
  canCreateRole: (currentRole: UserRole, targetRole: UserRole): boolean => {
    return ROLE_HIERARCHY[currentRole].canCreate.includes(targetRole);
  },

  /**
   * Get roles that current user can create
   */
  getCreatableRoles: (currentRole: UserRole): UserRole[] => {
    return ROLE_HIERARCHY[currentRole].canCreate;
  },

  /**
   * Check if current user has specific permission
   */
  hasPermission: (currentRole: UserRole, permission: string): boolean => {
    return hasPermission(currentRole, permission);
  },

  /**
   * Get display name for role
   */
  getRoleDisplayName: (role: UserRole): string => {
    return ROLE_HIERARCHY[role].displayName;
  },

  /**
   * Get role description
   */
  getRoleDescription: (role: UserRole): string => {
    return ROLE_HIERARCHY[role].description;
  }
};

/**
 * Registration validation
 */
export function validateRegistrationRole(
  requestedRole: string, 
  creatorRole?: UserRole
): { isValid: boolean; error?: string } {
  // Public registration only allows customer role
  if (!creatorRole) {
    if (requestedRole !== 'customer') {
      return {
        isValid: false,
        error: 'Public registration is only available for customer accounts. Contact admin for business accounts.'
      };
    }
    return { isValid: true };
  }

  // Check if creator can create the requested role
  if (!ROLE_HIERARCHY[creatorRole].canCreate.includes(requestedRole as UserRole)) {
    return {
      isValid: false,
      error: `You do not have permission to create ${requestedRole} accounts.`
    };
  }

  return { isValid: true };
}