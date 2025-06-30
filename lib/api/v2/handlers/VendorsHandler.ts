/**
 * Vendors Handler for V2 API
 * Handles vendor dashboard, products, orders, and analytics
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { vendorService, productService, orderService } from '@/lib/services/singletons';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db';

// Validation schemas
const UpdateVendorSchema = z.object({
  businessName: z.string().min(1).optional(),
  businessDescription: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  // Keep old fields for backward compatibility
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.number().positive(),
  basePrice: z.number().positive(),
  vendorPrice: z.number().positive(),
  quantity: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

const CreateDiscountSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchase: z.number().min(0).optional(),
  appliesTo: z.enum(['all', 'specific_products', 'specific_categories']),
  productIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

const CreateCouponSchema = z.object({
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchase: z.number().min(0).optional(),
  usageLimit: z.number().positive().optional(),
  perCustomerLimit: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export class VendorsHandler extends BaseHandler {
  private vendorService = vendorService;
  private productService = productService;
  private orderService = orderService;

  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'dashboard': () => this.getDashboard(user),
      'profile': () => this.getProfile(user),
      'info': () => this.getVendorInfo(req, user),
      'products': () => this.getProducts(req, user),
      'products/:id': () => this.getProduct(action[1], user),
      'products/bulk/jobs': () => this.getBulkJobs(user),
      'products/bulk/stats': () => this.getBulkStats(user),
      'products/bulk/template': () => this.getBulkTemplate(),
      'products/bulk/export': () => this.exportProducts(req, user),
      'orders': () => this.getOrders(req, user),
      'orders/:id': () => this.getOrder(action[1], user),
      'discounts': () => this.getDiscounts(user),
      'coupons': () => this.getCoupons(user),
      'analytics': () => this.getAnalytics(req, user),
      'analytics/products': () => this.getProductAnalytics(req, user),
      'analytics/revenue': () => this.getRevenueAnalytics(req, user),
      'financial-summary': () => this.getFinancialSummary(req, user),
      'sales-team': () => this.getSalesTeam(req, user),
      'reviews': () => this.getReviews(req, user),
      'storefront': () => this.getStorefront(user),
      'shipments': () => this.getShipments(req, user),
      'shipments/:id': () => this.getShipment(action[1], user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products': () => this.createProduct(req, user),
      'products/bulk': () => this.bulkImportProducts(req, user),
      'discounts': () => this.createDiscount(req, user),
      'coupons': () => this.createCoupon(req, user),
      'sales-team': () => this.addSalesRep(req, user),
      'payouts/request': () => this.requestPayout(req, user),
      'upload': () => this.uploadFile(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'profile': () => this.updateProfile(req, user),
      'products/:id': () => this.updateProduct(action[1], req, user),
      'discounts/:id': () => this.updateDiscount(action[1], req, user),
      'coupons/:id': () => this.updateCoupon(action[1], req, user),
      'orders/:id/status': () => this.updateOrderStatus(action[1], req, user),
      'sales-team/:id': () => this.updateSalesRep(action[2], req, user),
      'shipments/:id': () => this.updateShipment(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle DELETE requests
   */
  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'products/:id': () => this.deleteProduct(action[1], user),
      'discounts/:id': () => this.deleteDiscount(action[1], user),
      'coupons/:id': () => this.deleteCoupon(action[1], user),
      'sales-team/:id': () => this.removeSalesRep(action[2], user),
    };

    return this.routeAction(action, routes);
  }

  // Helper to get vendor ID
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');
    
    const [vendor] = await this.vendorService.raw(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ? AND is_active = 1 ORDER BY vendor_info_id ASC LIMIT 1',
      [user.userId]
    );

    if (!vendor) {
      throw new ApiError('Vendor profile not found', 404);
    }

    return vendor.vendor_info_id;
  }

  // Dashboard and profile
  private async getDashboard(user: any) {
    const vendorId = await this.getVendorId(user);
    return this.vendorService.getVendorDashboard(vendorId);
  }

  private async getProfile(user: any) {
    const vendorId = await this.getVendorId(user);
    return this.vendorService.getVendorWithStats(vendorId);
  }

  private async getVendorInfo(req: NextRequest, user: any) {
    const searchParams = this.getSearchParams(req);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      throw new ApiError('user_id parameter is required', 400);
    }

    // Admin can check any vendor info
    if (user.role === 'admin') {
      const [vendorInfo] = await this.vendorService.raw(
        'SELECT vendor_info_id, user_id, business_name FROM vendor_info WHERE user_id = ?',
        [parseInt(userId)]
      );
      
      if (!vendorInfo) {
        throw new ApiError('Vendor not found', 404);
      }
      
      return vendorInfo;
    } else {
      throw new ApiError('Insufficient permissions', 403);
    }
  }

  private async updateProfile(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await req.json(); // Get raw data to handle complex structure

    // Extract address fields from nested object
    const addressData = data.address || {};

    await this.vendorService.update(vendorId, {
      business_name: data.businessName,
      business_description: data.businessDescription,
      business_phone: data.businessPhone || data.phone,
      business_email: data.businessEmail || data.contactEmail,
      website_url: data.website,
      business_address_line1: addressData.addressLine1 || data.address,
      business_city: addressData.city || data.city,
      business_state: addressData.state || data.state,
      business_postal_code: addressData.postalCode || data.zipCode,
      updated_at: new Date(),
    });

    return { message: 'Profile updated successfully' };
  }

  // Product management
  private async getProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const { products, total } = await this.vendorService.getVendorProducts(
      vendorId,
      {
        isActive: searchParams.get('active') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
        categoryId: this.sanitizeNumber(searchParams.get('categoryId')) || undefined,
        sortBy: searchParams.get('sortBy') as any || 'name',
        sortOrder: searchParams.get('sortOrder') as any || 'ASC',
        limit,
        offset,
      }
    );

    const paginatedResponse = this.buildPaginatedResponse(products, total, page, limit);
    
    // Return the paginated response directly - route.ts will wrap it
    return {
      products: paginatedResponse.data,
      pagination: paginatedResponse.pagination
    };
  }

  private async getProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Verify vendor owns the product
    const [ownership] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownership) {
      throw new ApiError('Product not found', 404);
    }

    // Get basic product details
    const product = await this.productService.getProductWithDetails(productId, undefined, vendorId);
    
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    try {
      // Get additional data needed for all tabs - each query wrapped in try-catch
      const results = await this.productService.executeParallel<{
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
          SELECT c.name 
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
          SELECT f.*, pf.product_feature_id
          FROM product_features pf
          JOIN features f ON pf.feature_id = f.feature_id
          WHERE pf.product_id = ?
          ORDER BY f.display_order
        `,
        params: [productId]
      }
    });


    const { categories, options, specifications, pricingMatrix, fabric, rooms, features } = results;

    // Check for null results and default to empty arrays
    const safeCategories = categories || [];
    const safeOptions = options || [];
    const safeSpecifications = specifications || [];
    const safePricingMatrix = pricingMatrix || [];
    const safeFabric = fabric || [];
    const safeRooms = rooms || [];
    const safeFeatures = features || [];

    // Get primary category
    const primaryCategoryResult = await this.productService.executeQuery(
      `SELECT c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.category_id 
       WHERE p.product_id = ?`,
      [productId]
    );
    const primaryCategory = primaryCategoryResult[0];

    // Parse fabric data if it exists
    let fabricData = { fabrics: [] };
    if (safeFabric && safeFabric.length > 0) {
      // Convert fabric options from database format to expected format
      fabricData.fabrics = safeFabric.map(f => ({
        id: `fabric_${f.fabric_option_id}`,
        name: f.fabric_name || f.name || '',
        image: f.image_url ? {
          id: `fabric_image_${f.fabric_option_id}`,
          url: f.image_url,
          name: f.image_name || f.fabric_name || ''
        } : null,
        price: f.price_per_sqft ? parseFloat(f.price_per_sqft) * 100 : 0, // Convert back from price per sqft
        fabricType: f.fabric_type || 'colored',
        enabled: f.is_enabled === 1
      }));
    }

    // Parse options data if it exists
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
      // Group dimensions by type (width/height)
      const widthDim = safeOptions.find(o => o.dimension_type_id === 1); // Assuming 1 is width
      const heightDim = safeOptions.find(o => o.dimension_type_id === 2); // Assuming 2 is height
      
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
      // Group specifications by category
      const mountTypes: any[] = [];
      const liftSystems: any[] = [];
      const wandSystem: any[] = [];
      const stringSystem: any[] = [];
      const remoteControl: any[] = [];
      const valanceOptions: any[] = [];
      const bottomRailOptions: any[] = [];
      
      safeSpecifications.forEach(spec => {
        // Parse the spec_value if it's a JSON string
        let value = spec.spec_value;
        try {
          // Check if spec_value is a JSON string
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            value = JSON.parse(value);
          }
        } catch (e) {
          // If parsing fails, create a basic object with the string value
          value = { name: value, price_adjustment: 0, enabled: true };
        }
        
        // Ensure value is an object with the expected properties
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
      
      // Update optionsData with specifications
      optionsData.mountTypes = mountTypes;
      optionsData.controlTypes.liftSystems = liftSystems;
      optionsData.controlTypes.wandSystem = wandSystem;
      optionsData.controlTypes.stringSystem = stringSystem;
      optionsData.controlTypes.remoteControl = remoteControl;
      optionsData.valanceOptions = valanceOptions;
      optionsData.bottomRailOptions = bottomRailOptions;
    }

      // Build enhanced product response
      const enhancedProduct = {
        ...product,
        categories: safeCategories.map(c => c.name),
        primary_category: primaryCategory?.category_name || product.category_name || '',
        short_description: product.short_description || product.description || '',
        full_description: product.full_description || product.description || '',
        brand: product.brand_name || '', // Add brand for UI compatibility
        options: optionsData,
        pricing_matrix: safePricingMatrix || [],
        fabric: fabricData,
        roomRecommendations: safeRooms.map(room => ({
          id: room.id?.toString() || '',
          roomType: room.room_type || room.room_name || '',
          recommendation: room.special_considerations || '',
          priority: room.suitability_score || 5
        })) || [],
        images: product.images || [], // Ensure images are included
        features: safeFeatures || [] // Include features
      };

      return { product: enhancedProduct };
    } catch (error) {
      // Return basic product data if enhanced fetch fails
      return {
        product: {
          ...product,
          categories: [],
          primary_category: product.category_name || '',
          short_description: product.short_description || product.description || '',
          full_description: product.full_description || product.description || '',
          options: null,
          pricing_matrix: [],
          fabric: { fabrics: [] },
          roomRecommendations: [],
          images: product.images || [], // Ensure images are included
          features: product.features || [] // Include features from base product
        }
      };
    }
  }

  private async createProduct(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await req.json();

    // Begin transaction
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();

      // Get category_id from category name
      let categoryId = null;
      if (data.primary_category) {
        const [category] = await conn.execute(
          'SELECT category_id FROM categories WHERE name = ?',
          [data.primary_category]
        );
        if (category && category[0]) {
          categoryId = category[0].category_id;
        }
      }

      // Create basic product
      const [result] = await conn.execute(
        `INSERT INTO products (
          name, slug, sku, short_description, full_description, 
          base_price, is_active, is_featured, category_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.name,
          data.slug,
          data.sku,
          data.short_description,
          data.full_description || data.description || data.short_description,
          data.base_price,
          data.is_active ? 1 : 0,
          data.is_featured ? 1 : 0,
          categoryId
        ]
      );

      const productId = result.insertId;

      // Add vendor relationship
      await conn.execute(
        `INSERT INTO vendor_products (vendor_id, product_id, vendor_price, quantity_available)
         VALUES (?, ?, ?, ?)`,
        [vendorId, productId, data.base_price, 999]
      );

      // Add categories
      if (data.categories && Array.isArray(data.categories)) {
        for (const categoryName of data.categories) {
          const [category] = await conn.execute(
            'SELECT category_id FROM categories WHERE name = ?',
            [categoryName]
          );
          if (category && category[0]) {
            await conn.execute(
              'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
              [productId, category[0].category_id]
            );
          }
        }
      }

      // Add options (using product_dimensions table)
      if (data.options && data.options.dimensions) {
        // Insert width dimension
        await conn.execute(
          `INSERT INTO product_dimensions (
            product_id, dimension_type_id, min_value, max_value, increment_value, unit
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            1, // Width type
            data.options.dimensions.minWidth || 12,
            data.options.dimensions.maxWidth || 96,
            data.options.dimensions.widthIncrement || 0.125,
            'inches'
          ]
        );
        
        // Insert height dimension
        await conn.execute(
          `INSERT INTO product_dimensions (
            product_id, dimension_type_id, min_value, max_value, increment_value, unit
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            2, // Height type
            data.options.dimensions.minHeight || 12,
            data.options.dimensions.maxHeight || 120,
            data.options.dimensions.heightIncrement || 0.125,
            'inches'
          ]
        );
      }

      // Add pricing matrix
      if (data.pricing_matrix && Array.isArray(data.pricing_matrix)) {
        for (const price of data.pricing_matrix) {
          await conn.execute(
            `INSERT INTO product_pricing_matrix (
              product_id, width_min, width_max, height_min, height_max,
              base_price, price_per_sqft, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              price.width_min,
              price.width_max,
              price.height_min,
              price.height_max,
              price.base_price || 0,
              price.price_per_sqft || 0,
              price.is_active !== undefined ? price.is_active : 1
            ]
          );
        }
      }

      // Add fabric (using product_fabric_options table)
      if (data.fabric && data.fabric.fabrics) {
        for (const fabric of data.fabric.fabrics) {
          if (fabric.name) {
            // Insert fabric option
            const [fabricResult] = await conn.execute(
              `INSERT INTO product_fabric_options (
                product_id, vendor_id, fabric_name, fabric_type, is_enabled
              ) VALUES (?, ?, ?, ?, ?)`,
              [
                productId,
                vendorId,
                fabric.name,
                fabric.fabricType || 'colored',
                fabric.enabled ? 1 : 0
              ]
            );
            
            const fabricOptionId = fabricResult.insertId;
            
            // Insert fabric image if exists
            if (fabric.image && fabric.image.url) {
              await conn.execute(
                `INSERT INTO product_fabric_images (
                  fabric_option_id, product_id, image_url, image_name, image_alt, image_size, image_type, is_primary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  fabricOptionId,
                  productId,
                  fabric.image.url,
                  fabric.image.name || fabric.name,
                  fabric.name,
                  fabric.image.size || 0,
                  fabric.image.type || 'image/jpeg',
                  1
                ]
              );
            }
            
            // Optionally insert fabric pricing
            if (fabric.price && fabric.price > 0) {
              await conn.execute(
                `INSERT INTO product_fabric_pricing (
                  fabric_option_id, product_id, min_width, max_width, min_height, max_height, price_per_sqft
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  fabricOptionId,
                  productId,
                  0,      // min_width
                  999,    // max_width
                  0,      // min_height
                  999,    // max_height
                  fabric.price / 100  // Convert to price per sqft
                ]
              );
            }
          }
        }
      }

      // Add features
      if (data.features && Array.isArray(data.features)) {
        for (let i = 0; i < data.features.length; i++) {
          const feature = data.features[i];
          // First, try to find or create the feature
          let [existingFeature] = await conn.execute(
            'SELECT feature_id FROM features WHERE name = ?',
            [feature.name || feature.title]
          );
          
          let featureId;
          if (!existingFeature || !existingFeature[0]) {
            // Create new feature
            const [featureResult] = await conn.execute(
              'INSERT INTO features (name, description, display_order) VALUES (?, ?, ?)',
              [feature.name || feature.title, feature.description || '', i]
            );
            featureId = featureResult.insertId;
          } else {
            featureId = existingFeature[0].feature_id;
          }
          
          // Link feature to product
          await conn.execute(
            'INSERT INTO product_features (product_id, feature_id) VALUES (?, ?)',
            [productId, featureId]
          );
        }
      }

      // Add room recommendations (using product_rooms table)
      if (data.roomRecommendations && Array.isArray(data.roomRecommendations)) {
        for (const room of data.roomRecommendations) {
          if (room.roomType || room.room_type || room.name) {
            await conn.execute(
              `INSERT INTO product_rooms 
               (product_id, room_type, suitability_score, special_considerations) 
               VALUES (?, ?, ?, ?)`,
              [
                productId,
                room.roomType || room.room_type || room.name,
                room.priority || room.suitability_score || 5,
                room.recommendation || room.special_considerations || null
              ]
            );
          }
        }
      }

      // Add images
      if (data.images && Array.isArray(data.images)) {
        for (let i = 0; i < data.images.length; i++) {
          const image = data.images[i];
          await conn.execute(
            `INSERT INTO product_images 
             (product_id, image_url, alt_text, is_primary, display_order) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              productId,
              image.url,
              image.alt || '',
              image.isPrimary ? 1 : 0,
              i
            ]
          );
        }
      }

      // Add product specifications (mount types, control types, etc.)
      if (data.options) {
        // Save mount types
        if (data.options.mountTypes && Array.isArray(data.options.mountTypes)) {
          for (let i = 0; i < data.options.mountTypes.length; i++) {
            const value = typeof data.options.mountTypes[i] === 'object' 
              ? JSON.stringify(data.options.mountTypes[i])
              : data.options.mountTypes[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'mount_type', value, 'mount_type', i]
            );
          }
        }
        
        // Save control types
        if (data.options.controlTypes) {
          // Lift systems
          if (Array.isArray(data.options.controlTypes.liftSystems)) {
            for (let i = 0; i < data.options.controlTypes.liftSystems.length; i++) {
              const value = typeof data.options.controlTypes.liftSystems[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.liftSystems[i])
                : data.options.controlTypes.liftSystems[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'lift_system', value, 'lift_system', i]
              );
            }
          }
          
          // Wand system
          if (Array.isArray(data.options.controlTypes.wandSystem)) {
            for (let i = 0; i < data.options.controlTypes.wandSystem.length; i++) {
              const value = typeof data.options.controlTypes.wandSystem[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.wandSystem[i])
                : data.options.controlTypes.wandSystem[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'wand_system', value, 'wand_system', i]
              );
            }
          }
          
          // String system
          if (Array.isArray(data.options.controlTypes.stringSystem)) {
            for (let i = 0; i < data.options.controlTypes.stringSystem.length; i++) {
              const value = typeof data.options.controlTypes.stringSystem[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.stringSystem[i])
                : data.options.controlTypes.stringSystem[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'string_system', value, 'string_system', i]
              );
            }
          }
          
          // Remote control
          if (Array.isArray(data.options.controlTypes.remoteControl)) {
            for (let i = 0; i < data.options.controlTypes.remoteControl.length; i++) {
              const value = typeof data.options.controlTypes.remoteControl[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.remoteControl[i])
                : data.options.controlTypes.remoteControl[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'remote_control', value, 'remote_control', i]
              );
            }
          }
        }
        
        // Save valance options
        if (data.options.valanceOptions && Array.isArray(data.options.valanceOptions)) {
          for (let i = 0; i < data.options.valanceOptions.length; i++) {
            const value = typeof data.options.valanceOptions[i] === 'object' 
              ? JSON.stringify(data.options.valanceOptions[i])
              : data.options.valanceOptions[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'valance_option', value, 'valance_option', i]
            );
          }
        }
        
        // Save bottom rail options
        if (data.options.bottomRailOptions && Array.isArray(data.options.bottomRailOptions)) {
          for (let i = 0; i < data.options.bottomRailOptions.length; i++) {
            const value = typeof data.options.bottomRailOptions[i] === 'object' 
              ? JSON.stringify(data.options.bottomRailOptions[i])
              : data.options.bottomRailOptions[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'bottom_rail_option', value, 'bottom_rail_option', i]
            );
          }
        }
      }

      await conn.commit();
      
      return { 
        product_id: productId,
        message: 'Product created successfully'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async updateProduct(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Verify ownership
    const [ownership] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownership) {
      throw new ApiError('Product not found', 404);
    }

    const data = await req.json();

    // Begin transaction
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();

      // Get category_id from category name
      let categoryId = null;
      if (data.primary_category) {
        const [category] = await conn.execute(
          'SELECT category_id FROM categories WHERE name = ?',
          [data.primary_category]
        );
        if (category && category[0]) {
          categoryId = category[0].category_id;
        }
      }

      // Update basic product info
      await conn.execute(
        `UPDATE products SET 
          name = ?, 
          slug = ?,
          sku = ?,
          short_description = ?,
          full_description = ?,
          base_price = ?,
          is_active = ?,
          is_featured = ?,
          category_id = ?,
          updated_at = NOW()
        WHERE product_id = ?`,
        [
          data.name,
          data.slug,
          data.sku,
          data.short_description,
          data.full_description || data.description || data.short_description,
          data.base_price,
          data.is_active ? 1 : 0,
          data.is_featured ? 1 : 0,
          categoryId,
          productId
        ]
      );

      // Update categories
      if (data.categories && Array.isArray(data.categories)) {
        // Delete existing categories
        await conn.execute('DELETE FROM product_categories WHERE product_id = ?', [productId]);
        
        // Insert new categories
        for (const categoryName of data.categories) {
          const [category] = await conn.execute(
            'SELECT category_id FROM categories WHERE name = ?',
            [categoryName]
          );
          if (category && category[0]) {
            await conn.execute(
              'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
              [productId, category[0].category_id]
            );
          }
        }
      }

      // Update options (using product_dimensions table)
      if (data.options) {
        // Delete existing dimensions and specifications
        await conn.execute('DELETE FROM product_dimensions WHERE product_id = ?', [productId]);
        await conn.execute('DELETE FROM product_specifications WHERE product_id = ? AND spec_category IN (?, ?, ?, ?, ?, ?, ?)', 
          [productId, 'mount_type', 'lift_system', 'wand_system', 'string_system', 'remote_control', 'valance_option', 'bottom_rail_option']);
        
        // Save dimensions
        if (data.options.dimensions) {
          // Insert width dimension
          await conn.execute(
            `INSERT INTO product_dimensions (
              product_id, dimension_type_id, min_value, max_value, increment_value, unit
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              productId,
              1, // Width type
              data.options.dimensions.minWidth || 12,
              data.options.dimensions.maxWidth || 96,
              data.options.dimensions.widthIncrement || 0.125,
              'inches'
            ]
          );
          
          // Insert height dimension
          await conn.execute(
            `INSERT INTO product_dimensions (
              product_id, dimension_type_id, min_value, max_value, increment_value, unit
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              productId,
              2, // Height type
              data.options.dimensions.minHeight || 12,
              data.options.dimensions.maxHeight || 120,
              data.options.dimensions.heightIncrement || 0.125,
              'inches'
            ]
          );
        }
        
        // Save mount types
        if (data.options.mountTypes && Array.isArray(data.options.mountTypes)) {
          for (let i = 0; i < data.options.mountTypes.length; i++) {
            const value = typeof data.options.mountTypes[i] === 'object' 
              ? JSON.stringify(data.options.mountTypes[i])
              : data.options.mountTypes[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'mount_type', value, 'mount_type', i]
            );
          }
        }
        
        // Save control types
        if (data.options.controlTypes) {
          // Lift systems
          if (Array.isArray(data.options.controlTypes.liftSystems)) {
            for (let i = 0; i < data.options.controlTypes.liftSystems.length; i++) {
              const value = typeof data.options.controlTypes.liftSystems[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.liftSystems[i])
                : data.options.controlTypes.liftSystems[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'lift_system', value, 'lift_system', i]
              );
            }
          }
          
          // Wand system
          if (Array.isArray(data.options.controlTypes.wandSystem)) {
            for (let i = 0; i < data.options.controlTypes.wandSystem.length; i++) {
              const value = typeof data.options.controlTypes.wandSystem[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.wandSystem[i])
                : data.options.controlTypes.wandSystem[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'wand_system', value, 'wand_system', i]
              );
            }
          }
          
          // String system
          if (Array.isArray(data.options.controlTypes.stringSystem)) {
            for (let i = 0; i < data.options.controlTypes.stringSystem.length; i++) {
              const value = typeof data.options.controlTypes.stringSystem[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.stringSystem[i])
                : data.options.controlTypes.stringSystem[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'string_system', value, 'string_system', i]
              );
            }
          }
          
          // Remote control
          if (Array.isArray(data.options.controlTypes.remoteControl)) {
            for (let i = 0; i < data.options.controlTypes.remoteControl.length; i++) {
              const value = typeof data.options.controlTypes.remoteControl[i] === 'object' 
                ? JSON.stringify(data.options.controlTypes.remoteControl[i])
                : data.options.controlTypes.remoteControl[i];
              await conn.execute(
                `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productId, 'remote_control', value, 'remote_control', i]
              );
            }
          }
        }
        
        // Save valance options
        if (data.options.valanceOptions && Array.isArray(data.options.valanceOptions)) {
          for (let i = 0; i < data.options.valanceOptions.length; i++) {
            const value = typeof data.options.valanceOptions[i] === 'object' 
              ? JSON.stringify(data.options.valanceOptions[i])
              : data.options.valanceOptions[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'valance_option', value, 'valance_option', i]
            );
          }
        }
        
        // Save bottom rail options
        if (data.options.bottomRailOptions && Array.isArray(data.options.bottomRailOptions)) {
          for (let i = 0; i < data.options.bottomRailOptions.length; i++) {
            const value = typeof data.options.bottomRailOptions[i] === 'object' 
              ? JSON.stringify(data.options.bottomRailOptions[i])
              : data.options.bottomRailOptions[i];
            await conn.execute(
              `INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_category, display_order) 
               VALUES (?, ?, ?, ?, ?)`,
              [productId, 'bottom_rail_option', value, 'bottom_rail_option', i]
            );
          }
        }
      }

      // Update pricing matrix
      if (data.pricing_matrix && Array.isArray(data.pricing_matrix)) {
        // Delete existing pricing matrix
        await conn.execute('DELETE FROM product_pricing_matrix WHERE product_id = ?', [productId]);
        
        // Insert new pricing matrix
        for (const price of data.pricing_matrix) {
          await conn.execute(
            `INSERT INTO product_pricing_matrix (
              product_id, width_min, width_max, height_min, height_max,
              base_price, price_per_sqft, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              price.width_min,
              price.width_max,
              price.height_min,
              price.height_max,
              price.base_price || 0,
              price.price_per_sqft || 0,
              price.is_active !== undefined ? price.is_active : 1
            ]
          );
        }
      }

      // Update fabric (using product_fabric_options table)
      if (data.fabric && data.fabric.fabrics) {
        // Delete existing fabric options and images
        await conn.execute('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
        await conn.execute('DELETE FROM product_fabric_images WHERE product_id = ?', [productId]);
        
        // Insert new fabric options
        for (const fabric of data.fabric.fabrics) {
          if (fabric.name) {
            // Insert fabric option
            const [fabricResult] = await conn.execute(
              `INSERT INTO product_fabric_options (
                product_id, vendor_id, fabric_name, fabric_type, is_enabled
              ) VALUES (?, ?, ?, ?, ?)`,
              [
                productId,
                vendorId,
                fabric.name,
                fabric.fabricType || 'colored',
                fabric.enabled ? 1 : 0
              ]
            );
            
            const fabricOptionId = fabricResult.insertId;
            
            // Insert fabric image if exists
            if (fabric.image && fabric.image.url) {
              await conn.execute(
                `INSERT INTO product_fabric_images (
                  fabric_option_id, product_id, image_url, image_name, image_alt, image_size, image_type, is_primary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  fabricOptionId,
                  productId,
                  fabric.image.url,
                  fabric.image.name || fabric.name,
                  fabric.name,
                  fabric.image.size || 0,
                  fabric.image.type || 'image/jpeg',
                  1
                ]
              );
            }
            
            // Optionally insert fabric pricing (using a simple flat price for now)
            if (fabric.price && fabric.price > 0) {
              await conn.execute(
                `INSERT INTO product_fabric_pricing (
                  fabric_option_id, product_id, min_width, max_width, min_height, max_height, price_per_sqft
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  fabricOptionId,
                  productId,
                  0,      // min_width
                  999,    // max_width (large number for "all sizes")
                  0,      // min_height
                  999,    // max_height
                  fabric.price / 100  // Convert to price per sqft (rough approximation)
                ]
              );
            }
          }
        }
      }

      // Update features
      if (data.features && Array.isArray(data.features)) {
        // Delete existing features
        await conn.execute('DELETE FROM product_features WHERE product_id = ?', [productId]);
        
        // Insert new features
        for (let i = 0; i < data.features.length; i++) {
          const feature = data.features[i];
          // First, try to find or create the feature
          let [existingFeature] = await conn.execute(
            'SELECT feature_id FROM features WHERE name = ?',
            [feature.name || feature.title]
          );
          
          let featureId;
          if (!existingFeature || !existingFeature[0]) {
            // Create new feature
            const [result] = await conn.execute(
              'INSERT INTO features (name, description, display_order) VALUES (?, ?, ?)',
              [feature.name || feature.title, feature.description || '', i]
            );
            featureId = result.insertId;
          } else {
            featureId = existingFeature[0].feature_id;
          }
          
          // Link feature to product
          await conn.execute(
            'INSERT INTO product_features (product_id, feature_id) VALUES (?, ?)',
            [productId, featureId]
          );
        }
      }

      // Update room recommendations (using product_rooms table)
      if (data.roomRecommendations && Array.isArray(data.roomRecommendations)) {
        // Delete existing recommendations
        await conn.execute('DELETE FROM product_rooms WHERE product_id = ?', [productId]);
        
        // Insert new recommendations
        for (const room of data.roomRecommendations) {
          if (room.roomType || room.room_type || room.name) {
            await conn.execute(
              `INSERT INTO product_rooms 
               (product_id, room_type, suitability_score, special_considerations) 
               VALUES (?, ?, ?, ?)`,
              [
                productId,
                room.roomType || room.room_type || room.name,
                room.priority || room.suitability_score || 5,
                room.recommendation || room.special_considerations || null
              ]
            );
          }
        }
      }

      // Update images (handled separately if needed)
      if (data.images && Array.isArray(data.images)) {
        // Delete existing images
        await conn.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
        
        // Insert new images
        for (let i = 0; i < data.images.length; i++) {
          const image = data.images[i];
          await conn.execute(
            `INSERT INTO product_images 
             (product_id, image_url, alt_text, is_primary, display_order) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              productId,
              image.url,
              image.alt || '',
              image.isPrimary ? 1 : 0,
              i
            ]
          );
        }
      }

      await conn.commit();
      
      return { 
        message: 'Product updated successfully',
        product_id: productId
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async deleteProduct(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      throw new ApiError('Invalid product ID', 400);
    }

    // Soft delete
    await this.productService.update(productId, {
      is_active: false,
      updated_at: new Date(),
    });

    return { message: 'Product deleted successfully' };
  }

  // Order management
  private async getOrders(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const { orders, total } = await this.orderService.getOrders({
      vendorId,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') 
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
      limit,
      offset,
    });

    return this.buildPaginatedResponse(orders, total, page, limit);
  }

  private async getOrder(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    // Verify vendor has items in this order
    // Check if order is assigned to this vendor OR if vendor has products in the order
    const [hasItems] = await this.vendorService.raw(
      `SELECT 1 FROM orders o 
       WHERE o.order_id = ? 
       AND (o.vendor_id = ? OR EXISTS (
         SELECT 1 FROM order_items oi 
         JOIN vendor_products vp ON oi.product_id = vp.product_id 
         WHERE oi.order_id = o.order_id AND vp.vendor_id = ?
       ))`,
      [orderId, vendorId, vendorId]
    );

    if (!hasItems) {
      throw new ApiError('Order not found', 404);
    }

    return this.orderService.getOrderWithDetails(orderId);
  }

  private async updateOrderStatus(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const { status, notes } = await this.getValidatedBody(req, z.object({
      status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
      notes: z.string().optional(),
    }));

    // TODO: Implement vendor-specific order status tracking
    // In a multi-vendor system, each vendor should be able to update the status of their items
    // This would require a vendor_order_status table or similar

    return { message: 'Order status updated successfully' };
  }

  // Discounts and coupons
  private async getDiscounts(user: any) {
    const vendorId = await this.getVendorId(user);
    const { discounts } = await this.vendorService.getVendorDiscounts(vendorId);
    
    return {
      discounts: discounts || [],
      total: discounts?.length || 0
    };
  }

  private async getCoupons(user: any) {
    const vendorId = await this.getVendorId(user);
    const { coupons } = await this.vendorService.getVendorDiscounts(vendorId);
    return {
      coupons: coupons || [],
      total: coupons?.length || 0
    };
  }

  private async createDiscount(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateDiscountSchema);

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_discounts (
        vendor_id, discount_name, discount_type, discount_value,
        minimum_order_value, applies_to, target_ids,
        valid_from, valid_until, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.name,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.appliesTo,
        JSON.stringify({
          products: data.productIds || [],
          categories: data.categoryIds || []
        }),
        data.startDate || new Date(),
        data.endDate || null,
        data.isActive,
      ]
    );

    return {
      discountId: (result as any).insertId,
      message: 'Discount created successfully',
    };
  }

  private async createCoupon(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const data = await this.getValidatedBody(req, CreateCouponSchema);

    // Check if code already exists
    const [exists] = await this.vendorService.raw(
      'SELECT 1 FROM vendor_coupons WHERE coupon_code = ?',
      [data.code]
    );

    if (exists) {
      throw new ApiError('Coupon code already exists', 400);
    }

    const result = await this.vendorService.raw(
      `INSERT INTO vendor_coupons (
        vendor_id, coupon_code, coupon_name, description, discount_type, discount_value,
        minimum_order_value, usage_limit_total, usage_limit_per_customer,
        valid_from, valid_until, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        vendorId,
        data.code,
        data.code, // Use code as name if no name provided
        data.description,
        data.discountType,
        data.discountValue,
        data.minPurchase,
        data.usageLimit,
        data.perCustomerLimit || 1,
        data.startDate || new Date(),
        data.endDate || null,
        data.isActive,
        user.userId,
      ]
    );

    return {
      couponId: (result as any).insertId,
      message: 'Coupon created successfully',
    };
  }

  // Analytics
  private async getAnalytics(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    
    // Parse range parameter (e.g., '30d', '7d', '90d')
    const range = searchParams.get('range') || '30d';
    let dateFrom: Date;
    let dateTo = new Date();
    
    // Convert range to date
    const rangeMatch = range.match(/(\d+)([dwmy])/);
    if (rangeMatch) {
      const [, value, unit] = rangeMatch;
      const daysMultiplier = {
        'd': 1,
        'w': 7,
        'm': 30,
        'y': 365
      }[unit] || 1;
      
      dateFrom = new Date(Date.now() - parseInt(value) * daysMultiplier * 24 * 60 * 60 * 1000);
    } else {
      // Default to 30 days if range format is invalid
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Also support explicit dateFrom/dateTo parameters
    if (searchParams.get('dateFrom')) {
      dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    if (searchParams.get('dateTo')) {
      dateTo = new Date(searchParams.get('dateTo')!);
    }

    try {
      const stats = await this.orderService.getOrderStatistics({
        vendorId,
        dateFrom,
        dateTo,
      });

      // Transform data to match expected frontend format
      return {
        overview: {
          total_revenue: stats.totalRevenue || 0,
          revenue_change: 0, // TODO: Calculate change percentage
          total_orders: stats.totalOrders || 0,
          orders_change: 0, // TODO: Calculate change percentage
          product_views: 0, // TODO: Implement product views tracking
          views_change: 0,
          conversion_rate: 0, // TODO: Calculate conversion rate
          conversion_change: 0,
          avg_rating: 0, // TODO: Get average rating from reviews
          commission_earned: 0 // TODO: Calculate commissions
        },
        sales_data: stats.revenueByMonth || [],
        product_performance: [], // TODO: Implement product performance
        customer_insights: [] // TODO: Implement customer insights
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new ApiError('Failed to fetch analytics data', 500);
    }
  }

  private async getFinancialSummary(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    return this.vendorService.getVendorFinancialSummary(vendorId, dateFrom, dateTo);
  }

  // Placeholder methods for remaining endpoints
  private async updateDiscount(id: string, req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async updateCoupon(id: string, req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async deleteDiscount(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async deleteCoupon(id: string, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  // Bulk product operations
  private async getBulkJobs(user: any) {
    const vendorId = await this.getVendorId(user);
    // Return mock data for now - in production this would query bulk_import_jobs table
    return {
      jobs: [],
      total: 0
    };
  }

  private async getBulkStats(user: any) {
    const vendorId = await this.getVendorId(user);
    const stats = await this.vendorService.getVendorWithStats(vendorId);
    
    return {
      totalProducts: stats?.total_products || 0,
      activeProducts: stats?.active_products || 0,
      inactiveProducts: (stats?.total_products || 0) - (stats?.active_products || 0),
      totalCategories: 0, // TODO: Implement category count
      recentJobs: 0
    };
  }

  private async getBulkTemplate() {
    // Return CSV template headers
    const headers = [
      'name',
      'sku',
      'category_id',
      'base_price',
      'short_description',
      'full_description',
      'is_active',
      'is_featured',
      'stock_quantity',
      'min_width',
      'max_width',
      'min_height', 
      'max_height'
    ];
    
    return {
      template: headers.join(','),
      headers,
      mimeType: 'text/csv',
      filename: 'product_import_template.csv'
    };
  }

  private async exportProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const searchParams = this.getSearchParams(req);
    const format = searchParams.get('format') || 'csv';
    
    // Get all vendor products
    const { products } = await this.vendorService.getVendorProducts(vendorId, {
      limit: 10000 // Get all products for export
    });
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(products[0] || {});
      const csv = [
        headers.join(','),
        ...products.map(p => headers.map(h => JSON.stringify(p[h] || '')).join(','))
      ].join('\n');
      
      return {
        data: csv,
        mimeType: 'text/csv',
        filename: `products_export_${new Date().toISOString().split('T')[0]}.csv`
      };
    } else {
      return {
        data: products,
        mimeType: 'application/json',
        filename: `products_export_${new Date().toISOString().split('T')[0]}.json`
      };
    }
  }

  private async bulkImportProducts(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    // TODO: Implement actual file processing
    // For now, return a mock job response
    return {
      job_id: `job_${Date.now()}`,
      status: 'processing',
      message: 'Bulk import job started successfully'
    };
  }

  private async getProductAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getRevenueAnalytics(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async getSalesTeam(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();
    
    try {
      // Get sales team members for this vendor
      const [salesTeam] = await pool.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        WHERE ss.vendor_id = ?
        ORDER BY ss.created_at DESC
      `, [vendorId]);
      
      return {
        salesTeam: salesTeam || [],
        total: (salesTeam as any[])?.length || 0
      };
    } catch (error) {
      console.error('Error fetching sales team:', error);
      throw new ApiError('Failed to fetch sales team', 500);
    }
  }

  private async addSalesRep(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    
    const {
      email,
      firstName,
      lastName,
      phone,
      territory,
      commissionRate,
      targetSales,
      isActive
    } = body;
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Check if user with email already exists
      const [existingUser] = await conn.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );
      
      let userId;
      
      if ((existingUser as any[]).length > 0) {
        // User exists, check if already a sales rep for this vendor
        userId = (existingUser as any[])[0].user_id;
        
        const [existingSalesRep] = await conn.execute(
          'SELECT sales_staff_id FROM sales_staff WHERE user_id = ? AND vendor_id = ?',
          [userId, vendorId]
        );
        
        if ((existingSalesRep as any[]).length > 0) {
          throw new ApiError('This user is already a sales representative for your company', 400);
        }
      } else {
        // Create new user with sales_representative role
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const [result] = await conn.execute(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, phone, 
            role, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'sales', 1, NOW(), NOW())`,
          [email, hashedPassword, firstName, lastName, phone]
        );
        
        userId = (result as any).insertId;
        
        // TODO: Send welcome email with temporary password
      }
      
      // Create sales staff record
      const [salesResult] = await conn.execute(
        `INSERT INTO sales_staff (
          user_id, vendor_id, commission_rate, target_sales, territory,
          is_active, total_sales, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [userId, vendorId, commissionRate, targetSales, territory, isActive ? 1 : 0]
      );
      
      await conn.commit();
      
      // Fetch and return the created sales rep
      const [newSalesRep] = await conn.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        WHERE ss.sales_staff_id = ?
      `, [(salesResult as any).insertId]);
      
      return {
        success: true,
        salesRep: (newSalesRep as any[])[0]
      };
      
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async updateSalesRep(id: string, req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid sales staff ID', 400);
    }
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      // Check if the sales rep belongs to this vendor
      const [salesRep] = await conn.execute(
        'SELECT ss.sales_staff_id, ss.user_id FROM sales_staff ss WHERE ss.sales_staff_id = ? AND ss.vendor_id = ?',
        [id, vendorId]
      );
      
      if ((salesRep as any[]).length === 0) {
        throw new ApiError('Sales representative not found', 404);
      }
      
      const userId = (salesRep as any[])[0].user_id;
      
      await conn.beginTransaction();
      
      // Update user information if provided
      if (body.firstName || body.lastName || body.phone) {
        const updates = [];
        const values = [];
        
        if (body.firstName) {
          updates.push('first_name = ?');
          values.push(body.firstName);
        }
        if (body.lastName) {
          updates.push('last_name = ?');
          values.push(body.lastName);
        }
        if (body.phone !== undefined) {
          updates.push('phone = ?');
          values.push(body.phone);
        }
        
        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          values.push(userId);
          
          await conn.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
          );
        }
      }
      
      // Update sales staff information
      const staffUpdates = [];
      const staffValues = [];
      
      if (body.territory !== undefined) {
        staffUpdates.push('territory = ?');
        staffValues.push(body.territory);
      }
      if (body.commissionRate !== undefined) {
        staffUpdates.push('commission_rate = ?');
        staffValues.push(body.commissionRate);
      }
      if (body.targetSales !== undefined) {
        staffUpdates.push('target_sales = ?');
        staffValues.push(body.targetSales);
      }
      if (body.isActive !== undefined) {
        staffUpdates.push('is_active = ?');
        staffValues.push(body.isActive ? 1 : 0);
      }
      
      if (staffUpdates.length > 0) {
        staffUpdates.push('updated_at = NOW()');
        staffValues.push(id);
        
        await conn.execute(
          `UPDATE sales_staff SET ${staffUpdates.join(', ')} WHERE sales_staff_id = ?`,
          staffValues
        );
      }
      
      await conn.commit();
      
      // Fetch and return the updated sales rep
      const [updatedSalesRep] = await conn.execute(`
        SELECT 
          ss.sales_staff_id as salesStaffId,
          ss.user_id as userId,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.phone,
          ss.territory,
          ss.commission_rate as commissionRate,
          ss.target_sales as targetSales,
          COALESCE(ss.total_sales, 0) as totalSales,
          ss.is_active as isActive,
          ss.created_at as startDate
        FROM sales_staff ss
        JOIN users u ON ss.user_id = u.user_id
        WHERE ss.sales_staff_id = ?
      `, [id]);
      
      return {
        success: true,
        salesRep: (updatedSalesRep as any[])[0]
      };
      
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  private async removeSalesRep(id: string, user: any) {
    const vendorId = await this.getVendorId(user);
    
    if (!id || isNaN(Number(id))) {
      throw new ApiError('Invalid sales staff ID', 400);
    }
    
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      // Check if the sales rep belongs to this vendor
      const [salesRep] = await conn.execute(
        'SELECT sales_staff_id FROM sales_staff WHERE sales_staff_id = ? AND vendor_id = ?',
        [id, vendorId]
      );
      
      if ((salesRep as any[]).length === 0) {
        throw new ApiError('Sales representative not found', 404);
      }
      
      // Soft delete by setting is_active to 0
      await conn.execute(
        'UPDATE sales_staff SET is_active = 0, updated_at = NOW() WHERE sales_staff_id = ?',
        [id]
      );
      
      return {
        success: true,
        message: 'Sales representative removed successfully'
      };
      
    } finally {
      conn.release();
    }
  }

  private async getReviews(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  private async requestPayout(req: NextRequest, user: any) {
    throw new ApiError('Not implemented', 501);
  }

  // Shipments management
  private async getShipments(req: NextRequest, user: any) {
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();
    
    try {
      const searchParams = new URL(req.url).searchParams;
      const status = searchParams.get('status') || 'all';
      const carrier = searchParams.get('carrier') || 'all';
      const search = searchParams.get('search') || '';
      
      // Get orders with shipping info and fulfillment data for this vendor
      let query = `
        SELECT 
          o.order_id,
          o.order_number,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          usa.address_line_1,
          usa.address_line_2,
          usa.city,
          usa.state_province,
          usa.postal_code,
          usa.country,
          ful.tracking_number,
          ful.carrier,
          o.status as order_status,
          o.created_at as created_date,
          o.shipping_amount as shipping_cost,
          ful.estimated_delivery,
          ful.fulfillment_notes as notes,
          ful.created_at as fulfilled_date
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        LEFT JOIN order_fulfillment ful ON o.order_id = ful.order_id
        WHERE o.vendor_id = ?
        AND o.status IN ('pending', 'processing', 'shipped', 'delivered')
      `;
      
      const params: any[] = [vendorId];
      
      if (status !== 'all') {
        // Map shipment status to order status
        const statusMap: Record<string, string> = {
          'pending': 'pending',
          'picked_up': 'processing',
          'in_transit': 'shipped',
          'out_for_delivery': 'shipped',
          'delivered': 'delivered'
        };
        if (statusMap[status]) {
          query += ' AND o.status = ?';
          params.push(statusMap[status]);
        }
      }
      
      if (carrier !== 'all') {
        query += ' AND ful.carrier = ?';
        params.push(carrier);
      }
      
      if (search) {
        query += ' AND (ful.tracking_number LIKE ? OR o.order_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY o.created_at DESC';
      
      const [orders] = await pool.execute(query, params);
      
      // Transform orders to shipments format
      const shipments = await Promise.all(
        (orders as any[]).map(async (order) => {
          const [items] = await pool.execute(`
            SELECT 
              oi.order_item_id as id,
              p.name as product_name,
              oi.quantity,
              p.sku
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
          `, [order.order_id]);
          
          // Build full address
          const addressParts = [
            order.address_line_1,
            order.address_line_2,
            `${order.city}, ${order.state_province} ${order.postal_code}`,
            order.country
          ].filter(Boolean).join(', ');
          
          // Map order status to shipment status
          let shipmentStatus = 'pending';
          if (order.order_status === 'processing') {
            shipmentStatus = order.tracking_number ? 'picked_up' : 'pending';
          } else if (order.order_status === 'shipped') {
            shipmentStatus = order.tracking_number ? 'in_transit' : 'out_for_delivery';
          } else if (order.order_status === 'delivered') {
            shipmentStatus = 'delivered';
          } else if (order.order_status === 'cancelled' || order.order_status === 'refunded') {
            shipmentStatus = 'failed';
          }
          
          // Calculate estimated delivery if not set
          const estimatedDelivery = order.estimated_delivery || 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          
          return {
            id: `ship_${order.order_id}`,
            order_id: order.order_number,
            customer_name: order.customer_name,
            shipping_address: addressParts,
            tracking_number: order.tracking_number || '',
            carrier: order.carrier || 'ups',
            status: shipmentStatus,
            created_date: order.created_date,
            shipped_date: order.fulfilled_date || null,
            estimated_delivery: estimatedDelivery,
            actual_delivery: order.order_status === 'delivered' ? order.fulfilled_date : null,
            items: items || [],
            weight: 2.5, // Default weight for now
            dimensions: '12x8x4', // Default dimensions for now
            shipping_cost: parseFloat(order.shipping_cost) || 0,
            notes: order.notes || ''
          };
        })
      );
      
      return {
        shipments: shipments,
        total: shipments.length
      };
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw new ApiError('Failed to fetch shipments', 500);
    }
  }

  private async getShipment(id: string, user: any) {
    // Extract order_id from shipment id (format: ship_123)
    const orderId = id.replace('ship_', '');
    if (!orderId || isNaN(Number(orderId))) {
      throw new ApiError('Invalid shipment ID', 400);
    }
    
    const vendorId = await this.getVendorId(user);
    const pool = await getPool();
    
    try {
      const [orders] = await pool.execute(`
        SELECT 
          o.order_id,
          o.order_number,
          CONCAT(u.first_name, ' ', u.last_name) as customer_name,
          usa.address_line_1,
          usa.address_line_2,
          usa.city,
          usa.state_province,
          usa.postal_code,
          usa.country,
          ful.tracking_number,
          ful.carrier,
          o.status as order_status,
          o.created_at as created_date,
          o.shipping_amount as shipping_cost,
          ful.estimated_delivery,
          ful.fulfillment_notes as notes,
          ful.created_at as fulfilled_date
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
        LEFT JOIN order_fulfillment ful ON o.order_id = ful.order_id
        WHERE o.order_id = ? AND o.vendor_id = ?
      `, [orderId, vendorId]);
      
      if ((orders as any[]).length === 0) {
        throw new ApiError('Shipment not found', 404);
      }
      
      const order = (orders as any[])[0];
      
      // Get items
      const [items] = await pool.execute(`
        SELECT 
          oi.order_item_id as id,
          p.name as product_name,
          oi.quantity,
          p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `, [order.order_id]);
      
      // Build full address
      const addressParts = [
        order.address_line_1,
        order.address_line_2,
        `${order.city}, ${order.state_province} ${order.postal_code}`,
        order.country
      ].filter(Boolean).join(', ');
      
      // Map order status to shipment status
      let shipmentStatus = 'pending';
      if (order.order_status === 'processing') {
        shipmentStatus = order.tracking_number ? 'picked_up' : 'pending';
      } else if (order.order_status === 'shipped') {
        shipmentStatus = order.tracking_number ? 'in_transit' : 'out_for_delivery';
      } else if (order.order_status === 'delivered') {
        shipmentStatus = 'delivered';
      } else if (order.order_status === 'cancelled' || order.order_status === 'refunded') {
        shipmentStatus = 'failed';
      }
      
      // Calculate estimated delivery if not set
      const estimatedDelivery = order.estimated_delivery || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      return {
        id: id,
        order_id: order.order_number,
        customer_name: order.customer_name,
        shipping_address: addressParts,
        tracking_number: order.tracking_number || '',
        carrier: order.carrier || 'ups',
        status: shipmentStatus,
        created_date: order.created_date,
        shipped_date: order.fulfilled_date || null,
        estimated_delivery: estimatedDelivery,
        actual_delivery: order.order_status === 'delivered' ? order.fulfilled_date : null,
        items: items || [],
        weight: 2.5,
        dimensions: '12x8x4',
        shipping_cost: parseFloat(order.shipping_cost) || 0,
        notes: order.notes || ''
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error fetching shipment:', error);
      throw new ApiError('Failed to fetch shipment', 500);
    }
  }

  private async updateShipment(id: string, req: NextRequest, user: any) {
    // Extract order_id from shipment id (format: ship_123)
    const orderId = id.replace('ship_', '');
    if (!orderId || isNaN(Number(orderId))) {
      throw new ApiError('Invalid shipment ID', 400);
    }
    
    const vendorId = await this.getVendorId(user);
    const body = await req.json();
    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verify order belongs to vendor
      const [orders] = await conn.execute(`
        SELECT o.order_id, o.status
        FROM orders o
        WHERE o.order_id = ? AND o.vendor_id = ?
      `, [orderId, vendorId]);
      
      if ((orders as any[]).length === 0) {
        throw new ApiError('Shipment not found', 404);
      }
      
      const order = (orders as any[])[0];
      
      // Update order status if provided
      if (body.status) {
        // Map shipment status to order status
        const statusMap: Record<string, string> = {
          'pending': 'pending',
          'picked_up': 'processing',
          'in_transit': 'shipped',
          'out_for_delivery': 'shipped',
          'delivered': 'delivered',
          'failed': 'cancelled'
        };
        
        if (statusMap[body.status]) {
          await conn.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
            [statusMap[body.status], orderId]
          );
        }
      }
      
      // Check if fulfillment record exists
      const [fulfillment] = await conn.execute(
        'SELECT fulfillment_id FROM order_fulfillment WHERE order_id = ?',
        [orderId]
      );
      
      if ((fulfillment as any[]).length > 0) {
        // Update existing fulfillment record
        const updates = [];
        const values = [];
        
        if (body.tracking_number) {
          updates.push('tracking_number = ?');
          values.push(body.tracking_number);
        }
        
        if (body.carrier) {
          updates.push('carrier = ?');
          values.push(body.carrier);
        }
        
        if (body.notes !== undefined) {
          updates.push('fulfillment_notes = ?');
          values.push(body.notes);
        }
        
        if (body.estimated_delivery) {
          updates.push('estimated_delivery = ?');
          values.push(body.estimated_delivery);
        }
        
        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          values.push(orderId);
          
          await conn.execute(
            `UPDATE order_fulfillment SET ${updates.join(', ')} WHERE order_id = ?`,
            values
          );
        }
      } else {
        // Create new fulfillment record
        await conn.execute(
          `INSERT INTO order_fulfillment 
           (order_id, tracking_number, carrier, estimated_delivery, fulfillment_notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            orderId,
            body.tracking_number || null,
            body.carrier || 'ups',
            body.estimated_delivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            body.notes || null
          ]
        );
      }
      
      await conn.commit();
      
      return {
        success: true,
        message: 'Shipment updated successfully'
      };
    } catch (error) {
      await conn.rollback();
      if (error instanceof ApiError) throw error;
      console.error('Error updating shipment:', error);
      throw new ApiError('Failed to update shipment', 500);
    } finally {
      conn.release();
    }
  }

  private async getStorefront(user: any) {
    const vendorId = await this.getVendorId(user);
    const vendor = await this.vendorService.getVendorWithStats(vendorId);
    
    if (!vendor) {
      throw new ApiError('Vendor not found', 404);
    }

    // Get featured products
    const { products } = await this.vendorService.getVendorProducts(vendorId, {
      isActive: true,
      limit: 12,
      sortBy: 'sales',
      sortOrder: 'DESC'
    });

    return {
      vendor: {
        vendor_id: vendor.vendor_info_id,
        business_name: vendor.business_name,
        description: vendor.business_description,
        logo_url: vendor.logo_url,
        website_url: vendor.website_url,
        rating: vendor.average_rating || 0,
        total_reviews: vendor.total_reviews || 0,
        total_products: vendor.total_products || 0,
        is_verified: vendor.is_verified
      },
      featured_products: products,
      categories: [], // TODO: Implement vendor categories
      stats: {
        total_sales: vendor.total_sales || 0,
        active_products: vendor.active_products || 0,
        satisfaction_rate: vendor.average_rating ? (vendor.average_rating / 5 * 100) : 0
      }
    };
  }

  /**
   * Get vendor ID for the current user
   */
  private async getVendorId(user: any): Promise<number> {
    this.requireRole(user, 'VENDOR');
    
    // Get vendor ID from vendor_info table
    const [vendor] = await this.vendorService.raw(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );
    
    if (!vendor) {
      throw new ApiError('Vendor account not found', 404);
    }
    
    return vendor.vendor_info_id;
  }

  /**
   * Handle file uploads for vendor products
   */
  private async uploadFile(req: NextRequest, user: any) {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string || 'product';
      
      if (!file) {
        throw new ApiError('No file provided', 400);
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new ApiError('Invalid file type. Only JPEG, PNG, and WebP images are allowed', 400);
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new ApiError('File size too large. Maximum size is 5MB', 400);
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const filename = `vendor-${user.userId}-${timestamp}-${randomString}.${fileExtension}`;
      
      // Create upload directory path based on type
      const uploadDir = type === 'fabric' ? 'fabric' : 'products';
      const uploadPath = `uploads/${uploadDir}/${filename}`;
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Use the file system to save the file
      const fs = require('fs').promises;
      const path = require('path');
      const fullPath = path.join(process.cwd(), 'public', uploadPath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, buffer);
      
      // Return the response in the format expected by the frontend
      return {
        success: true,
        uploaded: [{
          secureUrl: `/${uploadPath}`,
          url: `/${uploadPath}`,
          filename: filename,
          size: file.size,
          type: file.type
        }]
      };
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to upload file', 500);
    }
  }
}