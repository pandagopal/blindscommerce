/**
 * Role-based authentication redirect utilities
 * Automatically redirects users to appropriate dashboards based on their role
 */

import { UserRole, getDashboardRoute } from '@/lib/roleHierarchy';

export interface AuthUser {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

/**
 * Get the appropriate dashboard URL for a user's role
 */
export function getUserDashboardUrl(user: AuthUser): string {
  return getDashboardRoute(user.role);
}

/**
 * Redirect user to their appropriate dashboard
 */
export function redirectToUserDashboard(user: AuthUser): string {
  const dashboardUrl = getUserDashboardUrl(user);
  
  // Add welcome parameter for first-time login experience
  const url = new URL(dashboardUrl, window.location.origin);
  url.searchParams.set('welcome', 'true');
  
  return url.pathname + url.search;
}

/**
 * Check if user should be redirected from current path
 */
export function shouldRedirectFromPath(user: AuthUser, currentPath: string): boolean {
  const userDashboard = getDashboardRoute(user.role);
  
  // Don't redirect if already on their dashboard
  if (currentPath.startsWith(userDashboard)) {
    return false;
  }
  
  // Don't redirect from public pages
  const publicPaths = ['/', '/products', '/categories', '/about', '/contact'];
  if (publicPaths.includes(currentPath)) {
    return false;
  }
  
  // Don't redirect from shared pages
  const sharedPaths = ['/cart', '/checkout', '/account'];
  if (sharedPaths.some(path => currentPath.startsWith(path))) {
    return false;
  }
  
  // Redirect if trying to access other role dashboards
  const roleDashboards = ['/admin', '/vendor', '/sales', '/installer', '/shipping', '/super-admin'];
  return roleDashboards.some(dashboard => 
    currentPath.startsWith(dashboard) && !currentPath.startsWith(userDashboard)
  );
}

/**
 * Get appropriate redirect URL after login
 */
export function getPostLoginRedirect(user: AuthUser, intendedPath?: string): string {
  // If there was an intended path and user has access, go there
  if (intendedPath && hasAccessToPath(user, intendedPath)) {
    return intendedPath;
  }
  
  // Otherwise, go to user's dashboard
  return getUserDashboardUrl(user);
}

/**
 * Check if user has access to a specific path
 */
function hasAccessToPath(user: AuthUser, path: string): boolean {
  // Super admin has access to everything
  if (user.role === 'super_admin') {
    return true;
  }
  
  // Admin has access to admin and regular paths
  if (user.role === 'admin') {
    return !path.startsWith('/super-admin');
  }
  
  // Users can access their own dashboard and public pages
  const userDashboard = getDashboardRoute(user.role);
  const publicPaths = ['/', '/products', '/categories', '/about', '/contact', '/cart', '/checkout'];
  
  return (
    path.startsWith(userDashboard) ||
    path.startsWith('/account') ||
    publicPaths.some(publicPath => path.startsWith(publicPath))
  );
}

/**
 * Role-specific welcome messages
 */
export function getWelcomeMessage(user: AuthUser): string {
  switch (user.role) {
    case 'super_admin':
      return `Welcome, ${user.firstName}! You have complete system control.`;
    case 'admin':
      return `Welcome, ${user.firstName}! Ready to manage the platform?`;
    case 'vendor':
      return `Welcome back, ${user.firstName}! Let's grow your business.`;
    case 'sales':
      return `Welcome, ${user.firstName}! Ready to make some sales?`;
    case 'installer':
      return `Welcome, ${user.firstName}! You have new installation jobs waiting.`;
    case 'shipping_agent':
      return `Welcome, ${user.firstName}! Manage your shipping assignments and deliveries.`;
    case 'customer':
    default:
      return `Welcome back, ${user.firstName}! Find the perfect window treatments.`;
  }
}

/**
 * Get role-specific navigation items
 */
export function getRoleNavigation(role: UserRole) {
  const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' }
  ];

  switch (role) {
    case 'super_admin':
      return [
        ...baseNavigation,
        { name: 'Super Admin', href: '/super-admin' },
        { name: 'Admin Panel', href: '/admin' }
      ];
    case 'admin':
      return [
        ...baseNavigation,
        { name: 'Admin Panel', href: '/admin' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Analytics', href: '/admin/analytics' }
      ];
    case 'vendor':
      return [
        ...baseNavigation,
        { name: 'Vendor Dashboard', href: '/vendor' },
        { name: 'Products', href: '/vendor/products' },
        { name: 'Orders', href: '/vendor/orders' },
        { name: 'Sales Team', href: '/vendor/sales-team' }
      ];
    case 'sales':
      return [
        ...baseNavigation,
        { name: 'Sales Dashboard', href: '/sales' },
        { name: 'Leads', href: '/sales/leads' },
        { name: 'Orders', href: '/sales/orders' }
      ];
    case 'installer':
      return [
        ...baseNavigation,
        { name: 'Installer Dashboard', href: '/installer' },
        { name: 'Jobs', href: '/installer/jobs' },
        { name: 'Schedule', href: '/installer/appointments' }
      ];
    case 'shipping_agent':
      return [
        ...baseNavigation,
        { name: 'Shipping Dashboard', href: '/shipping' },
        { name: 'Active Shipments', href: '/shipping/active' },
        { name: 'Delivery Schedule', href: '/shipping/schedule' }
      ];
    case 'customer':
    default:
      return [
        ...baseNavigation,
        { name: 'My Account', href: '/account' },
        { name: 'Orders', href: '/account/orders' },
        { name: 'Wishlist', href: '/account/wishlist' }
      ];
  }
}