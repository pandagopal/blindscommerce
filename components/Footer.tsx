import Link from "next/link";
import Image from "next/image";
import SocialMediaLinks from "./social/SocialMediaLinks";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Image
                src="/images/logo/SmartBlindsLogo.png"
                alt="Smart Blinds Hub"
                width={150}
                height={50}
                className="dark:brightness-200"
              />
            </div>
            <p className="text-gray-300 mb-4">
              The best destination for all your window treatment needs. Quality
              custom blinds, shades, and shutters at great prices.
            </p>
            <SocialMediaLinks 
              position="footer" 
              size="medium"
              className="text-gray-300"
            />
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-bold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products?category=faux-wood-blinds"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Faux Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=wood-blinds"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=cellular-shades"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Cellular Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roller-shades"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Roller Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roman-shades"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Roman Shades
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/measure-install"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Measurement & Installation
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Returns & Warranty
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  For Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/wiki"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Wiki
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Smart Blinds Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
