'use client';

import Link from "next/link";
import { ShoppingCart, User, Menu, Search, LogOut, ChevronDown, Settings, Package, List, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Type for user data
interface UserData {
  userId?: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const Navbar = () => {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear user state and redirect to home
        setUser(null);
        router.push('/');
        router.refresh(); // Force a refresh to update authentication state
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/login';

    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'vendor':
        return '/vendor';
      case 'sales':
        return '/sales';
      case 'installer':
        return '/installer';
      default:
        return '/account';
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return '';
    return user.firstName || user.email.split('@')[0];
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-red">
                Smart Blinds Hub
              </span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/products"
              className="text-gray-600 hover:text-primary-red font-medium"
            >
              Shop
            </Link>
            <Link
              href="/measure-install"
              className="text-gray-600 hover:text-primary-red font-medium"
            >
              Measure & Install
            </Link>
            <Link
              href="/help"
              className="text-gray-600 hover:text-primary-red font-medium"
            >
              Help
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="text-gray-500 hover:text-primary-red focus:outline-none"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* User Account - changes based on auth state */}
            {!loading && (
              user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-gray-700 hover:text-primary-red focus:outline-none"
                  >
                    <span className="hidden sm:inline-block mr-1 font-medium">{getDisplayName()}</span>
                    <ChevronDown size={16} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                      <div className="py-2 px-4 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block text-gray-700 capitalize">{user.role}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={getDashboardUrl()}
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Settings size={16} className="mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Package size={16} className="mr-2" />
                          My Orders
                        </Link>
                        <Link
                          href="/account/configurations"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <List size={16} className="mr-2" />
                          Saved Configurations
                        </Link>
                        <Link
                          href="/account/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Heart size={16} className="mr-2" />
                          Wishlist
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center text-gray-500 hover:text-primary-red focus:outline-none"
                  aria-label="Account"
                >
                  <User size={20} />
                  <span className="hidden sm:inline-block ml-1">Sign In</span>
                </button>
              )
            )}

            <Link
              href="/cart"
              className="text-gray-500 hover:text-primary-red focus:outline-none relative"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/measure-install"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Measure & Install
            </Link>
            <Link
              href="/help"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Help
            </Link>

            {user ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleSignIn();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
