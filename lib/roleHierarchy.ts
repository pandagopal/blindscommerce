/**
 * Role Hierarchy and Access Control System
 * Defines the complete role structure for the blinds e-commerce platform
 */

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'vendor'
  | 'sales'
  | 'installer'
  | 'customer'
  | 'shipping_agent';

export interface RoleDefinition {
  name: UserRole;
  displayName: string;
  description: string;
  level: number; // Higher level = more permissions
  canCreate: UserRole[];
  canManage: UserRole[];
  permissions: string[];
  createdBy: UserRole[];
}

/**
 * Complete role hierarchy definition
 * Based on Amazon-competitive e-commerce structure
 */
export const ROLE_HIERARCHY: Record<UserRole, RoleDefinition> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Platform owner with full system access',
    level: 100,
    canCreate: ['admin', 'vendor', 'installer', 'customer', 'shipping_agent'],
    canManage: ['admin', 'vendor', 'installer', 'customer', 'shipping_agent', 'sales'],
    permissions: [
      'system.all',
      'user.create.all',
      'user.manage.all',
      'vendor.approve',
      'vendor.suspend',
      'financial.all',
      'analytics.all',
      'settings.system'
    ],
    createdBy: ['super_admin'] // Self-created or system
  },

  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Platform administrator with broad access',
    level: 90,
    canCreate: ['vendor', 'installer', 'shipping_agent'],
    canManage: ['vendor', 'installer', 'customer', 'shipping_agent'],
    permissions: [
      'user.create.vendor',
      'user.create.installer',
      'user.create.trade',
      'user.manage.vendor',
      'user.manage.installer',
      'user.manage.customer',
      'vendor.approve',
      'vendor.suspend',
      'orders.manage.all',
      'products.manage.all',
      'analytics.view',
      'support.all'
    ],
    createdBy: ['super_admin', 'admin']
  },

  vendor: {
    name: 'vendor',
    displayName: 'Vendor',
    description: 'Business partner selling products on the platform',
    level: 70,
    canCreate: ['sales'],
    canManage: ['sales'],
    permissions: [
      'user.create.sales',
      'user.manage.sales',
      'products.manage.own',
      'orders.view.own',
      'orders.fulfill.own',
      'analytics.view.own',
      'storefront.manage',
      'inventory.manage.own',
      'pricing.manage.own',
      'promotions.create.own'
    ],
    createdBy: ['super_admin', 'admin']
  },

  sales: {
    name: 'sales',
    displayName: 'Sales Representative',
    description: 'Sales team member working for a vendor',
    level: 50,
    canCreate: [],
    canManage: [],
    permissions: [
      'orders.create',
      'orders.view.assigned',
      'customers.contact',
      'quotes.create',
      'quotes.manage.own',
      'commission.view.own',
      'leads.manage.assigned'
    ],
    createdBy: ['vendor']
  },

  installer: {
    name: 'installer',
    displayName: 'Installer',
    description: 'Professional installer for window treatments',
    level: 60,
    canCreate: [],
    canManage: [],
    permissions: [
      'installations.view.assigned',
      'installations.update.status',
      'measurements.create',
      'work_orders.view.assigned',
      'schedule.manage.own',
      'customers.contact.assigned'
    ],
    createdBy: ['super_admin', 'admin']
  },

  shipping_agent: {
    name: 'shipping_agent',
    displayName: 'Shipping Agent',
    description: 'Professional shipping and logistics agent for order fulfillment',
    level: 40,
    canCreate: [],
    canManage: [],
    permissions: [
      'orders.view.assigned',
      'orders.update.shipping',
      'shipments.create',
      'shipments.track',
      'shipments.update.status',
      'delivery.manage',
      'logistics.coordinate'
    ],
    createdBy: ['super_admin', 'admin']
  },

  customer: {
    name: 'customer',
    displayName: 'Customer',
    description: 'Regular consumer purchasing window treatments',
    level: 10,
    canCreate: [],
    canManage: [],
    permissions: [
      'orders.create.own',
      'orders.view.own',
      'products.view.public',
      'account.manage.own',
      'wishlist.manage.own',
      'reviews.create',
      'support.contact'
    ],
    createdBy: ['customer'] // Self-registration only
  }
};

/**
 * Check if a role can create another role
 */
export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  const creator = ROLE_HIERARCHY[creatorRole];
  return creator.canCreate.includes(targetRole);
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  const manager = ROLE_HIERARCHY[managerRole];
  return manager.canManage.includes(targetRole);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const role = ROLE_HIERARCHY[userRole];
  return role.permissions.includes(permission) || role.permissions.includes('system.all');
}

/**
 * Get roles that can create a specific role
 */
export function getCreatorsForRole(targetRole: UserRole): UserRole[] {
  return Object.values(ROLE_HIERARCHY)
    .filter(role => role.canCreate.includes(targetRole))
    .map(role => role.name);
}

/**
 * Get all roles that a specific role can create
 */
export function getCreatableRoles(creatorRole: UserRole): UserRole[] {
  return ROLE_HIERARCHY[creatorRole].canCreate;
}

/**
 * Get role hierarchy level for comparison
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role].level;
}

/**
 * Check if role A has higher privilege than role B
 */
export function hasHigherPrivilege(roleA: UserRole, roleB: UserRole): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

/**
 * Get available roles for role selection in forms
 * Filters based on what the current user can create
 */
export function getAvailableRolesForUser(currentUserRole: UserRole): RoleDefinition[] {
  const creatableRoles = getCreatableRoles(currentUserRole);
  return creatableRoles.map(role => ROLE_HIERARCHY[role]);
}

/**
 * Role-based route protection
 */
export function isAuthorizedForRoute(userRole: UserRole, route: string): boolean {
  // Admin routes
  if (route.startsWith('/admin')) {
    return hasPermission(userRole, 'system.all') || 
           ['super_admin', 'admin'].includes(userRole);
  }

  // Vendor routes
  if (route.startsWith('/vendor')) {
    return ['vendor'].includes(userRole);
  }

  // Sales routes
  if (route.startsWith('/sales')) {
    return ['sales'].includes(userRole);
  }

  // Installer routes
  if (route.startsWith('/installer')) {
    return ['installer'].includes(userRole);
  }

  // Shipping agent routes
  if (route.startsWith('/shipping')) {
    return ['shipping_agent'].includes(userRole);
  }

  // Account routes (all authenticated users)
  if (route.startsWith('/account')) {
    return true;
  }

  // Public routes
  return true;
}

/**
 * Get user dashboard route based on role
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'vendor':
      return '/vendor';
    case 'sales':
      return '/sales';
    case 'installer':
      return '/installer';
    case 'shipping_agent':
      return '/shipping';
    case 'customer':
    default:
      return '/account';
  }
}

/**
 * Registration flow rules
 */
export const REGISTRATION_RULES = {
  // Only customers can self-register
  publicRegistration: ['customer'],
  
  // Roles that require admin approval
  requiresApproval: ['vendor', 'shipping_agent'],
  
  // Roles that are invitation-only
  invitationOnly: ['sales', 'installer'],
  
  // Default role for public registration
  defaultRole: 'customer' as UserRole
};

/**
 * E-commerce role recommendations for competing with Amazon
 */
export const ECOMMERCE_ROLE_STRATEGY = {
  description: `
    Complete role hierarchy designed to compete with Amazon:
    
    1. CUSTOMER ROLES:
       - Customer: Regular buyers
       - Shipping Agent: Professional shipping and logistics services
    
    2. VENDOR ECOSYSTEM:
       - Vendor: Third-party sellers (like Amazon marketplace)
       - Sales: Vendor's sales team for B2B relationships
    
    3. SERVICE PROVIDERS:
       - Installer: Professional installation services
    
    4. PLATFORM MANAGEMENT:
       - Admin: Platform operations and vendor management
       - Super Admin: System ownership and administration
    
    This structure enables:
    - Marketplace functionality (vendors)
    - Professional shipping services (shipping agents, logistics)
    - Service marketplace (installers)
    - Scalable administration
  `,
  
  competitiveAdvantages: [
    'Specialized shipping agent accounts for logistics management',
    'Vendor-managed sales teams for relationship building',
    'Integrated installation services marketplace',
    'Hierarchical approval and management system',
    'Role-based pricing and access control'
  ]
};