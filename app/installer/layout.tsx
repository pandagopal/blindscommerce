import { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Home, Calendar, Hammer, Map, CheckSquare,
  FileText, Settings, LogOut, Users
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Installer Dashboard | Smart Blinds Hub',
  description: 'Manage installations, schedule appointments, and track jobs',
};

export default async function InstallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user has installer role
  const user = await getCurrentUser();
  if (!user || !hasRole(user, ['admin', 'installer'])) {
    redirect('/login?redirect=/installer');
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Link href="/installer" className="flex items-center">
              <span className="font-bold text-xl text-primary-red">Installer Portal</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/installer" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Home className="mr-3 h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/appointments" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Calendar className="mr-3 h-5 w-5" />
                  <span>Appointments</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/jobs" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Hammer className="mr-3 h-5 w-5" />
                  <span>Jobs</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/routes" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Map className="mr-3 h-5 w-5" />
                  <span>Routes</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/customers" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Users className="mr-3 h-5 w-5" />
                  <span>Customers</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/completed" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <CheckSquare className="mr-3 h-5 w-5" />
                  <span>Completed Jobs</span>
                </Link>
              </li>
              <li>
                <Link href="/installer/reports" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <FileText className="mr-3 h-5 w-5" />
                  <span>Reports</span>
                </Link>
              </li>
            </ul>

            <hr className="my-4" />

            <ul className="space-y-1">
              <li>
                <Link href="/installer/settings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </li>
              <li>
                <Link href="/api/auth/logout" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Log out</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-red text-white flex items-center justify-center">
                {user?.firstName?.charAt(0) || 'I'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Installation Technician</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Link href="/installer" className="font-bold text-lg text-primary-red">
            Installer Portal
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
