// Client-side auth utilities
export interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  role?: string;
}

// Get current user from API endpoint
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if a user has a specific role
export function hasRole(user: User | null, requiredRole: string | string[]): boolean {
  if (!user) return false;

  // Admin has access to everything
  if (user.isAdmin) return true;

  // Handle string array of roles (any of these roles is acceptable)
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role || '');
  }

  // Check if user has the specific role
  return user.role === requiredRole;
}