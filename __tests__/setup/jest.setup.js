require('@testing-library/jest-dom');
const { configure } = require('@testing-library/react');
const { TextEncoder, TextDecoder } = require('util');

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' });

// Setup global environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock app components to avoid dynamic import issues
const mockComponents = require('./mock-components');

jest.mock('@/app/vendor/page', () => ({
  default: mockComponents.MockVendorDashboard,
}));

jest.mock('@/app/vendor/products/page', () => ({
  default: mockComponents.MockVendorProducts,
}));

jest.mock('@/app/vendor/sales-team/page', () => ({
  default: mockComponents.MockVendorSalesTeam,
}));

jest.mock('@/app/vendor/orders/page', () => ({
  default: mockComponents.MockVendorOrders,
}));

jest.mock('@/app/vendor/discounts/page', () => ({
  default: mockComponents.MockVendorDiscounts,
}));

jest.mock('@/app/admin/page', () => ({
  default: mockComponents.MockAdminDashboard,
}));

jest.mock('@/app/admin/users/page', () => ({
  default: mockComponents.MockAdminUsers,
}));

jest.mock('@/app/account/page', () => ({
  default: mockComponents.MockCustomerDashboard,
}));

jest.mock('@/app/account/orders/page', () => ({
  default: mockComponents.MockCustomerOrders,
}));

jest.mock('@/app/sales/page', () => ({
  default: mockComponents.MockSalesDashboard,
}));

jest.mock('@/app/sales/leads/page', () => ({
  default: mockComponents.MockSalesLeads,
}));

jest.mock('@/app/installer/page', () => ({
  default: mockComponents.MockInstallerDashboard,
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
});

// Global error handling for tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};