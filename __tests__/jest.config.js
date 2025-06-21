/** @type {import('jest').Config} */
module.exports = {
  displayName: 'BlindsCommerce Regression Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
  testMatch: [
    '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.spec.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../$1',
    '^@components/(.*)$': '<rootDir>/../components/$1',
    '^@lib/(.*)$': '<rootDir>/../lib/$1',
    '^@app/(.*)$': '<rootDir>/../app/$1',
    // Mock Next.js server components that don't work in Jest
    '^next/server$': '<rootDir>/setup/mocks/next-server.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))'
  ],
  collectCoverageFrom: [
    '../components/**/*.{ts,tsx}',
    '../lib/**/*.{ts,tsx}',
    '../app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  bail: false,
  verbose: true,
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/../blindscommerce-ui-tests/'
  ]
};