'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, getDashboardRoute } from '@/lib/roleHierarchy';

interface RoleDashboardRedirectProps {
  userRole: UserRole;
  currentPath: string;
}

/**
 * Component that automatically redirects users to their appropriate dashboard
 * if they're trying to access a dashboard they don't have permission for
 */
export default function RoleDashboardRedirect({ 
  userRole, 
  currentPath 
}: RoleDashboardRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const userDashboard = getDashboardRoute(userRole);
    
    // Check if user is trying to access a different role's dashboard
    const roleDashboards = [
      '/super-admin',
      '/admin', 
      '/vendor', 
      '/sales', 
      '/installer', 
      '/trade'
    ];

    const isAccessingWrongDashboard = roleDashboards.some(dashboard => 
      currentPath.startsWith(dashboard) && 
      !currentPath.startsWith(userDashboard) &&
      dashboard !== userDashboard
    );

    // Special case: super_admin can access /admin
    if (userRole === 'super_admin' && currentPath.startsWith('/admin')) {
      return; // Allow super admin to access admin panel
    }

    if (isAccessingWrongDashboard) {
      console.log(`Redirecting ${userRole} from ${currentPath} to ${userDashboard}`);
      router.push(userDashboard);
    }
  }, [userRole, currentPath, router]);

  return null; // This component doesn't render anything
}