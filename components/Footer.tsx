import Link from "next/link";
import Image from "next/image";
import SocialMediaLinks from "./social/SocialMediaLinks";

const Footer = () => {
  return (
    <footer className="bg-footer-bg text-white" role="contentinfo">
      {/* Top accent bar with brand color */}
      <div className="h-1 bg-gradient-to-r from-primary-red via-primary-red-dark to-primary-red" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="mb-6">
              <Image
                src="/images/logo/SmartBlindsLogo.png"
                alt="Smart Blinds Hub"
                width={160}
                height={53}
                className="drop-shadow-[0_0_1px_rgba(255,255,255,0.8)]"
              />
            </div>
            <p className="text-gray-300 leading-relaxed">
              The best destination for all your window treatment needs. Quality
              custom blinds, shades, and shutters at great prices.
            </p>
            <SocialMediaLinks
              position="footer"
              size="medium"
              className="text-gray-300 mt-4"
            />
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white relative inline-block">
              Products
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-primary-red rounded-full" />
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products?category=faux-wood-blinds"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Faux Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=wood-blinds"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=cellular-shades"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Cellular Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roller-shades"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Roller Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roman-shades"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Roman Shades
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white relative inline-block">
              Customer Service
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-primary-red rounded-full" />
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/measure-install"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Measurement & Installation
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Returns & Warranty
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Guides & Tutorials
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white relative inline-block">
              About
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-primary-red rounded-full" />
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  For Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/wiki"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Wiki
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-primary-red transition-colors duration-200 focus:outline-none focus-visible:text-primary-red focus-visible:underline"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section with copyright and additional links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Smart Blinds Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-primary-red transition-colors focus:outline-none focus-visible:text-primary-red focus-visible:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-primary-red transition-colors focus:outline-none focus-visible:text-primary-red focus-visible:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/accessibility"
                className="text-gray-400 hover:text-primary-red transition-colors focus:outline-none focus-visible:text-primary-red focus-visible:underline"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
