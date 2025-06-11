import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear the auth cookie
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Clear the auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    // Clear the token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for simple logout via URL
export async function GET(request: NextRequest) {
  try {
    // Create response with redirect
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect') || '/';
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Clear the auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    // Clear the token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.redirect(new URL('/', request.url));
    // Still try to clear the cookie even if there's an error
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    // Clear the token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');
    return response;
  }
}
