/**
 * Search Service Handler
 * Handles visual search and image-based product discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { ProductService } from '@/lib/services/ProductService';
import { getPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
  roomTypes?: string[];
  colors?: string[];
}

export class SearchHandler extends BaseHandler {
  protected serviceName = 'search';

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'visual': () => this.visualSearch(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * POST /api/v2/search/visual
   * Perform visual search on uploaded image
   */
  private async visualSearch(req: NextRequest, user: any) {
    const body = await this.getBody(req);
    const { image, searchType, filters } = body;

    if (!image) {
      throw new ApiError('Image data is required', 400);
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      throw new ApiError('Invalid image format', 400);
    }

    // Analyze the image to extract color and style information
    const analysis = await this.analyzeImage(image);

    // Search for products based on visual analysis
    const results = await this.searchProducts(analysis, filters);

    return {
      results,
      analysis,
      total: results.length
    };
  }

  /**
   * Analyze image to extract visual features
   */
  private async analyzeImage(imageData: string): Promise<any> {
    // In a production environment, this would use:
    // - TensorFlow.js for object detection
    // - Color extraction algorithms
    // - Style classification models
    // - Material identification

    // For now, return a structured analysis
    // The frontend's TensorFlow.js can do more advanced detection
    return {
      style: 'modern',
      dominantColors: ['white', 'gray', 'beige'],
      materialsSuggested: ['fabric', 'wood'],
      lightingCondition: 'bright',
      confidenceScore: 0.75
    };
  }

  /**
   * Search products based on visual analysis
   */
  private async searchProducts(analysis: any, filters: SearchFilters = {}): Promise<any[]> {
    const pool = await getPool();

    // Build query conditions
    const conditions: string[] = ['p.is_active = 1', 'p.status = "active"'];
    const params: any[] = [];

    // Apply price filters
    if (filters.minPrice !== undefined) {
      conditions.push('p.base_price >= ?');
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push('p.base_price <= ?');
      params.push(filters.maxPrice);
    }

    // Apply category filters
    if (filters.categories && filters.categories.length > 0) {
      const placeholders = filters.categories.map(() => '?').join(',');
      conditions.push(`c.name IN (${placeholders})`);
      params.push(...filters.categories);
    }

    // Apply room type filters
    if (filters.roomTypes && filters.roomTypes.length > 0) {
      const placeholders = filters.roomTypes.map(() => '?').join(',');
      conditions.push(`pr.room_type IN (${placeholders})`);
      params.push(...filters.roomTypes);
    }

    // Apply color filters based on analysis (optional - don't filter if no colors provided)
    // Colors are used for scoring instead of hard filtering

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.slug,
        p.base_price,
        p.short_description,
        p.primary_image_url,
        p.rating,
        p.review_count,
        c.name as category_name,
        GROUP_CONCAT(DISTINCT pco.color_name) as available_colors
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_rooms pr ON p.product_id = pr.product_id
      LEFT JOIN product_colors pco ON p.product_id = pco.product_id
      ${whereClause}
      GROUP BY p.product_id
      ORDER BY p.rating DESC, p.review_count DESC
      LIMIT 20
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Add match scores to results
    return rows.map((product: any) => ({
      ...product,
      matchScore: this.calculateMatchScore(product, analysis),
      matchReasons: this.getMatchReasons(product, analysis)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate how well a product matches the visual analysis
   */
  private calculateMatchScore(product: any, analysis: any): number {
    let score = 50; // Base score

    // Color matching
    if (analysis.dominantColors && product.available_colors) {
      const productColors = product.available_colors.toLowerCase().split(',');
      const matchingColors = analysis.dominantColors.filter((color: string) =>
        productColors.some((pc: string) => pc.includes(color.toLowerCase()))
      );
      score += matchingColors.length * 10;
    }

    // Rating bonus
    if (product.rating) {
      score += (product.rating / 5) * 20;
    }

    // Review count bonus (popular products)
    if (product.review_count > 10) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate reasons why a product matches
   */
  private getMatchReasons(product: any, analysis: any): string[] {
    const reasons: string[] = [];

    // Color matching
    if (analysis.dominantColors && product.available_colors) {
      const productColors = product.available_colors.toLowerCase().split(',');
      const matchingColors = analysis.dominantColors.filter((color: string) =>
        productColors.some((pc: string) => pc.includes(color.toLowerCase()))
      );
      if (matchingColors.length > 0) {
        reasons.push(`Matches your color palette (${matchingColors.join(', ')})`);
      }
    }

    // Style matching
    if (analysis.style) {
      reasons.push(`${analysis.style.charAt(0).toUpperCase() + analysis.style.slice(1)} style`);
    }

    // Rating
    if (product.rating >= 4) {
      reasons.push(`Highly rated (${product.rating}/5)`);
    }

    // Popular
    if (product.review_count > 50) {
      reasons.push(`Popular choice (${product.review_count} reviews)`);
    }

    return reasons;
  }
}
