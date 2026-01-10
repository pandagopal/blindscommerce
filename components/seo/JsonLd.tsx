'use client';

import { siteConfig } from '@/lib/seo-config';

// Organization Schema
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}${siteConfig.logo}`,
      width: 150,
      height: 50,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone,
        contactType: 'customer service',
        availableLanguage: ['English'],
        areaServed: 'US',
      },
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone,
        contactType: 'sales',
        availableLanguage: ['English'],
        areaServed: 'US',
      },
    ],
    sameAs: [
      'https://facebook.com/smartblindshub',
      'https://twitter.com/smartblindshub',
      'https://instagram.com/smartblindshub',
      'https://pinterest.com/smartblindshub',
      'https://youtube.com/smartblindshub',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Website Schema
export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Local Business Schema
export function LocalBusinessJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    image: `${siteConfig.url}${siteConfig.logo}`,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    serviceType: [
      'Custom Window Blinds',
      'Window Shades Installation',
      'Window Treatment Consultation',
      'Motorized Blinds Installation',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Product Schema
interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  sku?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  price,
  priceCurrency = 'USD',
  availability = 'InStock',
  url,
  brand = siteConfig.name,
  rating,
  reviewCount,
  category,
}: ProductJsonLdProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
    sku: sku || name.toLowerCase().replace(/\s+/g, '-'),
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    category: category || 'Window Treatments',
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency,
      price: price.toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 5,
            maxValue: 10,
            unitCode: 'DAY',
          },
        },
      },
    },
  };

  // Add aggregate rating if available
  if (rating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ Schema
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// How-To Schema (for guides)
interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export function HowToJsonLd({
  name,
  description,
  steps,
  totalTime,
  image,
}: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format, e.g., "PT30M"
  image?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: {
          '@type': 'ImageObject',
          url: step.image.startsWith('http') ? step.image : `${siteConfig.url}${step.image}`,
        },
      }),
    })),
  };

  if (totalTime) {
    schema.totalTime = totalTime;
  }

  if (image) {
    schema.image = {
      '@type': 'ImageObject',
      url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Review Schema
export function ReviewJsonLd({
  itemReviewed,
  reviewRating,
  author,
  reviewBody,
  datePublished,
}: {
  itemReviewed: { name: string; type?: string };
  reviewRating: number;
  author: string;
  reviewBody: string;
  datePublished: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewed.type || 'Product',
      name: itemReviewed.name,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating,
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewBody,
    datePublished,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Service Schema (for measure & install)
export function ServiceJsonLd({
  name,
  description,
  provider = siteConfig.name,
  areaServed = 'United States',
  serviceType,
}: {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
  serviceType?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      url: siteConfig.url,
    },
    areaServed: {
      '@type': 'Country',
      name: areaServed,
    },
    serviceType: serviceType || name,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Collection/ItemList Schema (for product listings)
interface CollectionItem {
  name: string;
  url: string;
  image?: string;
  price?: number;
}

export function CollectionJsonLd({
  name,
  description,
  items,
}: {
  name: string;
  description?: string;
  items: CollectionItem[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
        ...(item.image && {
          image: item.image.startsWith('http') ? item.image : `${siteConfig.url}${item.image}`,
        }),
        ...(item.price && {
          offers: {
            '@type': 'Offer',
            price: item.price.toFixed(2),
            priceCurrency: 'USD',
          },
        }),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
