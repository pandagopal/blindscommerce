/**
 * Test for V2 Content API - Rooms endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/v2/[service]/[...action]/route';

describe('V2 Content API - Rooms', () => {
  const mockRequest = (method: string, url: string, body?: any) => {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return req;
  };

  describe('GET /api/v2/content/rooms', () => {
    it('should fetch rooms for public users', async () => {
      const req = mockRequest('GET', '/api/v2/content/rooms');
      const params = Promise.resolve({ service: 'content', action: ['rooms'] });
      
      const response = await GET(req, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('rooms');
      expect(Array.isArray(data.data.rooms)).toBe(true);
    });
  });

  describe('POST /api/v2/content/rooms', () => {
    it('should require admin role to create rooms', async () => {
      const req = mockRequest('POST', '/api/v2/content/rooms', {
        name: 'Test Room',
        description: 'Test Description',
        is_active: true,
      });
      const params = Promise.resolve({ service: 'content', action: ['rooms'] });
      
      // Without auth, should fail
      const response = await POST(req, { params });
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v2/content/rooms/:id', () => {
    it('should require admin role to update rooms', async () => {
      const req = mockRequest('PUT', '/api/v2/content/rooms/1', {
        name: 'Updated Room',
      });
      const params = Promise.resolve({ service: 'content', action: ['rooms', '1'] });
      
      // Without auth, should fail
      const response = await PUT(req, { params });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v2/content/rooms/:id', () => {
    it('should require admin role to delete rooms', async () => {
      const req = mockRequest('DELETE', '/api/v2/content/rooms/1');
      const params = Promise.resolve({ service: 'content', action: ['rooms', '1'] });
      
      // Without auth, should fail
      const response = await DELETE(req, { params });
      expect(response.status).toBe(401);
    });
  });
});