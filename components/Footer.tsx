import Link from "next/link";
import Image from "next/image";
import SocialMediaLinks from "./social/SocialMediaLinks";

const Footer = () => {
  return (
    <footer className="bg-charcoal-950 text-white">
      {/* Red accent line at top */}
      <div className="h-1 bg-primary-red" />

      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <div className="mb-6">
              <Image
                src="/images/logo/SmartBlindsLogo.png"
                alt="Smart Blinds Hub"
                width={150}
                height={50}
                className="brightness-200"
              />
            </div>
            <p className="text-warm-gray-400 mb-6 font-light leading-relaxed">
              The premier destination for all your window treatment needs. Quality
              custom blinds, shades, and shutters at exceptional prices.
            </p>
            <SocialMediaLinks
              position="footer"
              size="medium"
              className="text-warm-gray-400"
            />
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-6 tracking-wide">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products?category=faux-wood-blinds"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Faux Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=wood-blinds"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Wood Blinds
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=cellular-shades"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Cellular Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roller-shades"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Roller Shades
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=roman-shades"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Roman Shades
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-6 tracking-wide">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/measure-install"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Measurement & Installation
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Returns & Warranty
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-6 tracking-wide">About</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  For Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/wiki"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Wiki
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-warm-gray-400 hover:text-primary-red transition-colors font-light"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 text-center text-warm-gray-500 text-sm border-t border-charcoal-800">
          <p className="font-light">&copy; {new Date().getFullYear()} Smart Blinds Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
