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
    vendorId?: number,
    includeInactive: boolean = false
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
      WHERE p.product_id = ? ${includeInactive ? '' : 'AND p.is_active = 1'}
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
    
    // Get images, features, fabric options, control types, pricing matrix, categories, and dimensions in parallel
    const result = await this.executeParallel<{
      images: any[] | null;
      features: any[] | null;
      fabricOptions: any[] | null;
      controlTypes: any[] | null;
      pricingMatrix: any[] | null;
      categories: any[] | null;
      dimensions: any[] | null;
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
      },
      fabricOptions: {
        query: `
          SELECT fabric_option_id, product_id, vendor_id, fabric_type,
                 fabric_name, description, texture_url, opacity
          FROM product_fabric_options
          WHERE product_id = ? AND is_enabled = 1
          ORDER BY render_priority, fabric_name
        `,
        params: [productId]
      },
      controlTypes: {
        query: `
          SELECT control_type_id, name, description, operation_method,
                 automation_compatible, child_safety_features
          FROM control_types
          WHERE is_active = 1
          ORDER BY is_popular DESC, name
        `,
        params: []
      },
      pricingMatrix: {
        query: `
          SELECT id, product_id, system_type, fabric_code, width_min, width_max,
                 height_min, height_max, base_price, price_per_sqft,
                 effective_date, expires_date, is_active
          FROM product_pricing_matrix
          WHERE product_id = ? AND is_active = 1
          ORDER BY width_min, height_min
        `,
        params: [productId]
      },
      categories: {
        query: `
          SELECT pc.category_id, pc.is_primary, c.name, c.slug
          FROM product_categories pc
          JOIN categories c ON pc.category_id = c.category_id
          WHERE pc.product_id = ?
          ORDER BY pc.is_primary DESC, c.name
        `,
        params: [productId]
      },
      dimensions: {
        query: `
          SELECT pd.*, dt.name as dimension_type_name
          FROM product_dimensions pd
          JOIN dimension_types dt ON pd.dimension_type_id = dt.dimension_type_id
          WHERE pd.product_id = ?
        `,
        params: [productId]
      }
    });

    // Safely handle null values and transform field names
    const images = result?.images || [];
    const features = result?.features || [];
    const fabricOptions = result?.fabricOptions || [];
    const controlTypes = result?.controlTypes || [];
    const pricingMatrix = result?.pricingMatrix || [];
    const categories = result?.categories || [];
    const dimensions = result?.dimensions || [];

    // Transform image field names to match frontend expectations
    product.images = images.map(img => ({
      id: img.image_id?.toString() || '',
      url: img.image_url || '',
      alt: img.alt_text || '',
      isPrimary: img.is_primary === 1,
      display_order: img.display_order || 0
    }));
    product.features = features;

    // Transform fabric options to match frontend expectations
    product.fabric = {
      fabrics: fabricOptions.map(fabric => ({
        id: fabric.fabric_option_id?.toString() || '',
        name: fabric.fabric_name || '',
        fabricType: fabric.fabric_type || '',
        description: fabric.description || '',
        image: fabric.texture_url ? {
          url: fabric.texture_url,
          alt: fabric.fabric_name || ''
        } : null,
        opacity: fabric.opacity || 1
      }))
    };

    product.fabricOptions = fabricOptions;
    product.controlTypes = controlTypes;
    product.pricing_matrix = pricingMatrix;
    product.categories = categories.map(cat => ({
      category_id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
      is_primary: cat.is_primary === 1
    }));

    // Set primary_category for backward compatibility
    const primaryCat = categories.find(cat => cat.is_primary === 1);
    if (primaryCat) {
      product.primary_category = primaryCat.category_id;
    }

    // Build options object from dimensions
    const widthDim = dimensions.find(d => d.dimension_type_name?.toLowerCase() === 'width');
    const heightDim = dimensions.find(d => d.dimension_type_name?.toLowerCase() === 'height');

    product.options = {
      dimensions: {
        minWidth: widthDim ? parseFloat(widthDim.min_value) : 12,
        maxWidth: widthDim ? parseFloat(widthDim.max_value) : 96,
        minHeight: heightDim ? parseFloat(heightDim.min_value) : 12,
        maxHeight: heightDim ? parseFloat(heightDim.max_value) : 120,
        widthIncrement: widthDim ? parseFloat(widthDim.increment_value) : 0.125,
        heightIncrement: heightDim ? parseFloat(heightDim.increment_value) : 0.125
      },
      mountTypes: [],
      controlTypes: {
        liftSystems: [],
        wandSystem: [],
        stringSystem: [],
        remoteControl: []
      },
      valanceOptions: [],
      bottomRailOptions: []
    };

    return product;
  }

  /**
   * Get product with full enhanced details including all tab data
   * This is used by both Admin and Vendor handlers
   */
  async getProductWithFullDetails(
    productId: number,
    vendorId?: number,
    includeInactive: boolean = false
  ): Promise<any> {
    // Get basic product details
    const product = await this.getProductWithDetails(productId, undefined, vendorId, includeInactive);

    if (!product) {
      return null;
    }

    try {
      // Get additional data needed for all tabs
      const results = await this.executeParallel<{
        categories: any[];
        options: any[];
        specifications: any[];
        pricingMatrix: any[];
        fabric: any[];
        rooms: any[];
        features: any[];
      }>({
        categories: {
          query: `
            SELECT c.name, pc.is_primary, c.category_id
            FROM product_categories pc
            JOIN categories c ON pc.category_id = c.category_id
            WHERE pc.product_id = ?
          `,
          params: [productId]
        },
        options: {
          query: `
            SELECT * FROM product_dimensions
            WHERE product_id = ?
          `,
          params: [productId]
        },
        specifications: {
          query: `
            SELECT spec_category, spec_value
            FROM product_specifications
            WHERE product_id = ?
            AND spec_category IN ('mount_type', 'lift_system', 'wand_system', 'string_system', 'remote_control', 'valance_option', 'bottom_rail_option')
            ORDER BY spec_category, display_order
          `,
          params: [productId]
        },
        pricingMatrix: {
          query: `
            SELECT * FROM product_pricing_matrix
            WHERE product_id = ?
            ORDER BY width_min, height_min
          `,
          params: [productId]
        },
        fabric: {
          query: `
            SELECT
              fo.*,
              fi.image_url,
              fi.image_name,
              fp.price_per_sqft
            FROM product_fabric_options fo
            LEFT JOIN product_fabric_images fi ON fo.fabric_option_id = fi.fabric_option_id
            LEFT JOIN product_fabric_pricing fp ON fo.fabric_option_id = fp.fabric_option_id
            WHERE fo.product_id = ?
          `,
          params: [productId]
        },
        rooms: {
          query: `
            SELECT pr.*, pr.room_type as room_name
            FROM product_rooms pr
            WHERE pr.product_id = ?
          `,
          params: [productId]
        },
        features: {
          query: `
            SELECT f.*, pf.id as product_feature_id
            FROM product_features pf
            JOIN features f ON pf.feature_id = f.feature_id
            WHERE pf.product_id = ?
            ORDER BY f.display_order
          `,
          params: [productId]
        }
      });

      const { categories, options, specifications, pricingMatrix, fabric, rooms, features } = results;

      // Safe defaults
      const safeCategories = categories || [];
      const safeOptions = options || [];
      const safeSpecifications = specifications || [];
      const safePricingMatrix = pricingMatrix || [];
      const safeFabric = fabric || [];
      const safeRooms = rooms || [];
      const safeFeatures = features || [];

      // Get primary category
      const primaryCategoryResult = await this.executeQuery(
        `SELECT c.name as category_name, c.category_id
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.category_id
         WHERE p.product_id = ?`,
        [productId]
      );
      const primaryCategory = primaryCategoryResult[0];

      // Parse fabric data
      let fabricData = { fabrics: [] };
      if (safeFabric && safeFabric.length > 0) {
        fabricData.fabrics = safeFabric.map(f => ({
          id: f.fabric_option_id?.toString() || '',
          name: f.fabric_name || '',
          image: f.texture_url ? {
            url: f.texture_url,
            alt: f.fabric_name || ''
          } : (f.image_url ? {
            url: f.image_url,
            name: f.image_name || f.fabric_name || ''
          } : null),
          price: f.price_per_sqft ? parseFloat(f.price_per_sqft) * 100 : 0,
          fabricType: f.fabric_type || 'colored',
          enabled: f.is_enabled === 1,
          description: f.description || '',
          textureUrl: f.texture_url || null,
          textureScale: f.texture_scale || 1.0,
          materialFinish: f.material_finish || 'matte',
          opacity: f.opacity || 1.0
        }));
      }

      // Parse options data
      let optionsData = {
        dimensions: {
          minWidth: 12,
          maxWidth: 96,
          minHeight: 12,
          maxHeight: 120,
          widthIncrement: 0.125,
          heightIncrement: 0.125
        },
        mountTypes: [],
        controlTypes: {
          liftSystems: [],
          wandSystem: [],
          stringSystem: [],
          remoteControl: []
        },
        valanceOptions: [],
        bottomRailOptions: []
      };

      // If we have dimension data, use it
      if (safeOptions && safeOptions.length > 0) {
        const widthDim = safeOptions.find(o => o.dimension_type_id === 1);
        const heightDim = safeOptions.find(o => o.dimension_type_id === 2);

        if (widthDim) {
          optionsData.dimensions.minWidth = parseFloat(widthDim.min_value) || 12;
          optionsData.dimensions.maxWidth = parseFloat(widthDim.max_value) || 96;
          optionsData.dimensions.widthIncrement = parseFloat(widthDim.increment_value) || 0.125;
        }

        if (heightDim) {
          optionsData.dimensions.minHeight = parseFloat(heightDim.min_value) || 12;
          optionsData.dimensions.maxHeight = parseFloat(heightDim.max_value) || 120;
          optionsData.dimensions.heightIncrement = parseFloat(heightDim.increment_value) || 0.125;
        }
      }

      // Process specifications into options
      if (safeSpecifications && safeSpecifications.length > 0) {
        const mountTypes: any[] = [];
        const liftSystems: any[] = [];
        const wandSystem: any[] = [];
        const stringSystem: any[] = [];
        const remoteControl: any[] = [];
        const valanceOptions: any[] = [];
        const bottomRailOptions: any[] = [];

        safeSpecifications.forEach(spec => {
          let value = spec.spec_value;
          try {
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
              value = JSON.parse(value);
            }
          } catch (e) {
            value = { name: value, price_adjustment: 0, enabled: true };
          }

          if (typeof value === 'string') {
            value = { name: value, price_adjustment: 0, enabled: true };
          }

          switch (spec.spec_category) {
            case 'mount_type':
              mountTypes.push(value);
              break;
            case 'lift_system':
              liftSystems.push(value);
              break;
            case 'wand_system':
              wandSystem.push(value);
              break;
            case 'string_system':
              stringSystem.push(value);
              break;
            case 'remote_control':
              remoteControl.push(value);
              break;
            case 'valance_option':
              valanceOptions.push(value);
              break;
            case 'bottom_rail_option':
              bottomRailOptions.push(value);
              break;
          }
        });

        optionsData.mountTypes = mountTypes;
        optionsData.controlTypes.liftSystems = liftSystems;
        optionsData.controlTypes.wandSystem = wandSystem;
        optionsData.controlTypes.stringSystem = stringSystem;
        optionsData.controlTypes.remoteControl = remoteControl;
        optionsData.valanceOptions = valanceOptions;
        optionsData.bottomRailOptions = bottomRailOptions;
      }

      // Use categories from enhanced query, or fall back to product.categories from base query
      const finalCategories = safeCategories.length > 0 ? safeCategories : (product.categories || []);

      // Get primary category name - try from primaryCategoryResult, then from categories array
      let primaryCategoryName = primaryCategory?.category_name;
      if (!primaryCategoryName && finalCategories.length > 0) {
        const primaryCat = finalCategories.find(c => c.is_primary === 1 || c.is_primary === true);
        primaryCategoryName = primaryCat?.name || '';
      }

      // Build enhanced product response
      return {
        ...product,
        categories: finalCategories,
        primary_category: primaryCategoryName || '',
        options: optionsData,
        pricing_matrix: safePricingMatrix.length > 0 ? safePricingMatrix : (product.pricing_matrix || []),
        fabric: fabricData,
        roomRecommendations: safeRooms.map(room => ({
          id: room.id?.toString() || '',
          roomType: room.room_type || room.room_name || '',
          recommendation: room.special_considerations || '',
          priority: room.suitability_score || 5
        })) || [],
        features: safeFeatures.length > 0 ? safeFeatures : (product.features || [])
      };
    } catch (error) {
      console.error('Error fetching enhanced product details:', error);
      // Return basic product data if enhanced fetch fails
      return {
        ...product,
        categories: product.categories || [],
        primary_category: product.primary_category || product.category_id,
        options: product.options || null,
        pricing_matrix: product.pricing_matrix || [],
        fabric: product.fabric || { fabrics: [] },
        roomRecommendations: [],
        features: product.features || []
      };
    }
  }

  /**
   * Get products with complex filtering and sorting
   */
  async getProducts(options: {
    categoryId?: number;
    categoryIds?: number[];
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
      categoryIds,
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

    // Support both single categoryId and multiple categoryIds
    if (categoryIds && categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      whereConditions.push(`p.category_id IN (${placeholders})`);
      whereParams.push(...categoryIds);
    } else if (categoryId) {
      whereConditions.push('p.category_id = ?');
      whereParams.push(categoryId);
    }

    if (vendorId !== undefined && vendorId !== null) {
      if (vendorId === 0) {
        // Special case: vendorId=0 means products not in vendor_products table
        whereConditions.push('vp.vendor_product_id IS NULL');
      } else {
        whereConditions.push('vp.vendor_id = ?');
        whereParams.push(vendorId);
      }
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
      // Only show products that are associated with vendors in vendor_products table
      whereConditions.push('vp.vendor_product_id IS NOT NULL');
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
      ? 'COALESCE(MIN(vp.vendor_price), p.base_price)'
      : `p.${sortBy}`;
    
    // Validate sortBy column to prevent SQL injection
    const allowedSortColumns = ['name', 'price', 'rating', 'created_at'];
    if (!allowedSortColumns.includes(sortBy)) {
      throw new Error('Invalid sort column');
    }
    
    // Validate sortOrder to prevent SQL injection
    const validatedSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        MIN(vp.vendor_price) as vendor_price,
        MIN(vd.discount_type) as discount_type,
        MIN(vd.discount_value) as discount_value,
        COALESCE(pi.image_url, p.primary_image_url) as primary_image_url,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(DISTINCT pr.review_id) as review_count,
        MIN(vp.vendor_id) as vendor_id,
        MIN(vi.business_name) as vendor_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_info vi ON vp.vendor_id = vi.user_id
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
      ORDER BY ${sortColumn} ${validatedSortOrder}
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
        MATCH(p.name, p.short_description, p.full_description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
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
        COUNT(DISTINCT pf2.feature_id) as shared_features
      FROM products p1
      JOIN products p2 ON p1.category_id = p2.category_id AND p2.product_id != p1.product_id
      LEFT JOIN categories c ON p2.category_id = c.category_id
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

  /**
   * Get products recommended for specific window dimensions and room type
   * Used by AI recommendation engine
   */
  async getRecommendedProducts(criteria: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    roomType: string;
    lightingCondition?: string;
    budget?: { min: number; max: number };
  }): Promise<Product[]> {
    let query = `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.base_price,
        p.primary_image_url,
        p.custom_width_min,
        p.custom_width_max,
        p.custom_height_min,
        p.custom_height_max,
        p.rating,
        p.review_count,
        pr.suitability_score as room_suitability_score,
        ps_opacity.spec_value as opacity,
        ps_type.spec_value as product_type,
        ps_motor.spec_value as supports_motorization,
        ps_moisture.spec_value as moisture_resistant
      FROM products p
      INNER JOIN product_rooms pr ON p.product_id = pr.product_id
      LEFT JOIN product_specifications ps_opacity ON p.product_id = ps_opacity.product_id
        AND ps_opacity.spec_name = 'opacity'
      LEFT JOIN product_specifications ps_type ON p.product_id = ps_type.product_id
        AND ps_type.spec_name = 'product_type'
      LEFT JOIN product_specifications ps_motor ON p.product_id = ps_motor.product_id
        AND ps_motor.spec_name = 'motorized'
      LEFT JOIN product_specifications ps_moisture ON p.product_id = ps_moisture.product_id
        AND ps_moisture.spec_name = 'moisture_resistant'
      WHERE p.is_active = 1
        AND COALESCE(p.custom_width_min, 12) <= ?
        AND COALESCE(p.custom_width_max, 120) >= ?
        AND COALESCE(p.custom_height_min, 12) <= ?
        AND COALESCE(p.custom_height_max, 120) >= ?
        AND pr.room_type LIKE ?
        AND pr.suitability_score >= 5
    `;

    const params: any[] = [
      criteria.maxWidth,
      criteria.minWidth,
      criteria.maxHeight,
      criteria.minHeight,
      `%${criteria.roomType}%`
    ];

    // Add budget filter if provided
    if (criteria.budget) {
      query += ' AND p.base_price BETWEEN ? AND ?';
      params.push(criteria.budget.min, criteria.budget.max);
    }

    query += `
      ORDER BY pr.suitability_score DESC, p.rating DESC, p.created_at DESC
      LIMIT 50
    `;

    const products = await this.executeQuery<Product>(query, params);
    return parseArrayPrices(products);
  }
}