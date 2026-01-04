import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get the current user's ID from the session
 * @param req NextRequest object
 * @returns User ID or null if not authenticated
 */
export async function getSessionUserId(req: NextRequest): Promise<string | null> {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.userId) {
      return null;
    }
    return user.userId.toString();
  } catch (error) {
    console.error('Error getting session user ID:', error);
    return null;
  }
}

/**
 * Get the current user from the session
 * @param req NextRequest object
 * @returns User object or null if not authenticated
 */
export async function getSessionUser(req: NextRequest) {
  try {
    return await getCurrentUser(req);
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}
