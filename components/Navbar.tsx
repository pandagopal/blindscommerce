'use client';

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, Search, LogOut, ChevronDown, Settings, Package, List, Heart, FileText } from "lucide-react";
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

interface CompanyInfo {
  companyName: string;
  emergencyHotline: string;
  tagline: string;
}

const Navbar = () => {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: 'Smart Blinds Hub',
    emergencyHotline: '1-800-BLINDS',
    tagline: 'Expert Help Available'
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch company info
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // Add cache busting to prevent browser caching
        const response = await fetch(`/api/v2/settings/company-info?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.companyInfo) {
            setCompanyInfo({
              companyName: data.companyInfo.companyName || 'Smart Blinds Hub',
              emergencyHotline: data.companyInfo.emergencyHotline || '1-800-BLINDS',
              tagline: data.companyInfo.tagline || 'Expert Help Available'
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      }
    };

    fetchCompanyInfo();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      fetchCompanyInfo();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Fetch user data
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
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

  // Fetch user data on component mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for logout events from other parts of the app
  useEffect(() => {
    const handleAuthChange = () => {
      fetchUser();
    };

    // Listen for custom logout events
    window.addEventListener('userLoggedOut', handleAuthChange);
    
    // Listen for storage changes (in case auth token is cleared)
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_logout') {
        fetchUser();
      }
    });

    // Also check auth status when the window gains focus
    window.addEventListener('focus', fetchUser);

    return () => {
      window.removeEventListener('userLoggedOut', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('focus', fetchUser);
    };
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
      const response = await fetch('/api/v2/auth/logout', {
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
    <>
      {/* Top promotional banner */}
      <div className="bg-primary-red text-white py-2 text-center text-sm">
        <div className="container mx-auto px-4">
          <span className="font-medium">🚚 Free Shipping on Orders $100+ | 📞 {companyInfo.emergencyHotline} | 📞 {companyInfo.tagline}</span>
        </div>
      </div>
      
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
              <Image
                src="/images/logo/SmartBlindsLogo.png"
                alt="Smart Blinds Hub"
                width={150}
                height={50}
                priority
              />
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/ai-features"
              className="text-gray-600 hover:text-primary-red font-medium flex items-center gap-1"
            >
              AI Features
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                New
              </span>
            </Link>

            <div className="relative group">
              <Link
                href="/products"
                className="text-gray-600 hover:text-primary-red font-medium flex items-center gap-1"
              >
                Blinds
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200">
                <div className="py-2">
                  <Link href="/products?category=1" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Venetian Blinds</Link>
                  <Link href="/products?category=2" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Vertical Blinds</Link>
                  <Link href="/products?category=3" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Roller Blinds</Link>
                  <Link href="/products?category=4" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Roman Blinds</Link>
                  <Link href="/products?category=5" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wooden Blinds</Link>
                  <Link href="/products?category=6" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Faux Wood Blinds</Link>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <Link
                href="/shades"
                className="text-gray-600 hover:text-primary-red font-medium flex items-center gap-1"
              >
                Shades
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200">
                <div className="py-2">
                  <Link href="/products?category=7" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cellular Shades</Link>
                  <Link href="/products?category=8" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Roller Shades</Link>
                  <Link href="/products?category=9" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Solar Shades</Link>
                  <Link href="/products?category=10" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Woven Wood Shades</Link>
                  <Link href="/products?category=11" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pleated Shades</Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <Link
                href="/shutters"
                className="text-gray-600 hover:text-primary-red font-medium flex items-center gap-1"
              >
                Shutters
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200">
                <div className="py-2">
                  <Link href="/products?category=12" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Plantation Shutters</Link>
                  <Link href="/products?category=13" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Vinyl Shutters</Link>
                  <Link href="/products?category=14" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wood Shutters</Link>
                  <Link href="/products?category=15" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Composite Shutters</Link>
                </div>
              </div>
            </div>

            <Link
              href="/products?category=22"
              className="text-gray-600 hover:text-primary-red font-medium"
            >
              Motorized
            </Link>

            <div className="relative group">
              <span className="text-gray-600 hover:text-primary-red font-medium flex items-center gap-1 cursor-pointer">
                Services
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform" />
              </span>
              <div className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200">
                <div className="py-2">
                  <Link href="/measure-install" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Measure & Install</Link>
                  <Link href="/consultation" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Free Consultation</Link>
                  <Link href="/samples" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Free Samples</Link>
                  <Link href="/warranty" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Warranty Service</Link>
                </div>
              </div>
            </div>
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
                        {user.role === 'customer' && (
                          <Link
                            href="/customer/commercial-templates"
                            onClick={() => setDropdownOpen(false)}
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FileText size={16} className="mr-2" />
                            Commercial Orders (5+)
                          </Link>
                        )}
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

            {/* Cart - Only visible to customers and guests */}
            {(!user || user.role === 'customer') && (
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/ai-features"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI Features
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                New
              </span>
            </Link>
            <Link
              href="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blinds
            </Link>
            <Link
              href="/shades"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shades
            </Link>
            <Link
              href="/shutters"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shutters
            </Link>
            <Link
              href="/motorized"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Motorized
            </Link>
            <Link
              href="/measure-install"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-red hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Measure & Install
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
    
    {/* Secondary navigation bar */}
    <div className="bg-gray-50 border-b border-gray-200 hidden lg:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-8 py-3 text-sm">
          <Link href="/products" className="text-gray-600 hover:text-primary-red font-medium">
            Shop by Room
          </Link>
          <Link href="/products?sale=true" className="text-red-600 hover:text-red-700 font-bold">
            Sale - Up to 50% Off
          </Link>
          <Link href="/samples" className="text-gray-600 hover:text-primary-red font-medium">
            Free Samples
          </Link>
          <Link href="/inspiration" className="text-gray-600 hover:text-primary-red font-medium">
            Design Ideas
          </Link>
          <Link href="/commercial" className="text-gray-600 hover:text-primary-red font-medium">
            Commercial
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Navbar;
