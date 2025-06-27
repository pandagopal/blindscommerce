/**
 * Content Service
 * Handles hero banners, rooms, and other content management
 */

import { BaseService } from './BaseService';

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

export class ContentService extends BaseService {
  async getHeroBanners(): Promise<{ banners: HeroBanner[] }> {
    try {
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
      return { banners: result };
    } catch (error) {
      console.error('Error fetching hero banners:', error);
      return { banners: [] };
    }
  }

  async getRooms(): Promise<{ rooms: Room[] }> {
    try {
      const query = `
        SELECT 
          room_type_id,
          name,
          description,
          image_url,
          typical_humidity,
          light_exposure,
          privacy_requirements
        FROM room_types
        ORDER BY name ASC
      `;

      const result = await this.executeQuery<Room>(query);
      return { rooms: result };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { rooms: [] };
    }
  }
}