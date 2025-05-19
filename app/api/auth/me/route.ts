import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/auth/me - Checking authentication...');
    
    const user = await getCurrentUser();

    if (!user) {
      console.log('GET /api/auth/me - User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('GET /api/auth/me - User authenticated:', {
      userId: user.userId,
      email: user.email,
      role: user.role
    });

    return NextResponse.json(
      {
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
}
