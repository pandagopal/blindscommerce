/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Netlify deployment
  output: 'standalone',

  // Configure dynamic routes - this is critical for pages with data fetching
  experimental: {
    // Settings for better Netlify compatibility
    optimizePackageImports: ['react-icons'],
  },

  // Webpack configuration to handle native modules and TensorFlow.js
  webpack: (config, { isServer }) => {
    // Exclude problematic modules from webpack processing
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });

    // Handle WASM files for TensorFlow.js
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ignore native modules that cause build issues
    config.externals = config.externals || [];
    config.externals.push({
      '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
    });

    // Handle other native binaries  
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        // Keep crypto for TensorFlow.js
        crypto: require.resolve('crypto-browserify'),
      };
    }

    return config;
  },

  // Force all pages to be dynamically rendered at request time,
  // preventing static optimization errors with data fetching
  staticPageGenerationTimeout: 1000,

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

  // Headers for WASM support and CSP
  async headers() {
    return [
      {
        source: '/(.*)\\.wasm$',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "font-src 'self' https://fonts.gstatic.com data: blob:;",
          },
        ],
      },
    ];
  },

  // Route configuration
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
};

module.exports = nextConfig;
