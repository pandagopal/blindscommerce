import Link from "next/link";
import { ShoppingCart, User, Menu, Search } from "lucide-react";

const Navbar = () => {
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
            <Link
              href="/account"
              className="text-gray-500 hover:text-primary-red focus:outline-none"
              aria-label="Account"
            >
              <User size={20} />
            </Link>
            <Link
              href="/cart"
              className="text-gray-500 hover:text-primary-red focus:outline-none relative"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
