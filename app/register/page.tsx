import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Account | Smart Blinds Hub",
  description: "Sign up for a Smart Blinds Hub account to save your favorites, track orders, and more.",
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Join Smart Blinds Hub to enjoy a personalized shopping experience.
          </p>
        </div>

        <form className="space-y-6" id="register-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
              />
            </div>
          </div>

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
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters long with at least one uppercase letter, one lowercase letter, and one number.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary-red hover:text-primary-red-light"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary-red hover:text-primary-red-light"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Create Account
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="ml-1 text-primary-red hover:text-primary-red-light font-medium"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>

      {/* Client-side script for form submission */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('register-form').addEventListener('submit', async function(e) {
              e.preventDefault();

              const firstName = document.getElementById('firstName').value;
              const lastName = document.getElementById('lastName').value;
              const email = document.getElementById('email').value;
              const phone = document.getElementById('phone').value;
              const password = document.getElementById('password').value;
              const confirmPassword = document.getElementById('confirmPassword').value;

              // Simple validation
              if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
              }

              if (password.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
              }

              try {
                const response = await fetch('/api/auth/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                  }),
                });

                const data = await response.json();

                if (response.ok) {
                  window.location.href = '/';
                } else {
                  alert(data.error || 'Registration failed. Please try again.');
                }
              } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
              }
            });
          `,
        }}
      />
    </div>
  );
}
