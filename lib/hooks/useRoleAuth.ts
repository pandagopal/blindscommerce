import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  customer_type?: string;
}

export function useRoleAuth(requiredRole: string) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const result = await res.json();
        const data = result.data || result;setUser(data.user);
          
          // Check role authorization
          const userRole = data.user.role;
          const customerType = data.user.customer_type;
          
          if (requiredRole === 'trade') {
            if (userRole !== 'trade' && customerType !== 'trade') {
              router.push('/auth/login?redirect=/trade');
              return;
            }
          } else if (userRole !== requiredRole) {
            router.push('/');
            return;
          }
        } else {
          router.push(`/login?redirect=${window.location.pathname}`);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router, requiredRole]);

  const isAuthorized = user && (
    requiredRole === 'trade' 
      ? (user.role === 'trade' || user.customer_type === 'trade')
      : user.role === requiredRole
  );

  return {
    isAuthorized,
    isLoading,
    session: user ? { user } : null,
    user
  };
} 