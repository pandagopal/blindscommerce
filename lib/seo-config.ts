import { Metadata } from 'next';

// Site-wide SEO configuration
export const siteConfig = {
  name: 'Smart Blinds Hub',
  domain: 'smartblindshub.com',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://smartblindshub.com',
  description: 'Premium custom window blinds, shades, and shutters. Get expert help with measuring, installation, and find the perfect window treatments for your home or business.',
  keywords: [
    'custom blinds',
    'window blinds',
    'window shades',
    'roller shades',
    'cellular shades',
    'roman shades',
    'motorized blinds',
    'smart blinds',
    'faux wood blinds',
    'wood blinds',
    'venetian blinds',
    'vertical blinds',
    'window treatments',
    'window coverings',
    'custom window treatments',
    'blinds online',
    'shades online',
    'buy blinds',
    'cheap blinds',
    'affordable blinds',
    'energy efficient blinds',
    'blackout blinds',
    'light filtering shades',
  ],
  author: 'Smart Blinds Hub',
  creator: 'Smart Blinds Hub',
  publisher: 'Smart Blinds Hub',
  locale: 'en_US',
  type: 'website',
  twitterHandle: '@smartblindshub',
  phone: '1-800-BLINDS',
  email: 'support@smartblindshub.com',
  address: {
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'US',
  },
  logo: '/images/logo/SmartBlindsLogo.png',
  ogImage: '/og?title=Smart%20Blinds%20Hub&subtitle=Premium%20Custom%20Window%20Treatments',
  // Helper function to generate dynamic OG image URL
  getOgImageUrl: (title: string, subtitle?: string, type?: 'default' | 'product' | 'guide' | 'sale') => {
    const params = new URLSearchParams();
    params.set('title', title);
    if (subtitle) params.set('subtitle', subtitle);
    if (type) params.set('type', type);
    return `/og?${params.toString()}`;
  },
};

// Default metadata for the site
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Premium Custom Window Blinds & Shades`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Premium Custom Window Blinds & Shades`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Custom Window Treatments`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Premium Custom Window Blinds & Shades`,
    description: siteConfig.description,
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [`${siteConfig.url}${siteConfig.ogImage}`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    // Add your verification codes here
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
    yandex: process.env.YANDEX_VERIFICATION || '',
    // bing: process.env.BING_VERIFICATION || '',
  },
  category: 'Home Improvement',
};

// Generate page-specific metadata
export function generatePageMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title,
    description,
    keywords: [...siteConfig.keywords.slice(0, 10), ...keywords],
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`],
    },
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// Generate product metadata
export function generateProductMetadata({
  name,
  description,
  slug,
  image,
  price,
  category,
  rating,
  reviewCount,
}: {
  name: string;
  description: string;
  slug: string;
  image?: string;
  price: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
}): Metadata {
  const url = `${siteConfig.url}/products/configure/${slug}`;
  const productTitle = `${name} - Custom ${category || 'Window Treatment'}`;
  const productDescription = description || `Shop ${name} at ${siteConfig.name}. ${category ? `Premium ${category} ` : ''}starting at $${price.toFixed(2)}. Free shipping on orders over $100.`;

  const keywords = [
    name.toLowerCase(),
    `buy ${name.toLowerCase()}`,
    `${name.toLowerCase()} online`,
    category?.toLowerCase() || '',
    'custom blinds',
    'window treatments',
  ].filter(Boolean);

  return {
    title: productTitle,
    description: productDescription.slice(0, 160),
    keywords,
    openGraph: {
      title: productTitle,
      description: productDescription.slice(0, 160),
      url,
      siteName: siteConfig.name,
      images: image
        ? [
            {
              url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
              width: 800,
              height: 600,
              alt: name,
            },
          ]
        : undefined,
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle,
      description: productDescription.slice(0, 160),
      images: image ? [image.startsWith('http') ? image : `${siteConfig.url}${image}`] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate category metadata
export function generateCategoryMetadata({
  name,
  description,
  slug,
  image,
}: {
  name: string;
  description?: string;
  slug: string;
  image?: string;
}): Metadata {
  const url = `${siteConfig.url}/products?category=${slug}`;
  const categoryTitle = `${name} - Shop Custom ${name}`;
  const categoryDescription = description || `Browse our selection of custom ${name}. Find the perfect ${name.toLowerCase()} for your home with free shipping on orders over $100.`;

  return {
    title: categoryTitle,
    description: categoryDescription.slice(0, 160),
    keywords: [
      name.toLowerCase(),
      `custom ${name.toLowerCase()}`,
      `buy ${name.toLowerCase()}`,
      `${name.toLowerCase()} online`,
      'window treatments',
    ],
    openGraph: {
      title: `${categoryTitle} | ${siteConfig.name}`,
      description: categoryDescription.slice(0, 160),
      url,
      siteName: siteConfig.name,
      images: image
        ? [
            {
              url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
              width: 1200,
              height: 630,
              alt: `${name} Collection`,
            },
          ]
        : undefined,
      locale: siteConfig.locale,
      type: 'website',
    },
    alternates: {
      canonical: url,
    },
  };
}
