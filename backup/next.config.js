/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as static export for Netlify deployment
  output: 'export',
  distDir: 'out',

  // External packages configuration for server components
  // commented out as static export doesn't support server components
  // serverExternalPackages: ['pg'],

  // Configure dynamic routes - this is critical for pages with data fetching
  experimental: {
    // Settings for better Netlify compatibility
    optimizePackageImports: ['react-icons'],
  },

  // Force all pages to be statically rendered at build time
  // staticPageGenerationTimeout: 1000, // not needed for static export

  images: {
    // This is necessary for image optimization to work properly with remote images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
      },
    ],
    // Unoptimized for Netlify deployment
    unoptimized: true,
  },

  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Route configuration
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
};

module.exports = nextConfig;
