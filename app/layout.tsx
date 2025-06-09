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
import { defaultMetadata, dynamic, revalidate } from './config';
import { Toaster } from "sonner";
//import LiveChat from "./components/chat/LiveChat";
//import LiveChat from "@/components/chat/LiveChat";


const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering for all pages
export { dynamic, revalidate };

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
        <CartProvider>
          <RecentlyViewedProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
             {/* <LiveChat /> */}
            </div>
            <Toaster richColors />
          </RecentlyViewedProvider>
        </CartProvider>
      </body>
    </html>
  );
}
