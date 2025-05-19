import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { getUserById } from '@/lib/db/users';

export async function getCurrentUser() {
  try {
    console.log('Getting current user...');
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');
    
    console.log('Token found:', !!token);
    if (!token) {
      console.log('No token found in cookies');
      return null;
    }

    console.log('Token length:', token.value.length);
    console.log('Token type:', typeof token.value);

    const payload = await verifyToken(token.value);
    console.log('Token verified, payload:', payload);

    if (!payload) {
      console.log('Token verification failed');
      return null;
    }

    const user = await getUserById(payload.userId);
    console.log('User found:', !!user);

    if (!user) {
      console.log('User not found in database');
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