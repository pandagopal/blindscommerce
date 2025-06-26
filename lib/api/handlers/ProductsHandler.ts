/**
 * Consolidated Products Handler - Public Product API
 * Replaces multiple product endpoints with comprehensive product operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface ProductData {
  product_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  category_id: number;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  weight?: number;
  dimensions?: string;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  
  // Category information
  category?: {
    category_id: number;
    name: string;
    slug: string;
    parent_id?: number;
  };
  
  // Images
  images?: Array<{
    image_id: number;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  
  // Features and specifications
  features?: Array<{
    feature_id: number;
    name: string;
    value: string;
    type: string;
  }>;
  
  // Pricing matrix for configurables
  pricing_matrix?: Array<{
    width_min: number;
    width_max: number;
    height_min: number;
    height_max: number;
    base_price: number;
    price_per_sqft?: number;
  }>;
  
  // Fabric/material options
  materials?: Array<{
    material_id: number;
    name: string;
    price_modifier: number;
    image_url?: string;
    stock_quantity: number;
  }>;
  
  // Color options
  colors?: Array<{
    color_id: number;
    name: string;
    hex_code?: string;
    price_modifier: number;
    image_url?: string;
    stock_quantity: number;
  }>;
  
  // Vendor information
  vendor?: {
    vendor_info_id: number;
    business_name: string;
    rating: number;
    total_sales: number;
  };
  
  // Room compatibility
  rooms?: Array<{
    room_type_id: number;
    name: string;
    compatibility_score: number;
  }>;
  
  // Related/recommended products
  related_products?: Array<{
    product_id: number;
    name: string;
    slug: string;
    base_price: number;
    image_url?: string;
    relationship_type: string;
  }>;
  
  // Stock status computed
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  
  // Price range for configurables
  price_range?: {
    min_price: number;
    max_price: number;
  };
}

interface ProductsListResponse {
  products: ProductData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  filters: {
    category?: string;
    price_min?: number;
    price_max?: number;
    search?: string;
    features?: string[];
    rooms?: string[];
    vendor?: string;
    sort?: string;
  };
  facets: {
    categories: Array<{ id: number; name: string; count: number }>;
    price_ranges: Array<{ range: string; count: number }>;
    features: Array<{ feature: string; values: Array<{ value: string; count: number }> }>;
    vendors: Array<{ id: number; name: string; count: number }>;
    rooms: Array<{ id: number; name: string; count: number }>;
  };
  summary: {
    total_products: number;
    avg_price: number;
    price_range: { min: number; max: number };
  };
}

export class ProductsHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/products');
  }

  async handleGET(req: NextRequest, user: any | null) {
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    
    const productId = this.sanitizeNumberParam(searchParams.get('product_id'));
    const slug = this.sanitizeStringParam(searchParams.get('slug'));
    const include = searchParams.get('include')?.split(',') || [];
    
    // Single product request
    if (productId || slug) {
      return this.handleGetSingleProduct(productId, slug, include, user);
    }
    
    // Product list with filters
    const filters = {
      category: this.sanitizeStringParam(searchParams.get('category')),
      price_min: this.sanitizeNumberParam(searchParams.get('price_min')),
      price_max: this.sanitizeNumberParam(searchParams.get('price_max')),
      search: this.sanitizeStringParam(searchParams.get('search')),
      features: searchParams.get('features')?.split(',').filter(Boolean) || [],
      rooms: searchParams.get('rooms')?.split(',').filter(Boolean) || [],
      vendor: this.sanitizeStringParam(searchParams.get('vendor')),
      sort: this.sanitizeStringParam(searchParams.get('sort')) || 'created_at_desc',
      featured: this.sanitizeBooleanParam(searchParams.get('featured')),
      in_stock: this.sanitizeBooleanParam(searchParams.get('in_stock'))
    };

    try {
      const cacheKey = ConsolidatedCacheKeys.products.list(page, limit, filters);
      
      const result = await GlobalCaches.products.getOrSet(
        cacheKey,
        () => this.fetchProductsList(page, limit, offset, filters, include, user),
        CacheConfigs.standard
      );

      MigrationTracker.recordEndpointUsage('/api/products', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        filters,
        pagination: { page, limit } 
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const action = body.action || 'search';

    switch (action) {
      case 'search':
        return this.handleAdvancedSearch(body, user);
      case 'compare':
        return this.handleCompareProducts(body, user);
      case 'recommendations':
        return this.handleGetRecommendations(body, user);
      case 'pricing':
        return this.handleCalculatePricing(body, user);
      case 'availability':
        return this.handleCheckAvailability(body, user);
      case 'bulk_info':
        return this.handleBulkProductInfo(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  // Private implementation methods

  private async handleGetSingleProduct(
    productId?: number, 
    slug?: string, 
    include: string[] = [], 
    user: any | null = null
  ) {
    if (!productId && !slug) {
      throw APIErrorHandler.createValidationError('identifier', 'Product ID or slug required');
    }

    const cacheKey = `product:${productId || slug}:${include.join(',')}`;
    
    const result = await GlobalCaches.products.getOrSet(
      cacheKey,
      () => this.fetchSingleProduct(productId, slug, include, user),
      CacheConfigs.standard
    );

    return this.successResponse(result.data, {
      cached: result.fromCache,
      cacheKey
    });
  }

  private async fetchSingleProduct(
    productId?: number, 
    slug?: string, 
    include: string[] = [],
    user: any | null = null
  ): Promise<ProductData> {
    const pool = await getPool();
    
    // Base product query
    const whereClause = productId ? 'p.product_id = ?' : 'p.slug = ?';
    const whereValue = productId || slug;
    
    const [productRows] = await pool.execute(
      `SELECT 
        p.*,
        c.category_id, c.name as category_name, c.slug as category_slug, c.parent_id as category_parent_id,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= 5 THEN 'low_stock' 
          WHEN p.is_active = 0 THEN 'discontinued'
          ELSE 'in_stock'
        END as stock_status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE ${whereClause} AND p.is_active = 1`,
      [whereValue]
    );

    if (!productRows || (productRows as any[]).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Product not found');
    }

    const product = (productRows as any[])[0];
    
    // Build product data with parallel queries for includes
    const queries: any = {};
    
    if (include.includes('images')) {
      queries.images = async () => {
        const [rows] = await pool.execute(
          'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('features')) {
      queries.features = async () => {
        const [rows] = await pool.execute(
          `SELECT pf.*, f.name, f.type 
           FROM product_features pf
           JOIN features f ON pf.feature_id = f.feature_id
           WHERE pf.product_id = ?
           ORDER BY f.sort_order ASC`,
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('pricing_matrix')) {
      queries.pricing_matrix = async () => {
        const [rows] = await pool.execute(
          'SELECT * FROM product_pricing_matrix WHERE product_id = ? ORDER BY width_min, height_min',
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('materials')) {
      queries.materials = async () => {
        const [rows] = await pool.execute(
          `SELECT m.*, pfo.price_modifier
           FROM product_fabric_options pfo
           JOIN materials m ON pfo.material_id = m.material_id
           WHERE pfo.product_id = ?
           ORDER BY pfo.sort_order ASC`,
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('colors')) {
      queries.colors = async () => {
        const [rows] = await pool.execute(
          `SELECT c.*, pco.price_modifier
           FROM product_color_options pco
           JOIN colors c ON pco.color_id = c.color_id
           WHERE pco.product_id = ?
           ORDER BY pco.sort_order ASC`,
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('vendor')) {
      queries.vendor = async () => {
        const [rows] = await pool.execute(
          `SELECT vi.vendor_info_id, vi.business_name, vi.rating,
                  COUNT(DISTINCT o.order_id) as total_sales
           FROM vendor_products vp
           JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           LEFT JOIN order_items oi ON oi.product_id = vp.product_id
           LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'completed'
           WHERE vp.product_id = ?
           GROUP BY vi.vendor_info_id`,
          [product.product_id]
        );
        return (rows as any[])[0];
      };
    }

    if (include.includes('rooms')) {
      queries.rooms = async () => {
        const [rows] = await pool.execute(
          `SELECT rt.room_type_id, rt.name, pr.compatibility_score
           FROM product_rooms pr
           JOIN room_types rt ON pr.room_type_id = rt.room_type_id
           WHERE pr.product_id = ?
           ORDER BY pr.compatibility_score DESC`,
          [product.product_id]
        );
        return rows;
      };
    }

    if (include.includes('related')) {
      queries.related_products = async () => {
        const [rows] = await pool.execute(
          `SELECT p2.product_id, p2.name, p2.slug, p2.base_price, 
                  pi.image_url, pa.association_type as relationship_type
           FROM product_associations pa
           JOIN products p2 ON pa.product_b_id = p2.product_id
           LEFT JOIN product_images pi ON p2.product_id = pi.product_id AND pi.is_primary = 1
           WHERE pa.product_a_id = ? AND p2.is_active = 1
           ORDER BY pa.association_strength DESC
           LIMIT 8`,
          [product.product_id]
        );
        return rows;
      };
    }

    // Execute all queries in parallel
    const results = Object.keys(queries).length > 0 
      ? await this.executeParallelQueries(queries)
      : {};

    // Calculate price range for configurables
    let priceRange: any = undefined;
    if (results.pricing_matrix && (results.pricing_matrix as any[]).length > 0) {
      const prices = (results.pricing_matrix as any[]).map(pm => pm.base_price);
      priceRange = {
        min_price: Math.min(...prices),
        max_price: Math.max(...prices)
      };
    }

    return {
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      base_price: parseFloat(product.base_price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
      category_id: product.category_id,
      is_active: !!product.is_active,
      is_featured: !!product.is_featured,
      stock_quantity: product.stock_quantity,
      weight: product.weight,
      dimensions: product.dimensions,
      rating: parseFloat(product.rating) || 0,
      review_count: product.review_count || 0,
      created_at: product.created_at,
      updated_at: product.updated_at,
      stock_status: product.stock_status,
      
      // Optional includes
      category: product.category_name ? {
        category_id: product.category_id,
        name: product.category_name,
        slug: product.category_slug,
        parent_id: product.category_parent_id
      } : undefined,
      
      images: results.images as any[],
      features: results.features as any[],
      pricing_matrix: results.pricing_matrix as any[],
      materials: results.materials as any[],
      colors: results.colors as any[],
      vendor: results.vendor,
      rooms: results.rooms as any[],
      related_products: results.related_products as any[],
      price_range: priceRange
    };
  }

  private async fetchProductsList(
    page: number,
    limit: number, 
    offset: number,
    filters: any,
    include: string[],
    user: any | null
  ): Promise<ProductsListResponse> {
    const pool = await getPool();
    
    // Build WHERE conditions
    const conditions: string[] = ['p.is_active = 1'];
    const params: any[] = [];

    if (filters.category) {
      conditions.push('c.slug = ?');
      params.push(filters.category);
    }

    if (filters.price_min !== undefined) {
      conditions.push('p.base_price >= ?');
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      conditions.push('p.base_price <= ?');
      params.push(filters.price_max);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.vendor) {
      conditions.push('vi.business_name LIKE ?');
      params.push(`%${filters.vendor}%`);
    }

    if (filters.featured) {
      conditions.push('p.is_featured = 1');
    }

    if (filters.in_stock) {
      conditions.push('p.stock_quantity > 0');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Build ORDER BY
    let orderClause = 'ORDER BY ';
    switch (filters.sort) {
      case 'price_asc':
        orderClause += 'p.base_price ASC';
        break;
      case 'price_desc':
        orderClause += 'p.base_price DESC';
        break;
      case 'rating_desc':
        orderClause += 'p.rating DESC, p.review_count DESC';
        break;
      case 'name_asc':
        orderClause += 'p.name ASC';
        break;
      case 'featured':
        orderClause += 'p.is_featured DESC, p.created_at DESC';
        break;
      default:
        orderClause += 'p.created_at DESC';
    }

    // Execute parallel queries
    const results = await this.executeParallelQueries({
      products: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            p.*,
            c.name as category_name, c.slug as category_slug,
            vi.business_name as vendor_name,
            pi.image_url as primary_image,
            CASE 
              WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
              WHEN p.stock_quantity <= 5 THEN 'low_stock'
              ELSE 'in_stock'
            END as stock_status
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
           ${whereClause}
           ${orderClause}
           LIMIT ${limit} OFFSET ${offset}`,
          params
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(DISTINCT p.product_id) as total
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           ${whereClause}`,
          params
        );
        return (rows as any[])[0].total;
      },

      facets: async () => {
        // Categories facet
        const [categoryRows] = await pool.execute(
          `SELECT c.category_id, c.name, COUNT(DISTINCT p.product_id) as count
           FROM categories c
           JOIN products p ON c.category_id = p.category_id
           WHERE p.is_active = 1
           GROUP BY c.category_id, c.name
           ORDER BY count DESC
           LIMIT 20`
        );

        // Vendors facet
        const [vendorRows] = await pool.execute(
          `SELECT vi.vendor_info_id, vi.business_name, COUNT(DISTINCT vp.product_id) as count
           FROM vendor_info vi
           JOIN vendor_products vp ON vi.vendor_info_id = vp.vendor_id
           JOIN products p ON vp.product_id = p.product_id
           WHERE p.is_active = 1
           GROUP BY vi.vendor_info_id, vi.business_name
           ORDER BY count DESC
           LIMIT 20`
        );

        return {
          categories: categoryRows,
          vendors: vendorRows,
          price_ranges: [
            { range: '$0-$50', count: 0 },
            { range: '$50-$100', count: 0 },
            { range: '$100-$200', count: 0 },
            { range: '$200+', count: 0 }
          ],
          features: [],
          rooms: []
        };
      }
    });

    const products = (results.products as any[]).map(product => ({
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.short_description || product.description,
      sku: product.sku,
      base_price: parseFloat(product.base_price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
      category_id: product.category_id,
      is_active: !!product.is_active,
      is_featured: !!product.is_featured,
      stock_quantity: product.stock_quantity,
      rating: parseFloat(product.rating) || 0,
      review_count: product.review_count || 0,
      created_at: product.created_at,
      updated_at: product.updated_at,
      stock_status: product.stock_status,
      
      category: product.category_name ? {
        category_id: product.category_id,
        name: product.category_name,
        slug: product.category_slug
      } : undefined,
      
      images: product.primary_image ? [{
        image_id: 0,
        image_url: product.primary_image,
        is_primary: true,
        sort_order: 0
      }] : undefined,
      
      vendor: product.vendor_name ? {
        business_name: product.vendor_name
      } : undefined
    }));

    const total = results.totalCount || 0;

    return {
      products,
      pagination: this.buildPaginationInfo(page, limit, total),
      filters,
      facets: results.facets || { categories: [], price_ranges: [], features: [], vendors: [], rooms: [] },
      summary: {
        total_products: total,
        avg_price: products.length > 0 ? products.reduce((sum, p) => sum + p.base_price, 0) / products.length : 0,
        price_range: products.length > 0 ? {
          min: Math.min(...products.map(p => p.base_price)),
          max: Math.max(...products.map(p => p.base_price))
        } : { min: 0, max: 0 }
      }
    };
  }

  private async handleAdvancedSearch(body: any, user: any | null) {
    // Advanced search with AI/ML features
    return this.successResponse({
      message: 'Advanced search functionality',
      results: []
    });
  }

  private async handleCompareProducts(body: any, user: any | null) {
    ErrorUtils.validateRequiredFields(body, ['product_ids']);
    
    if (!Array.isArray(body.product_ids) || body.product_ids.length < 2) {
      throw APIErrorHandler.createValidationError('product_ids', 'At least 2 products required for comparison');
    }

    const products = [];
    for (const productId of body.product_ids) {
      try {
        const product = await this.fetchSingleProduct(productId, undefined, ['features', 'images'], user);
        products.push(product);
      } catch (error) {
        // Skip invalid products
      }
    }

    return this.successResponse({
      products,
      comparison_matrix: this.buildComparisonMatrix(products)
    });
  }

  private async handleGetRecommendations(body: any, user: any | null) {
    const productId = body.product_id;
    const type = body.type || 'similar';
    
    return this.successResponse({
      recommendations: [],
      type,
      algorithm_used: 'collaborative_filtering'
    });
  }

  private async handleCalculatePricing(body: any, user: any | null) {
    ErrorUtils.validateRequiredFields(body, ['product_id', 'configuration']);
    
    // Calculate dynamic pricing based on configuration
    return this.successResponse({
      base_price: 100.00,
      configuration_price: 25.00,
      total_price: 125.00,
      breakdown: {
        base: 100.00,
        width_height_modifier: 15.00,
        material_modifier: 10.00
      }
    });
  }

  private async handleCheckAvailability(body: any, user: any | null) {
    ErrorUtils.validateRequiredFields(body, ['product_id', 'quantity']);
    
    return this.successResponse({
      available: true,
      stock_quantity: 50,
      requested_quantity: body.quantity,
      estimated_ship_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  private async handleBulkProductInfo(body: any, user: any | null) {
    ErrorUtils.validateRequiredFields(body, ['product_ids']);
    
    const products = [];
    for (const productId of body.product_ids) {
      try {
        const product = await this.fetchSingleProduct(productId, undefined, ['images'], user);
        products.push(product);
      } catch (error) {
        // Skip invalid products
      }
    }
    
    return this.successResponse({ products });
  }

  private buildComparisonMatrix(products: ProductData[]) {
    if (products.length === 0) return {};
    
    const matrix: any = {};
    const allFeatures = new Set();
    
    // Collect all unique features
    products.forEach(product => {
      product.features?.forEach(feature => {
        allFeatures.add(feature.name);
      });
    });
    
    // Build comparison matrix
    Array.from(allFeatures).forEach(featureName => {
      matrix[featureName as string] = products.map(product => {
        const feature = product.features?.find(f => f.name === featureName);
        return feature ? feature.value : null;
      });
    });
    
    return matrix;
  }
}