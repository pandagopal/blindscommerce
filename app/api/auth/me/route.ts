import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
}
