import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full">
                Return to Home
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Login with Different Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 