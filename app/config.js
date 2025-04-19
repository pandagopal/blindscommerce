// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';

// Default revalidation interval (set to 0 for dynamic only)
export const revalidate = 0;

// Disable static generation
export const dynamicParams = true;

// Configuration for database
export const dbConfig = {
  isProduction: process.env.NODE_ENV === 'production',
};

// Default metadata for SEO
export const defaultMetadata = {
  title: 'Smart Blinds Hub - Premium Window Treatments',
  description: 'Find the perfect custom window blinds, shades, and treatments for your home or business.',
};

// Image domains for Next.js Image component
export const imageDomains = [
  "source.unsplash.com",
  "images.unsplash.com",
  "ext.same-assets.com",
  "ugc.same-assets.com",
];
