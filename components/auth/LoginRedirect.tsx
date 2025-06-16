'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, getPostLoginRedirect, getWelcomeMessage } from '@/lib/utils/authRedirect';

interface LoginRedirectProps {
  user: AuthUser;
  intendedPath?: string;
  showWelcome?: boolean;
}

export default function LoginRedirect({ 
  user, 
  intendedPath, 
  showWelcome = true 
}: LoginRedirectProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const redirectUser = async () => {
      // Small delay to show the welcome message
      if (showWelcome) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const redirectPath = getPostLoginRedirect(user, intendedPath);
      router.push(redirectPath);
    };

    redirectUser();
  }, [user, intendedPath, router, showWelcome]);

  if (!showWelcome) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Login Successful!
        </h2>
        
        <p className="text-gray-600 mb-6">
          {getWelcomeMessage(user)}
        </p>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-red"></div>
          <span>Redirecting you to your dashboard...</span>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Role: {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>
      </div>
    </div>
  );
}