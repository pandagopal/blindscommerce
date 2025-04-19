import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { defaultMetadata, dynamic, revalidate } from './config';

const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering for all pages
export { dynamic, revalidate };

export const metadata: Metadata = {
  title: defaultMetadata.title,
  description: defaultMetadata.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
