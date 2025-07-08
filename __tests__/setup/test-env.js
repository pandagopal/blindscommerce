// Test environment setup for BlindsCommerce regression tests
// This sets up minimal environment variables for tests to run

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest-only';

// Mock console methods if needed
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out known test warnings/errors that are not critical
  const message = args.join(' ');
  if (
    message.includes('Warning: ReactDOM.render is deprecated') ||
    message.includes('Warning: validateDOMNesting') ||
    message.includes('act(...) is not supported')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};