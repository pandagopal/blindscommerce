'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ROLE_HIERARCHY, getAvailableRolesForUser, UserRole } from '@/lib/roleHierarchy';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number validation regex for different countries
const PHONE_REGEX = {
  US: /^\+1[2-9]\d{9}$/, // +1XXXXXXXXXX (10 digits)
  UK: /^\+44[1-9]\d{9}$/, // +44XXXXXXXXXX (10 digits)
  INDIA: /^\+91[6-9]\d{9}$/, // +91XXXXXXXXXX (10 digits)
  CHINA: /^\+86[1][3-9]\d{9}$/, // +86XXXXXXXXXXX (11 digits)
};

const PHONE_FORMATS = {
  US: '+1XXXXXXXXXX',
  UK: '+44XXXXXXXXXX',
  INDIA: '+91XXXXXXXXXX',
  CHINA: '+86XXXXXXXXXXX'
};

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
    isActive: true
  });

  useEffect(() => {
    // Get current user's role and available roles they can create
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/v2/auth/me');
        if (response.ok) {
          const userData = await response.json();
          const userRole = userData.role as UserRole;
          setCurrentUserRole(userRole);
          const roles = getAvailableRolesForUser(userRole);
          setAvailableRoles(roles);
          
          // Set default role to first available
          if (roles.length > 0) {
            setFormData(prev => ({ ...prev, role: roles[0].name }));
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback to admin permissions
        //const roles = getAvailableRolesForUser('admin');
        //setAvailableRoles(roles);
      }
    };

    fetchUserRole();
  }, []);

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!EMAIL_REGEX.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone) return ''; // Phone is optional
    const isValid = Object.values(PHONE_REGEX).some(regex => regex.test(phone));
    if (!isValid) {
      const formats = Object.entries(PHONE_FORMATS)
        .map(([country, format]) => `${country}: ${format}`)
        .join(', ');
      return `Invalid phone number format. Allowed formats: ${formats}`;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    setError('');

    // Validate fields on change
    if (name === 'email') {
      setValidationErrors(prev => ({
        ...prev,
        email: validateEmail(value)
      }));
    } else if (name === 'phone') {
      setValidationErrors(prev => ({
        ...prev,
        phone: validatePhone(value)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);

    setValidationErrors({
      email: emailError,
      phone: phoneError
    });

    if (emailError || phoneError) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v2/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create user');
      }

      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Link
            href="/admin/users"
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number (+1/+44/+91/+86)"
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: US (+1), UK (+44), India (+91), China (+86)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                {availableRoles.map((roleInfo) => (
                  <option key={roleInfo.name} value={roleInfo.name}>
                    {roleInfo.displayName}
                  </option>
                ))}
              </select>
              {formData.role && ROLE_HIERARCHY[formData.role as UserRole] && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>{ROLE_HIERARCHY[formData.role as UserRole].displayName}:</strong>{' '}
                    {ROLE_HIERARCHY[formData.role as UserRole].description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center mt-4 bg-gray-50 p-4 rounded-md">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active Account
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !!validationErrors.email || !!validationErrors.phone}
              className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <Link
              href="/admin/users"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 