/**
 * Product Service for BlindsCommerce
 * Handles all product-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket } from 'mysql2';
import { parseProductPrices, parseArrayPrices, parseDecimal } from '@/lib/utils/priceUtils';

interface Product extends RowDataPacket {
  product_id: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  short_description?: string;
  full_description?: string;
  base_price: number;
  cost_price?: number;
  category_id?: number;
  primary_image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  rating?: number;
  review_count?: number;
  created_at: Date;
  updated_at: Date;
}

interface ProductWithDetails extends Product {
  category_name?: string;
  category_slug?: string;
  vendor_price?: number;
  discount_type?: string;
  discount_value?: number;
  images?: Array<{ image_id: number; image_url: string; is_primary: boolean }>;
  features?: Array<{ feature_id: number; name: string; value: string }>;
}

interface ProductPricing extends RowDataPacket {
  product_id: number;
  base_price: number;
  vendor_price?: number;
  customer_price?: number;
  volume_discount?: number;
  coupon_discount?: number;
  final_price: number;
}

export class ProductService extends BaseService {
  constructor() {
    super('products', 'product_id');
  }

  /**
   * Get product with all details in a single optimized query
   */
  async getProductWithDetails(
    productId: number,
    customerId?: number,
    vendorId?: number
  ): Promise<ProductWithDetails | null> {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(vp.vendor_id, p.vendor_id) as vendor_id,
        vp.vendor_price,
        vd.discount_type,
        vd.discount_value,
        COALESCE(vp.vendor_price, p.base_price) as effective_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id 
        ${vendorId ? 'AND vp.vendor_id = ?' : ''}
      LEFT JOIN vendor_discounts vd ON vp.vendor_id = vd.vendor_id 
        AND vd.is_active = 1
        AND (vd.valid_from IS NULL OR vd.valid_from <= NOW())
        AND (vd.valid_until IS NULL OR vd.valid_until >= NOW())
      WHERE p.product_id = ? AND p.is_active = 1
      LIMIT 1
    `;

    const params = [];
    if (vendorId) params.push(vendorId);
    params.push(productId);

    const rows = await this.executeQuery<ProductWithDetails>(query, params);
    
    if (rows.length === 0) {
      return null;
    }
    
    const product = parseProductPrices(rows[0]);
    
    // Get images and features in parallel
    const result = await this.executeParallel<{
      images: any[] | null;
      features: any[] | null;
    }>({
      images: {
        query: 'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order',
        params: [productId]
      },
      features: {
        query: `
          SELECT pf.*, f.name, f.description 
          FROM product_features pf
          JOIN features f ON pf.feature_id = f.feature_id
          WHERE pf.product_id = ?
          ORDER BY f.display_order
        `,
        params: [productId]
      }
    });

    // Safely handle null values and transform field names
    const images = result?.images || [];
    const features = result?.features || [];

    // Transform image field names to match frontend expectations
    product.images = images.map(img => ({
      id: img.image_id?.toString() || '',
      url: img.image_url || '',
      alt: img.alt_text || '',
      isPrimary: img.is_primary === 1,
      display_order: img.display_order || 0
    }));
    product.features = features;
    
    return product;
  }

  /**
   * Get products with complex filtering and sorting
   */
  async getProducts(options: {
    categoryId?: number;
    vendorId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    features?: Record<number, string[]>;
    sortBy?: 'name' | 'price' | 'rating' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    vendorOnly?: boolean;
  }): Promise<{ products: ProductWithDetails[]; total: number }> {
    const {
      categoryId,
      vendorId,
      search,
      minPrice,
      maxPrice,
      isActive = true,
      isFeatured,
      features,
      sortBy = 'name',
      sortOrder = 'ASC',
      limit = 20,
      offset = 0,
      vendorOnly = false
    } = options;

    // Build complex WHERE conditions
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (isActive !== undefined) {
      whereConditions.push('p.is_active = ?');
      whereParams.push(isActive ? 1 : 0);
    }

    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      whereParams.push(categoryId);
    }

    if (vendorId) {
      whereConditions.push('vp.vendor_id = ?');
      whereParams.push(vendorId);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.full_description LIKE ? OR p.sku LIKE ? OR p.slug LIKE ?)');
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (minPrice !== undefined && minPrice !== null) {
      whereConditions.push('COALESCE(vp.vendor_price, p.base_price) >= ?');
      whereParams.push(minPrice);
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      whereConditions.push('COALESCE(vp.vendor_price, p.base_price) <= ?');
      whereParams.push(maxPrice);
    }

    if (isFeatured !== undefined) {
      whereConditions.push('p.is_featured = ?');
      whereParams.push(isFeatured ? 1 : 0);
    }

    // Add vendor-only filter if requested
    if (vendorOnly) {
      // Only show products that have a vendor (either in products.vendor_id or vendor_products)
      whereConditions.push('(p.vendor_id IS NOT NULL OR vp.vendor_id IS NOT NULL)');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Build HAVING clause for feature filters
    let havingClause = '';
    const havingParams: any[] = [];
    
    if (features && Object.keys(features).length > 0) {
      const havingConditions: string[] = [];
      
      for (const [featureId, values] of Object.entries(features)) {
        const valuePlaceholders = values.map(() => '?').join(',');
        havingConditions.push(
          `SUM(CASE WHEN pf.feature_id = ? AND pf.value IN (${valuePlaceholders}) THEN 1 ELSE 0 END) > 0`
        );
        havingParams.push(featureId, ...values);
      }
      
      havingClause = `HAVING ${havingConditions.join(' AND ')}`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      ${features ? 'LEFT JOIN product_features pf ON p.product_id = pf.product_id' : ''}
      ${whereClause}
      ${features ? 'GROUP BY p.product_id' : ''}
      ${havingClause}
    `;

    const countParams = [...whereParams];
    if (havingParams.length > 0) {
      countParams.push(...havingParams);
    }

    const [countResult] = await this.executeQuery<RowDataPacket>(
      features && havingClause 
        ? `SELECT COUNT(*) as total FROM (${countQuery}) as subquery`
        : countQuery,
      countParams
    );
    
    const total = countResult.total || 0;
    

    // Get products with all details
    const sortColumn = sortBy === 'price' 
      ? 'COALESCE(vp.vendor_price, p.base_price)' 
      : `p.${sortBy}`;

    const query = `
      SELECT DISTINCT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        MIN(vp.vendor_price) as vendor_price,
        MIN(vd.discount_type) as discount_type,
        MIN(vd.discount_value) as discount_value,
        COALESCE(pi.image_url, p.primary_image_url) as primary_image_url,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(DISTINCT pr.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_discounts vd ON vp.vendor_id = vd.vendor_id 
        AND vd.is_active = 1
        AND (vd.valid_from IS NULL OR vd.valid_from <= NOW())
        AND (vd.valid_until IS NULL OR vd.valid_until >= NOW())
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
      ${features ? 'LEFT JOIN product_features pf ON p.product_id = pf.product_id' : ''}
      ${whereClause}
      GROUP BY p.product_id, p.name, p.slug, p.sku, p.short_description, 
               p.full_description, p.base_price, p.cost_price, p.category_id, 
               p.primary_image_url, p.is_active, p.is_featured, p.rating, p.review_count, 
               p.created_at, p.updated_at, c.name, c.slug, pi.image_url
      ${havingClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    const queryParams = [...whereParams];
    if (havingParams.length > 0) {
      queryParams.push(...havingParams);
    }

    const rawProducts = await this.executeQuery<ProductWithDetails>(query, queryParams);
    const products = parseArrayPrices(rawProducts);

    return { products, total };
  }

  /**
   * Get product pricing with all discounts applied
   */
  async getProductPricing(
    productId: number,
    customerId?: number,
    quantity: number = 1,
    couponCode?: string
  ): Promise<ProductPricing> {
    const query = `
      SELECT 
        p.product_id,
        p.base_price,
        vp.vendor_price,
        cp.customer_price,
        
        -- Volume discount calculation
        CASE 
          WHEN vold.discount_id IS NOT NULL THEN
            CASE vold.discount_type
              WHEN 'percentage' THEN COALESCE(cp.customer_price, vp.vendor_price, p.base_price) * (1 - vold.discount_value / 100)
              WHEN 'fixed' THEN COALESCE(cp.customer_price, vp.vendor_price, p.base_price) - vold.discount_value
              ELSE 0
            END
          ELSE 0
        END as volume_discount,
        
        -- Coupon discount calculation
        CASE 
          WHEN vc.coupon_id IS NOT NULL AND vc.is_active = 1 THEN
            CASE vc.discount_type
              WHEN 'percentage' THEN COALESCE(cp.customer_price, vp.vendor_price, p.base_price) * (vc.discount_value / 100)
              WHEN 'fixed' THEN vc.discount_value
              ELSE 0
            END
          ELSE 0
        END as coupon_discount,
        
        -- Final price calculation
        GREATEST(0, 
          COALESCE(cp.customer_price, vp.vendor_price, p.base_price)
          - CASE 
              WHEN vold.discount_id IS NOT NULL THEN
                CASE vold.discount_type
                  WHEN 'percentage' THEN COALESCE(cp.customer_price, vp.vendor_price, p.base_price) * (vold.discount_value / 100)
                  WHEN 'fixed' THEN vold.discount_value
                  ELSE 0
                END
              ELSE 0
            END
          - CASE 
              WHEN vc.coupon_id IS NOT NULL AND vc.is_active = 1 THEN
                CASE vc.discount_type
                  WHEN 'percentage' THEN COALESCE(cp.customer_price, vp.vendor_price, p.base_price) * (vc.discount_value / 100)
                  WHEN 'fixed' THEN vc.discount_value
                  ELSE 0
                END
              ELSE 0
            END
        ) as final_price
        
      FROM products p
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN customer_pricing cp ON p.product_id = cp.product_id 
        AND cp.customer_id = ?
      LEFT JOIN volume_discounts vold ON vp.vendor_id = vold.vendor_id
        AND vold.is_active = 1
        AND ? BETWEEN vold.min_quantity AND COALESCE(vold.max_quantity, 999999)
      LEFT JOIN vendor_coupons vc ON vp.vendor_id = vc.vendor_id
        AND vc.code = ?
        AND vc.is_active = 1
        AND (vc.start_date IS NULL OR vc.start_date <= NOW())
        AND (vc.end_date IS NULL OR vc.end_date >= NOW())
        AND (vc.usage_limit IS NULL OR vc.usage_count < vc.usage_limit)
      WHERE p.product_id = ?
      LIMIT 1
    `;

    const params = [
      customerId || null,
      quantity,
      couponCode || '',
      productId
    ];

    const [pricing] = await this.executeQuery<ProductPricing>(query, params);
    
    return pricing || {
      product_id: productId,
      base_price: 0,
      final_price: 0
    } as ProductPricing;
  }

  /**
   * Search products with full-text search
   */
  async searchProducts(
    searchTerm: string,
    limit: number = 20
  ): Promise<ProductWithDetails[]> {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        MATCH(p.name, p.short_description, p.full_description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE 
        p.is_active = 1
        AND (
          MATCH(p.name, p.short_description, p.full_description) AGAINST(? IN NATURAL LANGUAGE MODE)
          OR p.name LIKE ?
          OR p.sku LIKE ?
        )
      ORDER BY relevance DESC, p.name ASC
      LIMIT ${Math.floor(limit)}
    `;

    const searchPattern = `%${searchTerm}%`;
    const params = [searchTerm, searchTerm, searchPattern, searchPattern];

    return this.executeQuery<ProductWithDetails>(query, params);
  }

  /**
   * Get related products based on category and features
   */
  async getRelatedProducts(
    productId: number,
    limit: number = 8
  ): Promise<ProductWithDetails[]> {
    const query = `
      SELECT DISTINCT
        p2.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        COUNT(DISTINCT pf2.feature_id) as shared_features
      FROM products p1
      JOIN products p2 ON p1.category_id = p2.category_id AND p2.product_id != p1.product_id
      LEFT JOIN categories c ON p2.category_id = c.category_id
      LEFT JOIN brands b ON p2.brand_id = b.brand_id
      LEFT JOIN product_features pf1 ON p1.product_id = pf1.product_id
      LEFT JOIN product_features pf2 ON p2.product_id = pf2.product_id 
        AND pf1.feature_id = pf2.feature_id
      WHERE 
        p1.product_id = ?
        AND p2.is_active = 1
      GROUP BY p2.product_id
      ORDER BY 
        shared_features DESC,
        p2.rating DESC,
        p2.created_at DESC
      LIMIT ${Math.floor(limit)}
    `;

    return this.executeQuery<ProductWithDetails>(query, [productId]);
  }
}