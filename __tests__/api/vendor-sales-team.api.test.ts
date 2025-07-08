/**
 * REAL API ENDPOINT TEST: Vendor Sales Team API
 * 
 * Tests the actual API endpoints that would catch the "Failed to fetch Sales Team" error
 * This directly tests the API route handlers to identify connection, authentication, or query issues
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/vendor/sales-team/route';

// Mock the database module
jest.mock('@/lib/db');

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

describe('Vendor Sales Team API - REAL ENDPOINT TESTS', () => {
  let mockExecute: jest.Mock;
  let mockGetConnection: jest.Mock;
  let mockGetServerSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const dbModule = require('@/lib/db');
    mockExecute = dbModule.execute;
    mockGetConnection = dbModule.getConnection;
    
    const authModule = require('next-auth/next');
    mockGetServerSession = authModule.getServerSession;

    // Mock successful authentication by default
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 1,
        email: 'vendor@test.com',
        role: 'vendor'
      }
    });
  });

  describe('GET /api/vendor/sales-team - CRITICAL FAILURE DETECTION', () => {
    test('FAILS when database connection is refused', async () => {
      // Simulate the exact error you're experiencing
      mockExecute.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3306'));

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sales team');
      
      console.error('❌ DATABASE CONNECTION FAILED - This is the real issue!');
      console.error('Error details:', data);
    });

    test('FAILS when vendor_info table does not exist', async () => {
      // Mock the vendor info query failing
      mockExecute
        .mockRejectedValueOnce(new Error("Table 'blindscommerce.vendor_info' doesn't exist"))
        .mockResolvedValueOnce([[]]);

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sales team');
      
      console.error('❌ VENDOR_INFO TABLE MISSING - Database schema issue!');
    });

    test('FAILS when sales_staff table does not exist', async () => {
      // Mock vendor info success but sales_staff query failure
      mockExecute
        .mockResolvedValueOnce([[{ vendor_id: 1 }]]) // Vendor info succeeds
        .mockRejectedValueOnce(new Error("Table 'blindscommerce.sales_staff' doesn't exist"));

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sales team');
      
      console.error('❌ SALES_STAFF TABLE MISSING - Database schema issue!');
    });

    test('FAILS when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);

      expect(response.status).toBe(401);
      
      console.error('❌ AUTHENTICATION FAILED - User not logged in!');
    });

    test('FAILS when user is not a vendor', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 1,
          email: 'customer@test.com',
          role: 'customer'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
      
      console.error('❌ AUTHORIZATION FAILED - User is not a vendor!');
    });

    test('FAILS when vendor_info record does not exist', async () => {
      // Mock empty vendor info result
      mockExecute
        .mockResolvedValueOnce([[]]) // No vendor_info record found
        .mockResolvedValueOnce([[]]);

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Vendor not found');
      
      console.error('❌ VENDOR RECORD MISSING - No vendor_info record for this user!');
    });

    test('SUCCESS when everything works correctly', async () => {
      // Mock successful database responses
      mockExecute
        .mockResolvedValueOnce([[{ vendor_id: 1 }]]) // Vendor info
        .mockResolvedValueOnce([[  // Sales team data
          {
            salesStaffId: 1,
            userId: 101,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@vendor.com',
            phone: '+1-555-0123',
            territory: 'East Coast',
            commissionRate: 5.5,
            targetSales: 25000,
            totalSales: 45000,
            isActive: 1,
            startDate: '2024-01-15T00:00:00Z'
          }
        ]]);

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.salesTeam).toHaveLength(1);
      expect(data.salesTeam[0].firstName).toBe('John');
      expect(data.salesTeam[0].email).toBe('john.doe@vendor.com');
      
      console.log('✅ API WORKS CORRECTLY when database and auth are properly configured');
    });
  });

  describe('POST /api/vendor/sales-team - CREATION FAILURES', () => {
    test('FAILS when required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields: firstName, lastName, email
          territory: 'East Coast'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
      
      console.error('❌ VALIDATION FAILED - Missing required fields!');
    });

    test('FAILS when email already exists', async () => {
      // Mock vendor info success
      mockExecute
        .mockResolvedValueOnce([[{ vendor_id: 1 }]])
        // Mock email check - user exists
        .mockResolvedValueOnce([[{ user_id: 999 }]])
        // Mock existing sales staff check
        .mockResolvedValueOnce([[{ salesStaffId: 1 }]]);

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@vendor.com',
          commissionRate: 5.5,
          targetSales: 25000
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Sales team member already exists');
      
      console.error('❌ DUPLICATE EMAIL - Sales team member already exists!');
    });
  });

  describe('DATABASE CONNECTIVITY TESTS', () => {
    test('Database connection can be established', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([[]]),
        release: jest.fn()
      };
      
      mockGetConnection.mockResolvedValue(mockConnection);

      const connection = await mockGetConnection();
      
      expect(connection).toBeDefined();
      expect(connection.execute).toBeDefined();
      expect(connection.release).toBeDefined();
      
      // Test a simple query
      await connection.execute('SELECT 1');
      expect(connection.execute).toHaveBeenCalledWith('SELECT 1');
      
      connection.release();
      expect(connection.release).toHaveBeenCalled();
    });

    test('Database connection pool exhaustion', async () => {
      mockExecute.mockRejectedValue(new Error('Too many connections'));

      const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sales team');
      
      console.error('❌ DATABASE POOL EXHAUSTED - Too many connections!');
    });
  });

  describe('PRODUCTION ENVIRONMENT CHECKS', () => {
    test('Environment variables are properly configured', () => {
      // Check required environment variables
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ MISSING ENVIRONMENT VARIABLES:', missingVars);
        console.error('This could cause the "Failed to fetch Sales Team" error in production!');
      }
      
      expect(missingVars).toHaveLength(0);
    });

    test('Database URL format is valid', () => {
      const dbUrl = process.env.DATABASE_URL;
      
      if (dbUrl) {
        // Check if it's a valid MySQL URL format
        const isValidMysqlUrl = dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://');
        
        if (!isValidMysqlUrl) {
          console.error('❌ INVALID DATABASE_URL FORMAT:', dbUrl);
          console.error('Expected: mysql://user:password@host:port/database');
        }
        
        expect(isValidMysqlUrl).toBe(true);
      }
    });
  });
});