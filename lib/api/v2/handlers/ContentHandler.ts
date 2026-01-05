/**
 * Content Handler for V2 API
 * Handles public content endpoints
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getCache, setCache, deleteCachePattern } from '@/lib/cache/cacheManager';

export class ContentHandler extends BaseHandler {
  /**
   * Handle GET requests - public endpoints, no auth required
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'social-accounts': () => this.getSocialAccounts(),
      'rooms': () => this.getRooms(user),
      'hero-banners': () => this.getHeroBanners(),
      'recently-viewed': () => this.getRecentlyViewed(req),
      'email-templates': () => this.getEmailTemplates(user),
      'email-templates/:name': () => this.getEmailTemplate(action[1]),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'recently-viewed': () => this.addRecentlyViewed(req),
      'rooms': () => this.createRoom(req, user),
      'rooms/upload': () => this.uploadRoomImage(req, user),
      'email-queue': () => this.queueEmail(req, user),
      'email-queue/process': () => this.processEmailQueue(user),
    };

    return this.routeAction(action, routes);
  }

  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'rooms/*': () => this.updateRoom(req, action, user),
    };

    return this.routeAction(action, routes);
  }

  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'rooms/*': () => this.deleteRoom(action, user),
    };

    return this.routeAction(action, routes);
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

  private async getRooms(user: any) {
    try {
      // For admin users, get all rooms including inactive ones
      const isAdmin = user?.role === 'ADMIN';
      const cacheKey = `rooms:admin=${isAdmin}`;

      // Try to get from cache first
      const cached = await getCache<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached rooms');
        return {
          success: true,
          rooms: cached
        };
      }

      const pool = await getPool();
      const whereClause = isAdmin ? '' : 'WHERE is_active = 1';

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          room_type_id,
          name,
          description,
          image_url,
          typical_humidity,
          light_exposure,
          privacy_requirements,
          recommended_products,
          is_active,
          created_at,
          updated_at
        FROM room_types
        ${whereClause}
        ORDER BY name ASC`
      );

      // Cache the result for 5 minutes
      await setCache(cacheKey, rows, 300);

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
      const cacheKey = 'hero-banners:active=true';

      // Try to get from cache first
      const cached = await getCache<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached hero banners');
        return {
          success: true,
          banners: cached
        };
      }

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

      // Cache the result for 5 minutes
      await setCache(cacheKey, rows, 300);

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

  private async createRoom(req: NextRequest, user: any) {
    this.requireRole(user, 'ADMIN');
    
    try {
      const data = await req.json();
      const {
        name,
        description,
        image_url,
        typical_humidity,
        light_exposure,
        privacy_requirements,
        recommended_products,
        is_active = true
      } = data;

      const pool = await getPool();
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO room_types (
          name, description, image_url, typical_humidity,
          light_exposure, privacy_requirements, recommended_products, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          image_url || null,
          typical_humidity || null,
          light_exposure || null,
          privacy_requirements || null,
          recommended_products || null,
          is_active ? 1 : 0
        ]
      );

      // Invalidate rooms cache
      deleteCachePattern('rooms:*');
      console.log('🗑️  Cleared rooms cache after create');

      return {
        success: true,
        room_type_id: result.insertId,
        message: 'Room created successfully'
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw new ApiError('Failed to create room', 500);
    }
  }

  private async updateRoom(req: NextRequest, action: string[], user: any) {
    this.requireRole(user, 'ADMIN');
    
    const roomId = action[1];
    if (!roomId || isNaN(parseInt(roomId))) {
      throw new ApiError('Invalid room ID', 400);
    }

    try {
      const data = await req.json();
      const {
        name,
        description,
        image_url,
        typical_humidity,
        light_exposure,
        privacy_requirements,
        recommended_products,
        is_active
      } = data;

      const pool = await getPool();
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE room_types SET
          name = ?,
          description = ?,
          image_url = ?,
          typical_humidity = ?,
          light_exposure = ?,
          privacy_requirements = ?,
          recommended_products = ?,
          is_active = ?,
          updated_at = NOW()
        WHERE room_type_id = ?`,
        [
          name,
          description || null,
          image_url || null,
          typical_humidity || null,
          light_exposure || null,
          privacy_requirements || null,
          recommended_products || null,
          is_active ? 1 : 0,
          parseInt(roomId)
        ]
      );

      if (result.affectedRows === 0) {
        throw new ApiError('Room not found', 404);
      }

      // Invalidate rooms cache
      deleteCachePattern('rooms:*');
      console.log('🗑️  Cleared rooms cache after update');

      return {
        success: true,
        message: 'Room updated successfully'
      };
    } catch (error) {
      console.error('Error updating room:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update room', 500);
    }
  }

  private async deleteRoom(action: string[], user: any) {
    this.requireRole(user, 'ADMIN');
    
    const roomId = action[1];
    if (!roomId || isNaN(parseInt(roomId))) {
      throw new ApiError('Invalid room ID', 400);
    }

    try {
      const pool = await getPool();
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM room_types WHERE room_type_id = ?',
        [parseInt(roomId)]
      );

      if (result.affectedRows === 0) {
        throw new ApiError('Room not found', 404);
      }

      // Invalidate rooms cache
      deleteCachePattern('rooms:*');
      console.log('🗑️  Cleared rooms cache after delete');

      return {
        success: true,
        message: 'Room deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting room:', error);
      throw new ApiError('Failed to delete room', 500);
    }
  }

  private async uploadRoomImage(req: NextRequest, user: any) {
    this.requireRole(user, 'ADMIN');
    
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new ApiError('No file provided', 400);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new ApiError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400);
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new ApiError('File size too large. Maximum 5MB allowed', 400);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `room_${randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'rooms');
      const filePath = join(uploadDir, filename);

      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });

      // Save file
      await writeFile(filePath, buffer);

      return {
        success: true,
        url: `/uploads/rooms/${filename}`,
        filename
      };
    } catch (error) {
      console.error('Error uploading room image:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to upload image', 500);
    }
  }

  /**
   * Get all email templates
   */
  private async getEmailTemplates(user: any) {
    try {
      // Only admins can view email templates
      if (user?.role !== 'ADMIN') {
        throw new ApiError('Unauthorized', 403);
      }

      const pool = await getPool();
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          template_id,
          name,
          subject,
          body,
          variables,
          is_active
        FROM email_templates
        ORDER BY name ASC`
      );

      return {
        success: true,
        templates: rows.map(row => ({
          ...row,
          variables: JSON.parse(row.variables || '{}')
        }))
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching email templates:', error);
      throw new ApiError('Failed to fetch email templates', 500);
    }
  }

  /**
   * Get a specific email template by name
   */
  private async getEmailTemplate(templateName: string) {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM email_templates WHERE name = ? AND is_active = 1',
        [templateName]
      );

      if (rows.length === 0) {
        throw new ApiError('Email template not found', 404);
      }

      const template = rows[0];
      return {
        success: true,
        template: {
          ...template,
          variables: JSON.parse(template.variables || '{}')
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching email template:', error);
      throw new ApiError('Failed to fetch email template', 500);
    }
  }

  /**
   * Queue an email for sending
   */
  private async queueEmail(req: NextRequest, user: any) {
    try {
      const body = await this.getRequestBody(req);
      const { templateName, recipientEmail, recipientName, variables } = body;

      if (!templateName || !recipientEmail) {
        throw new ApiError('Missing required fields: templateName, recipientEmail', 400);
      }

      // Get the email template
      const pool = await getPool();
      const [templateRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM email_templates WHERE name = ? AND is_active = 1',
        [templateName]
      );

      if (templateRows.length === 0) {
        throw new ApiError(`Email template '${templateName}' not found`, 404);
      }

      const template = templateRows[0];

      // Replace variables in subject and body
      const replaceVariables = (text: string, vars: Record<string, any>) => {
        return text.replace(/\{([^}]+)\}/g, (match, key) => {
          return vars[key] || match;
        });
      };

      const subject = replaceVariables(template.subject, variables || {});
      const emailBody = replaceVariables(template.body, variables || {});

      // Queue the email
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO email_queue (
          template_id,
          recipient_email,
          recipient_name,
          subject,
          body,
          variables,
          status,
          next_retry_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          template.template_id,
          recipientEmail,
          recipientName || null,
          subject,
          emailBody,
          JSON.stringify(variables || {}),
        ]
      );

      return {
        success: true,
        emailId: result.insertId,
        message: 'Email queued successfully'
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error queueing email:', error);
      throw new ApiError('Failed to queue email', 500);
    }
  }

  /**
   * Process email queue - admin only
   */
  private async processEmailQueue(user: any) {
    try {
      // Only admins can process email queue
      if (user?.role !== 'ADMIN') {
        throw new ApiError('Unauthorized', 403);
      }

      const pool = await getPool();
      
      // Get pending emails that are ready to be sent
      const [emails] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM email_queue 
         WHERE status = 'pending' 
         AND next_retry_at <= NOW() 
         AND retry_count < 3 
         ORDER BY created_at ASC 
         LIMIT 10`
      );

      return {
        success: true,
        message: `Found ${emails.length} emails to process`,
        count: emails.length,
        emails: emails.map(email => ({
          email_id: email.email_id,
          recipient_email: email.recipient_email,
          subject: email.subject,
          status: email.status,
          retry_count: email.retry_count
        }))
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error processing email queue:', error);
      throw new ApiError('Failed to process email queue', 500);
    }
  }
}