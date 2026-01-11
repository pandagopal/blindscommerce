import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Blinds | Made to Measure Window Treatments | Smart Blinds Hub",
  description: "Shop custom blinds made to fit your windows perfectly. Choose from wood, faux wood, cellular shades, roller shades & more. Free shipping on orders over $99. Lifetime warranty included.",
  keywords: "custom blinds, made to measure blinds, custom window blinds, custom window treatments, blinds made to order, custom size blinds",
  openGraph: {
    title: "Custom Blinds | Made to Measure Window Treatments",
    description: "Premium custom blinds made to your exact measurements. Save up to 50% vs retail. Free shipping & lifetime warranty.",
    type: "website",
    url: "https://smartblindshub.com/custom-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/custom-blinds",
  },
};

export default function CustomBlindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
