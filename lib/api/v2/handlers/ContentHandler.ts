/**
 * Content Handler for V2 API
 * Handles public content endpoints
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export class ContentHandler extends BaseHandler {
  /**
   * Handle GET requests - public endpoints, no auth required
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'social-accounts': () => this.getSocialAccounts(),
      'rooms': () => this.getRooms(),
      'hero-banners': () => this.getHeroBanners(),
      'recently-viewed': () => this.getRecentlyViewed(req),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'recently-viewed': () => this.addRecentlyViewed(req),
    };

    return this.routeAction(action, routes);
  }

  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    throw new ApiError('Method not allowed', 405);
  }

  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    throw new ApiError('Method not allowed', 405);
  }

  private async getSocialAccounts() {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          id,
          platform,
          account_name as accountName,
          account_url as accountUrl,
          icon_class as iconClass,
          display_order as displayOrder,
          show_in_header as showInHeader,
          show_in_footer as showInFooter,
          is_active as isActive
        FROM social_media_accounts
        WHERE is_active = 1
        ORDER BY display_order ASC`
      );

      return {
        success: true,
        accounts: rows
      };
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      return {
        success: false,
        error: 'Failed to fetch social accounts',
        accounts: []
      };
    }
  }

  private async getRooms() {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          room_type_id,
          name,
          description,
          image_url,
          typical_humidity,
          light_exposure,
          privacy_requirements,
          created_at,
          updated_at
        FROM room_types
        ORDER BY name ASC`
      );

      return {
        success: true,
        rooms: rows
      };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return {
        success: false,
        error: 'Failed to fetch rooms',
        rooms: []
      };
    }
  }

  private async getHeroBanners() {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          banner_id,
          title,
          subtitle,
          description,
          background_image as image_url,
          right_side_image,
          primary_cta_text as button_text,
          primary_cta_link as button_link,
          secondary_cta_text,
          secondary_cta_link,
          is_active,
          display_order,
          created_at,
          updated_at
        FROM hero_banners
        WHERE is_active = 1
        ORDER BY display_order ASC, created_at DESC`
      );

      return {
        success: true,
        banners: rows
      };
    } catch (error) {
      console.error('Error fetching hero banners:', error);
      return {
        success: false,
        error: 'Failed to fetch hero banners',
        banners: []
      };
    }
  }

  private async getRecentlyViewed(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // For now, return empty array since we don't have the recently viewed tracking implemented
    return {
      success: true,
      products: [],
      sessionId: sessionId,
      limit: limit
    };
  }

  private async addRecentlyViewed(req: NextRequest) {
    try {
      const data = await req.json();
      const { productId, sessionId } = data;

      // For now, just acknowledge the request
      return {
        success: true,
        message: 'Product view recorded',
        productId,
        sessionId
      };
    } catch (error) {
      console.error('Error recording product view:', error);
      return {
        success: false,
        error: 'Failed to record product view'
      };
    }
  }
}