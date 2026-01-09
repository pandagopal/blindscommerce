/**
 * Content Service
 * Handles hero banners, rooms, and other content management
 */

import { BaseService } from './BaseService';
import { getCache, setCache } from '@/lib/cache/cacheManager';

export interface HeroBanner {
  banner_id: number;
  title: string;
  subtitle: string;
  description: string;
  background_image: string;
  right_side_image?: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  display_order: number;
  is_active: boolean;
}

export interface Room {
  room_type_id: number;
  name: string;
  description?: string;
  image_url?: string;
  typical_humidity?: string;
  light_exposure?: string;
  privacy_requirements?: string;
}

export interface Review {
  review_id: number;
  product_name: string;
  user_name: string;
  rating: number;
  title: string;
  review_text: string;
  created_at: string;
}

export class ContentService extends BaseService {
  async getHeroBanners(): Promise<{ banners: HeroBanner[] }> {
    try {
      const cacheKey = 'hero-banners:active=true';

      // Try to get from cache first
      const cached = await getCache<HeroBanner[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached hero banners (service)');
        return { banners: cached };
      }

      const query = `
        SELECT
          banner_id,
          title,
          subtitle,
          description,
          background_image,
          right_side_image,
          primary_cta_text,
          primary_cta_link,
          secondary_cta_text,
          secondary_cta_link,
          display_order,
          is_active
        FROM hero_banners
        WHERE is_active = 1
        ORDER BY display_order ASC
      `;

      const result = await this.executeQuery<HeroBanner>(query);

      // Cache the result for 5 minutes
      await setCache(cacheKey, result, 300);

      return { banners: result };
    } catch (error) {
      console.error('Error fetching hero banners:', error);
      return { banners: [] };
    }
  }

  async getRooms(activeOnly: boolean = true): Promise<{ rooms: Room[] }> {
    try {
      const cacheKey = `rooms:activeOnly=${activeOnly}`;

      // Try to get from cache first
      const cached = await getCache<Room[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached rooms (service)');
        return { rooms: cached };
      }

      const query = `
        SELECT
          room_type_id,
          name,
          description,
          image_url,
          typical_humidity,
          light_exposure,
          privacy_requirements,
          is_active
        FROM room_types
        ${activeOnly ? 'WHERE is_active = 1' : ''}
        ORDER BY name ASC
      `;

      const result = await this.executeQuery<Room>(query);

      // Cache the result for 5 minutes
      await setCache(cacheKey, result, 300);

      return { rooms: result };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { rooms: [] };
    }
  }

  async getReviews(limit: number = 10): Promise<{ reviews: Review[] }> {
    try {
      // Validate limit is a positive integer
      const validatedLimit = Math.max(1, Math.floor(limit));
      const cacheKey = `reviews:limit=${validatedLimit}`;

      // Try to get from cache first
      const cached = await getCache<Review[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached reviews');
        return { reviews: cached };
      }

      const query = `
        SELECT
          pr.review_id,
          p.name as product_name,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), pr.guest_name) as user_name,
          pr.rating,
          pr.title,
          pr.review_text,
          pr.created_at
        FROM product_reviews pr
        LEFT JOIN products p ON pr.product_id = p.product_id
        LEFT JOIN users u ON pr.user_id = u.user_id
        WHERE pr.is_approved = 1
        AND pr.rating >= 4
        ORDER BY pr.created_at DESC
        LIMIT ${validatedLimit}
      `;

      const result = await this.executeQuery<Review>(query);

      // Cache the result for 5 minutes
      await setCache(cacheKey, result, 300);

      return { reviews: result };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { reviews: [] };
    }
  }
}