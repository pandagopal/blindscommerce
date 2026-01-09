'use client';

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get sessionId from localStorage for cart merging
      let sessionId = null;
      try {
        const guestCart = localStorage.getItem('guest_cart');
        if (guestCart) {
          // Generate a simple sessionId based on the cart data
          sessionId = btoa(guestCart).substring(0, 32);
        }
      } catch (e) {
        // Ignore localStorage errors
      }

      const loginUrl = sessionId 
        ? `/api/v2/auth/login?sessionId=${encodeURIComponent(sessionId)}`
        : '/api/v2/auth/login';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Extract data from V2 API response format
      const data = result.data || result;

      // Wait a moment to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the redirect URL from the response
      let targetUrl = data.redirectUrl;
      if (!targetUrl) {
        // If not provided by backend, determine by user role
        // Fetch user info
        const userRes = await fetch('/api/v2/auth/me', { credentials: 'include' });
        if (userRes.ok) {
          const userResult = await userRes.json();
          const userData = userResult.data || userResult;
          switch (userData.user.role) {
            case 'super_admin':
              targetUrl = '/super-admin';
              break;
            case 'admin':
              targetUrl = '/admin';
              break;
            case 'vendor':
              targetUrl = '/vendor';
              break;
            case 'sales':
            case 'sales_representative':
              targetUrl = '/sales';
              break;
            case 'installer':
              targetUrl = '/installer';
              break;
            case 'customer':
              // For customers, check if there's a redirect URL
              // If they came from product configurator, return them there
              // Otherwise go to home page
              targetUrl = (redirectUrl && redirectUrl !== '/') ? redirectUrl : '/?login=success';
              break;
            default:
              targetUrl = '/';
          }
      } else {
          targetUrl = '/';
        }
      }

      // Trigger cart reload for other tabs/windows
      try {
        localStorage.setItem('auth_changed', Date.now().toString());
        // Clean up immediately
        setTimeout(() => localStorage.removeItem('auth_changed'), 100);
      } catch (e) {
        // Ignore localStorage errors
      }

      // Use replace to prevent back button from returning to login
      window.location.replace(targetUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Simplified role-specific login credentials for demo
  // $2b$10$fGssFF6RytcT3P.jeHyPL.1dvOgfFsnvY2DyDUlddvNsmhHdDSvs6
  // const loginExamples = [
  //   { role: 'Customer', email: 'customer@smartblindshub.com', password: 'Admin@1234' },
  //   { role: 'Admin', email: 'admin@smartblindshub.com', password: 'Admin@1234'},
  //   { role: 'Vendor', email: 'vendor@smartblindshub.com', password: 'Admin@1234' },
  //   { role: 'Sales', email: 'sales@smartblindshub.com', password: 'Admin@1234' },
  //   { role: 'Installer', email: 'installer@smartblindshub.com', password: 'Admin@1234' }
  // ];

  // const fillCredentials = (email: string, password: string) => {
  //   setEmail(email);
  //   setPassword(password);
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray-50 to-red-50/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-lg border border-warm-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary-red" />
            <span className="text-primary-red text-xs font-medium tracking-[0.2em] uppercase">Welcome Back</span>
            <span className="w-8 h-px bg-primary-red" />
          </div>
          <h1 className="text-3xl font-semibold text-charcoal-950">Sign In</h1>
          <p className="text-warm-gray-500 mt-2 font-light">
            Sign in to your account to access your orders, favorites, and more.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full p-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-red focus:border-primary-red bg-white text-gray-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-red hover:text-primary-dark font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full p-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-red focus:border-primary-red bg-white text-gray-900"
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-red hover:bg-primary-dark text-white font-medium py-3.5 px-4 transition-all hover:shadow-lg disabled:opacity-70 flex justify-center items-center uppercase tracking-wider text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          <div className="text-center text-sm text-warm-gray-600">
            <span>Don&apos;t have an account?</span>
            <Link
              href="/register"
              className="ml-1 text-primary-red hover:text-primary-dark font-semibold transition-colors"
            >
              Sign up
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-warm-gray-200">
          <SocialLoginButtons />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-gray-50 to-red-50/30 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-red" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
