import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Clear the auth cookie using our updated function
    await logoutUser();

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
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
    // Remove the auth cookie
    await logoutUser();

    // Get the redirect URL from query parameters or default to home
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect') || '/';

    // Redirect to the specified URL
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
