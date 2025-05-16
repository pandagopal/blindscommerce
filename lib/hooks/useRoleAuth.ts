import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleAuth(requiredRole: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // @ts-ignore - role exists in session user
    const userRole = session.user?.role;

    if (userRole !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [session, status, router, requiredRole]);

  return {
    isAuthorized: session?.user?.role === requiredRole,
    isLoading: status === 'loading',
    session
  };
} 