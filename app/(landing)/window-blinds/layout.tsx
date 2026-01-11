import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Window Blinds | Shop All Styles & Materials | Smart Blinds Hub",
  description: "Shop premium window blinds for every room. Wood, faux wood, aluminum & vinyl blinds. Custom sizes, free shipping over $99, lifetime warranty. Transform your windows today!",
  keywords: "window blinds, blinds for windows, window coverings, blinds, horizontal blinds, vertical blinds, custom window blinds",
  openGraph: {
    title: "Window Blinds | Shop All Styles & Materials",
    description: "Premium window blinds for every home. Custom sizes, free shipping, lifetime warranty. Shop wood, faux wood, cellular & more.",
    type: "website",
    url: "https://smartblindshub.com/window-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/window-blinds",
  },
};

export default function WindowBlindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
