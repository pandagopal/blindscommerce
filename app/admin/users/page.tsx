'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon,
  RefreshCwIcon,
  FileDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  MonitorIcon
} from 'lucide-react';

interface User {
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  role: 'admin' | 'vendor' | 'sales' | 'installer' | 'customer';
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/v2/auth/me');
        if (response.ok) {
          const result = await response.json();
        const data = result.data || result;setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, sortBy, sortOrder, debouncedSearchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * usersPerPage;
      const queryParams = new URLSearchParams({
        limit: usersPerPage.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      });

      const response = await fetch(`/api/v2/admin/users?${queryParams}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }

      const result = await response.json();
        const data = result.data || result;setUsers(data.users);
      setTotalUsers(data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'vendor':
        return 'bg-blue-100 text-blue-800';
      case 'sales':
        return 'bg-green-100 text-green-800';
      case 'installer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDashboardUrl = (role: string, userId: number) => {
    switch (role) {
      case 'admin':
        return `/admin?admin_view=${userId}`;
      case 'vendor':
        return `/vendor?admin_view=${userId}`;
      case 'sales':
        return `/sales?admin_view=${userId}`;
      case 'installer':
        return `/installer?admin_view=${userId}`;
      case 'customer':
        return `/account?admin_view=${userId}`;
      default:
        return null;
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    if (currentUser?.user_id === userId) {
      setError('You cannot change your own account status');
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user? ${
        action === 'deactivate' 
          ? 'The user will not be able to log in until reactivated.'
          : 'The user will regain access to the system.'
      }`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/v2/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user status');
      }

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-500">Manage user accounts and permissions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchUsers()}
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
          <Link
            href="/admin/users/export"
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileDownIcon size={16} className="mr-1" />
            <span className="text-sm">Export</span>
          </Link>
          <Link
            href="/admin/users/new"
            className="flex items-center p-2 text-white bg-primary-red border border-primary-red rounded-md hover:bg-red-700"
          >
            <PlusIcon size={16} className="mr-1" />
            <span className="text-sm">Add User</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={handleStatusFilter}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="vendor">Vendors</option>
          <option value="sales">Sales Staff</option>
          <option value="installer">Installers</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    User
                    {sortBy === 'email' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_login')}
                >
                  <div className="flex items-center">
                    Last Login
                    {sortBy === 'last_login' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {sortBy === 'created_at' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          {(user.first_name || user.last_name) && (
                            <div className="text-sm text-gray-500">
                              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.user_id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/users/${user.user_id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </Link>
                      {getDashboardUrl(user.role, user.user_id) && (
                        <Link
                          href={getDashboardUrl(user.role, user.user_id)!}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title={`View ${user.role} dashboard`}
                        >
                          <MonitorIcon size={16} className="inline mr-1" />
                          Dashboard
                        </Link>
                      )}
                      {currentUser?.user_id !== user.user_id && (
                        <button
                          onClick={() => handleStatusToggle(user.user_id, user.is_active)}
                          className={`${
                            user.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          } ml-3`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalUsers > usersPerPage && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalUsers / usersPerPage), page + 1))}
                  disabled={currentPage === Math.ceil(totalUsers / usersPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * usersPerPage + 1, totalUsers)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * usersPerPage, totalUsers)}
                    </span>{' '}
                    of <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {Math.ceil(totalUsers / usersPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalUsers / usersPerPage), page + 1))}
                      disabled={currentPage === Math.ceil(totalUsers / usersPerPage)}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(totalUsers / usersPerPage))}
                      disabled={currentPage === Math.ceil(totalUsers / usersPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Last
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 