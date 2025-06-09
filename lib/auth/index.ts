import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { getUserById } from '@/lib/db/users';

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token.value);

    if (!payload) {
      return null;
    }

    const user = await getUserById(payload.userId);

    if (!user) {
      return null;
    }

    return {
      userId: user.user_id.toString(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role || 'user'
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
} 