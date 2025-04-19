import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Smart Blinds Hub",
  description: "Sign in to your Smart Blinds Hub account for a personalized shopping experience.",
};

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600 mt-2">
            Sign in to your account to access your orders, favorites, and more.
          </p>
        </div>

        <form className="space-y-6" id="login-form">
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
              autoComplete="email"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
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
                className="text-sm text-primary-red hover:text-primary-red-light"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
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
              className="w-full bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign In
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <span>Don't have an account?</span>
            <Link
              href="/register"
              className="ml-1 text-primary-red hover:text-primary-red-light font-medium"
            >
              Sign up
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-4">
            Or continue with
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  />
                </g>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>

      {/* Client-side script for form submission */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('login-form').addEventListener('submit', async function(e) {
              e.preventDefault();

              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;

              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                  // Get redirect URL from querystring or default to home
                  const urlParams = new URLSearchParams(window.location.search);
                  const redirectUrl = urlParams.get('redirect') || '/';
                  window.location.href = redirectUrl;
                } else {
                  alert(data.error || 'Login failed. Please try again.');
                }
              } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
              }
            });
          `,
        }}
      />
    </div>
  );
}
