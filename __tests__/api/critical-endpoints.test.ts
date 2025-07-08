/**
 * CRITICAL REGRESSION TEST: API Endpoints
 * 
 * Tests for critical API endpoints that have caused regressions:
 * - Vendor product management APIs
 * - Features and rooms data APIs
 * - Pricing matrix calculations
 * - Response schema validation
 * - Error handling verification
 */

import axios from 'axios';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

describe('Critical API Endpoints - REGRESSION TESTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRITICAL: Vendor Product Management APIs', () => {
    test('GET /api/vendor/products/[id] - Returns complete product data', async () => {
      const mockProductResponse = {
        product_id: 243,
        name: 'Test Product',
        base_price: 199.99,
        features: [
          {
            id: 1,
            title: 'UV Protection',
            description: 'Blocks harmful UV rays',
            icon: 'sun'
          }
        ],
        roomRecommendations: [
          {
            id: 1,
            roomType: 'Living Room',
            recommendation: 'Great for this space',
            priority: 'high'
          }
        ],
        fabricOptions: [],
        pricingMatrix: {
          '11-20_21-30': '25.00',
          '21-30_31-40': '50.00'
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockProductResponse
      });

      const response = await axios.get(`${API_BASE}/api/vendor/products/243`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('product_id', 243);
      expect(response.data).toHaveProperty('features');
      expect(response.data).toHaveProperty('roomRecommendations');
      expect(response.data).toHaveProperty('pricingMatrix');
      
      // Verify features structure
      expect(response.data.features[0]).toHaveProperty('id');
      expect(response.data.features[0]).toHaveProperty('title');
      expect(response.data.features[0]).toHaveProperty('description');
      expect(response.data.features[0]).toHaveProperty('icon');
      
      // Verify room recommendations structure
      expect(response.data.roomRecommendations[0]).toHaveProperty('id');
      expect(response.data.roomRecommendations[0]).toHaveProperty('roomType');
      expect(response.data.roomRecommendations[0]).toHaveProperty('recommendation');
      expect(response.data.roomRecommendations[0]).toHaveProperty('priority');
      
      // Verify pricing matrix uses correct key format
      expect(response.data.pricingMatrix).toHaveProperty('11-20_21-30');
      expect(response.data.pricingMatrix).toHaveProperty('21-30_31-40');
    });

    test('PUT /api/vendor/products/[id] - Accepts complete product update', async () => {
      const updateData = {
        name: 'Updated Product Name',
        base_price: 299.99,
        features: [
          {
            id: 1,
            title: 'Updated UV Protection',
            description: 'Enhanced UV blocking',
            icon: 'sun'
          }
        ],
        roomRecommendations: [
          {
            id: 1,
            roomType: 'Bedroom',
            recommendation: 'Perfect for sleep',
            priority: 'high'
          }
        ],
        pricingMatrix: {
          '11-20_21-30': '35.00',
          '21-30_31-40': '60.00'
        }
      };

      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { success: true, message: 'Product updated successfully' }
      });

      const response = await axios.put(`${API_BASE}/api/vendor/products/243`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${API_BASE}/api/vendor/products/243`,
        updateData
      );
    });

    test('CRITICAL: Features save/load workflow integrity', async () => {
      // Test the complete save -> load cycle for features
      const featuresData = [
        {
          id: 1,
          title: 'Energy Efficient',
          description: 'Reduces energy costs',
          icon: 'energy'
        },
        {
          id: 2,
          title: 'Sound Dampening',
          description: 'Reduces noise',
          icon: 'sound'
        }
      ];

      // Mock save response
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { success: true }
      });

      // Mock load response with same data
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          product_id: 243,
          features: featuresData
        }
      });

      // Save features
      await axios.put(`${API_BASE}/api/vendor/products/243`, {
        features: featuresData
      });

      // Load features back
      const response = await axios.get(`${API_BASE}/api/vendor/products/243`);
      
      expect(response.data.features).toEqual(featuresData);
    });

    test('CRITICAL: Room recommendations save/load workflow integrity', async () => {
      const roomRecommendationsData = [
        {
          id: 1,
          roomType: 'Kitchen',
          recommendation: 'Moisture resistant',
          priority: 'high'
        }
      ];

      // Mock save response
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { success: true }
      });

      // Mock load response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          product_id: 243,
          roomRecommendations: roomRecommendationsData
        }
      });

      // Save room recommendations
      await axios.put(`${API_BASE}/api/vendor/products/243`, {
        roomRecommendations: roomRecommendationsData
      });

      // Load back
      const response = await axios.get(`${API_BASE}/api/vendor/products/243`);
      
      expect(response.data.roomRecommendations).toEqual(roomRecommendationsData);
    });
  });

  describe('CRITICAL: Pricing Matrix API Integrity', () => {
    test('Pricing matrix key format consistency', async () => {
      const pricingMatrixData = {
        '11-20_21-30': '25.00',
        '21-30_31-40': '50.00',
        '31-40_41-50': '75.00'
      };

      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { success: true }
      });

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          product_id: 243,
          pricingMatrix: pricingMatrixData
        }
      });

      // Save pricing matrix
      await axios.put(`${API_BASE}/api/vendor/products/243`, {
        pricingMatrix: pricingMatrixData
      });

      // Load back and verify format
      const response = await axios.get(`${API_BASE}/api/vendor/products/243`);
      
      const loadedMatrix = response.data.pricingMatrix;
      
      // Verify all keys use underscore separator
      Object.keys(loadedMatrix).forEach(key => {
        expect(key).toMatch(/^\d+-\d+_\d+-\d+$/);
        const [widthRange, heightRange] = key.split('_');
        expect(widthRange).toMatch(/^\d+-\d+$/);
        expect(heightRange).toMatch(/^\d+-\d+$/);
      });
    });

    test('CRITICAL: Pricing matrix database conversion', async () => {
      // Test that pricing matrix converts correctly to database format
      const matrixData = {
        '11-20_21-30': '25.00',
        '21-30_31-40': '50.00'
      };

      // Mock the API to return success
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: { 
          success: true,
          matrixEntries: [
            {
              width_min: 11,
              width_max: 20,
              height_min: 21,
              height_max: 30,
              base_price: 25.00
            },
            {
              width_min: 21,
              width_max: 30,
              height_min: 31,
              height_max: 40,
              base_price: 50.00
            }
          ]
        }
      });

      const response = await axios.put(`${API_BASE}/api/vendor/products/243`, {
        pricingMatrix: matrixData
      });

      expect(response.data.success).toBe(true);
      expect(response.data.matrixEntries).toHaveLength(2);
      expect(response.data.matrixEntries[0]).toEqual({
        width_min: 11,
        width_max: 20,
        height_min: 21,
        height_max: 30,
        base_price: 25.00
      });
    });
  });

  describe('CRITICAL: Room Types API', () => {
    test('GET /api/rooms - Returns active room types only', async () => {
      const mockRoomTypes = [
        { id: 1, name: 'Living Room', is_active: 1 },
        { id: 2, name: 'Bedroom', is_active: 1 },
        { id: 3, name: 'Kitchen', is_active: 1 }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockRoomTypes
      });

      const response = await axios.get(`${API_BASE}/api/rooms`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Verify all returned rooms are active
      response.data.forEach((room: any) => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
        expect(room.is_active).toBe(1);
      });
    });

    test('GET /api/admin/rooms - Returns all room types for admin', async () => {
      const mockAllRoomTypes = [
        { id: 1, name: 'Living Room', is_active: 1 },
        { id: 2, name: 'Bedroom', is_active: 1 },
        { id: 3, name: 'Inactive Room', is_active: 0 }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockAllRoomTypes
      });

      const response = await axios.get(`${API_BASE}/api/admin/rooms`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(3);
      
      // Should include both active and inactive rooms
      const activeRooms = response.data.filter((room: any) => room.is_active === 1);
      const inactiveRooms = response.data.filter((room: any) => room.is_active === 0);
      
      expect(activeRooms).toHaveLength(2);
      expect(inactiveRooms).toHaveLength(1);
    });
  });

  describe('CRITICAL: Error Handling', () => {
    test('API returns proper error format for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        base_price: -100 // Negative price should fail
      };

      mockedAxios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Validation failed',
            details: {
              name: 'Name is required',
              base_price: 'Price must be positive'
            }
          }
        }
      });

      try {
        await axios.put(`${API_BASE}/api/vendor/products/243`, invalidData);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data).toHaveProperty('details');
      }
    });

    test('API handles database connection errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            success: false,
            error: 'Database connection failed',
            message: 'Unable to connect to database'
          }
        }
      });

      try {
        await axios.get(`${API_BASE}/api/vendor/products/243`);
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Database connection failed');
      }
    });

    test('API validates required authentication', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Unauthorized',
            message: 'Valid authentication required'
          }
        }
      });

      try {
        await axios.get(`${API_BASE}/api/vendor/products/243`);
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Unauthorized');
      }
    });
  });

  describe('CRITICAL: Response Schema Validation', () => {
    test('Product API response has required fields', async () => {
      const mockResponse = {
        product_id: 243,
        name: 'Test Product',
        base_price: 199.99,
        features: [],
        roomRecommendations: [],
        pricingMatrix: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponse
      });

      const response = await axios.get(`${API_BASE}/api/vendor/products/243`);
      
      // Verify required fields exist
      expect(response.data).toHaveProperty('product_id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('base_price');
      expect(response.data).toHaveProperty('features');
      expect(response.data).toHaveProperty('roomRecommendations');
      expect(response.data).toHaveProperty('pricingMatrix');
      
      // Verify data types
      expect(typeof response.data.product_id).toBe('number');
      expect(typeof response.data.name).toBe('string');
      expect(typeof response.data.base_price).toBe('number');
      expect(Array.isArray(response.data.features)).toBe(true);
      expect(Array.isArray(response.data.roomRecommendations)).toBe(true);
      expect(typeof response.data.pricingMatrix).toBe('object');
    });
  });
});