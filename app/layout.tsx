import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { AuthProvider } from "@/context/AuthContext";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import { defaultMetadata, siteConfig } from '@/lib/seo-config';
import { OrganizationJsonLd, WebsiteJsonLd, LocalBusinessJsonLd } from '@/components/seo/JsonLd';
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Comprehensive SEO metadata
export const metadata: Metadata = defaultMetadata;

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for potential external resources */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Structured Data for SEO */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <LocalBusinessJsonLd />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-red focus:text-white focus:rounded-md"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <NextAuthProvider>
            <AuthProvider>
              <CartProvider>
                <RecentlyViewedProvider>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main id="main-content" className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster richColors />
                </RecentlyViewedProvider>
              </CartProvider>
            </AuthProvider>
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
