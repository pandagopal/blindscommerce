import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { AuthProvider } from "@/context/AuthContext";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import { defaultMetadata } from './config';
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import LiveChat from "@/app/components/chat/LiveChat";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: defaultMetadata.title,
  description: defaultMetadata.description,
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <NextAuthProvider>
            <AuthProvider>
              <CartProvider>
                <RecentlyViewedProvider>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <LiveChat />
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
