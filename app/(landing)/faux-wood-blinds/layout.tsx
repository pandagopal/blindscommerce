import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faux Wood Blinds | Moisture Resistant & Affordable | Smart Blinds Hub",
  description: "Shop faux wood blinds - the look of real wood with superior durability. Moisture resistant, perfect for bathrooms & kitchens. Custom sizes from $24.99. Free shipping!",
  keywords: "faux wood blinds, faux wooden blinds, PVC blinds, vinyl wood blinds, moisture resistant blinds, bathroom blinds, kitchen blinds",
  openGraph: {
    title: "Faux Wood Blinds | Moisture Resistant & Affordable",
    description: "Premium faux wood blinds starting at $24.99. Moisture resistant, easy to clean, lifetime warranty. Perfect for any room.",
    type: "website",
    url: "https://smartblindshub.com/faux-wood-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/faux-wood-blinds",
  },
};

export default function FauxWoodBlindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
