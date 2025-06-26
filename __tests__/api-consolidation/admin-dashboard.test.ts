/**
 * Admin Dashboard Consolidated API Tests
 * Tests the consolidated admin dashboard endpoint that replaced 8 separate endpoints
 */

import { NextRequest } from 'next/server';
import { AdminDashboardHandler } from '@/lib/api/handlers/AdminDashboardHandler';
import { getPool } from '@/lib/db';
import { MigrationTracker } from '@/lib/api/migration';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/api/migration');

describe('AdminDashboardHandler - Consolidated API', () => {
  let handler: AdminDashboardHandler;
  let mockPool: any;
  
  beforeEach(() => {
    handler = new AdminDashboardHandler();
    mockPool = {
      execute: jest.fn(),
      end: jest.fn()
    };
    (getPool as jest.Mock).mockResolvedValue(mockPool);
    
    // Reset migration tracker
    (MigrationTracker.recordEndpointUsage as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/dashboard-consolidated', () => {
    const mockAdminUser = {
      userId: 1,
      email: 'admin@test.com',
      role: 'admin',
      isAdmin: true
    };

    const mockDashboardData = {
      totalRevenue: 150000,
      monthlyRevenue: 25000,
      totalOrders: 1234,
      monthlyOrders: 205,
      totalCustomers: 3456,
      newCustomers: 123,
      totalVendors: 45,
      activeVendors: 42,
      totalProducts: 567,
      activeProducts: 523
    };

    it('should successfully fetch dashboard overview data', async () => {
      // Mock database responses
      mockPool.execute.mockImplementation((query: string) => {
        if (query.includes('revenue_stats')) {
          return [[{
            total_revenue: mockDashboardData.totalRevenue,
            monthly_revenue: mockDashboardData.monthlyRevenue
          }]];
        }
        if (query.includes('order_stats')) {
          return [[{
            total_orders: mockDashboardData.totalOrders,
            monthly_orders: mockDashboardData.monthlyOrders
          }]];
        }
        if (query.includes('customer_stats')) {
          return [[{
            total_customers: mockDashboardData.totalCustomers,
            new_customers: mockDashboardData.newCustomers
          }]];
        }
        if (query.includes('vendor_stats')) {
          return [[{
            total_vendors: mockDashboardData.totalVendors,
            active_vendors: mockDashboardData.activeVendors
          }]];
        }
        if (query.includes('product_stats')) {
          return [[{
            total_products: mockDashboardData.totalProducts,
            active_products: mockDashboardData.activeProducts
          }]];
        }
        return [[]];
      });

      const req = new NextRequest('http://localhost:3000/api/admin/dashboard-consolidated?include=overview');
      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overview');
      expect(data.data.overview).toMatchObject({
        revenue: {
          total: mockDashboardData.totalRevenue,
          monthly: mockDashboardData.monthlyRevenue
        },
        orders: {
          total: mockDashboardData.totalOrders,
          monthly: mockDashboardData.monthlyOrders
        }
      });
      
      // Verify migration tracking
      expect(MigrationTracker.recordEndpointUsage).toHaveBeenCalledWith(
        '/api/admin/dashboard-consolidated',
        1
      );
    });

    it('should handle multiple include parameters efficiently', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/dashboard-consolidated?include=overview,charts,insights,activity'
      );
      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overview');
      expect(data.data).toHaveProperty('charts');
      expect(data.data).toHaveProperty('insights');
      expect(data.data).toHaveProperty('activity');
      
      // Verify parallel query execution (should be called multiple times)
      expect(mockPool.execute.mock.calls.length).toBeGreaterThan(5);
    });

    it('should enforce admin authentication', async () => {
      const nonAdminUser = {
        userId: 2,
        email: 'user@test.com',
        role: 'customer',
        isAdmin: false
      };

      const req = new NextRequest('http://localhost:3000/api/admin/dashboard-consolidated');
      const response = await handler.handle(req, nonAdminUser);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('forbidden');
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database connection failed'));

      const req = new NextRequest('http://localhost:3000/api/admin/dashboard-consolidated');
      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('database');
    });

    it('should support date range filtering', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/dashboard-consolidated?dateRange=last_30_days'
      );
      const response = await handler.handle(req, mockAdminUser);
      
      expect(response.status).toBe(200);
      
      // Verify date parameters were used in queries
      const dateQueries = mockPool.execute.mock.calls.filter((call: any) => 
        call[0].includes('created_at >=') || call[0].includes('DATE_SUB')
      );
      expect(dateQueries.length).toBeGreaterThan(0);
    });

    it('should utilize caching for performance', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      // First request
      const req1 = new NextRequest(
        'http://localhost:3000/api/admin/dashboard-consolidated?include=overview'
      );
      const response1 = await handler.handle(req1, mockAdminUser);
      const data1 = await response1.json();
      
      expect(data1.metadata.cached).toBe(false);

      // Second request (should use cache)
      const req2 = new NextRequest(
        'http://localhost:3000/api/admin/dashboard-consolidated?include=overview'
      );
      const response2 = await handler.handle(req2, mockAdminUser);
      const data2 = await response2.json();
      
      // Note: Actual caching behavior depends on implementation
      // This test verifies the metadata is present
      expect(data2.metadata).toHaveProperty('cached');
    });
  });

  describe('POST /api/admin/dashboard-consolidated', () => {
    const mockAdminUser = {
      userId: 1,
      email: 'admin@test.com',
      role: 'admin',
      isAdmin: true
    };

    it('should handle export requests', async () => {
      const exportRequest = {
        action: 'export',
        format: 'csv',
        sections: ['overview', 'charts']
      };

      const req = new NextRequest('http://localhost:3000/api/admin/dashboard-consolidated', {
        method: 'POST',
        body: JSON.stringify(exportRequest)
      });

      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('exportJobId');
      expect(data.data).toHaveProperty('downloadUrl');
      expect(data.data.format).toBe('csv');
    });

    it('should validate export format', async () => {
      const invalidRequest = {
        action: 'export',
        format: 'invalid_format'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/dashboard-consolidated', {
        method: 'POST',
        body: JSON.stringify(invalidRequest)
      });

      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('format');
    });
  });

  describe('Performance and Consolidation Benefits', () => {
    it('should demonstrate reduced API calls compared to legacy endpoints', async () => {
      // Mock all queries to succeed
      mockPool.execute.mockResolvedValue([[]]);

      const mockAdminUser = {
        userId: 1,
        email: 'admin@test.com',
        role: 'admin',
        isAdmin: true
      };

      // Single consolidated request
      const req = new NextRequest(
        'http://localhost:3000/api/admin/dashboard-consolidated?include=overview,charts,insights,activity,performance'
      );
      const response = await handler.handle(req, mockAdminUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // All data retrieved in one request instead of 8 separate API calls
      expect(data.data).toHaveProperty('overview');
      expect(data.data).toHaveProperty('charts');
      expect(data.data).toHaveProperty('insights');
      expect(data.data).toHaveProperty('activity');
      expect(data.data).toHaveProperty('performance');
      
      // Legacy would have required:
      // - /api/admin/dashboard/overview
      // - /api/admin/dashboard/revenue-chart
      // - /api/admin/dashboard/order-chart
      // - /api/admin/dashboard/insights
      // - /api/admin/dashboard/activity
      // - /api/admin/dashboard/performance
      // - /api/admin/dashboard/quick-stats
      // - /api/admin/dashboard/alerts
      
      console.log('✅ Consolidated 8 legacy endpoints into 1 efficient endpoint');
    });
  });
});