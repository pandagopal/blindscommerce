import { getPool } from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface ProductData {
  basicInfo: {
    name: string;
    shortDescription: string;
    fullDescription?: string;
    sku: string;
    basePrice: number;
    vendorId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    category: string;
    brand?: string;
  };
  options?: any;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  features?: Array<{ name: string; value?: string; description?: string }>;
}

/**
 * Get products with filters - works for both admin and vendor
 * @param filters Product filters
 * @param userId User ID for vendor filtering
 * @param role User role (admin/vendor)
 */
export async function getProducts(filters: ProductFilters, userId?: number, role?: string) {
  const pool = await getPool();
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const {
      search = '',
      category = '',
      status = '',
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;

    let query: string;
    const values: any[] = [];
    const conditions: string[] = [];

    // For vendors, we need to get their vendor_id first
    let vendorId: number | null = null;
    if (role === 'vendor' && userId) {
      const [vendorInfo] = await connection.query<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [userId]
      );
      if (vendorInfo.length > 0) {
        vendorId = vendorInfo[0].vendor_info_id;
      }
    }

    // Build base query
    if (role === 'vendor' && vendorId) {
      // Vendor query - only their products
      query = `
        SELECT 
          p.product_id,
          p.name,
          p.slug,
          p.short_description,
          p.sku,
          p.base_price,
          p.stock_status,
          p.is_active,
          p.created_at,
          p.updated_at,
          vp.vendor_price,
          vp.quantity_available,
          vp.is_active as vendor_active,
          GROUP_CONCAT(DISTINCT c.name ORDER BY pc.is_primary DESC, c.name ASC) as category_names,
          GROUP_CONCAT(DISTINCT c.category_id ORDER BY pc.is_primary DESC, c.name ASC) as category_ids,
          COALESCE(SUM(DISTINCT oi.quantity), 0) as total_sold
        FROM vendor_products vp
        JOIN products p ON vp.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.category_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        WHERE vp.vendor_id = ?
        GROUP BY p.product_id, p.name, p.slug, p.short_description, p.sku, p.base_price, 
                 p.stock_status, p.is_active, p.created_at, p.updated_at, 
                 vp.vendor_price, vp.quantity_available, vp.is_active
      `;
      values.push(vendorId);
    } else {
      // Admin query - all products
      query = `
        SELECT 
          p.product_id,
          p.name,
          p.slug,
          p.short_description,
          p.sku,
          p.base_price,
          p.stock_status,
          p.is_active,
          p.created_at,
          p.updated_at,
          GROUP_CONCAT(DISTINCT c.name ORDER BY pc.is_primary DESC, c.name ASC) as category_names,
          GROUP_CONCAT(DISTINCT c.category_id ORDER BY pc.is_primary DESC, c.name ASC) as category_ids,
          COALESCE(SUM(DISTINCT oi.quantity), 0) as total_sold
        FROM products p
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.category_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        WHERE 1=1
      `;
    }

    // Add search condition
    if (search) {
      conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add category filter
    if (category) {
      conditions.push('EXISTS (SELECT 1 FROM product_categories pc2 WHERE pc2.product_id = p.product_id AND pc2.category_id = ?)');
      values.push(category);
    }

    // Add status filter
    if (status) {
      if (role === 'vendor' && vendorId) {
        conditions.push('vp.is_active = ?');
      } else {
        conditions.push('p.is_active = ?');
      }
      values.push(status === 'active' ? 1 : 0);
    }

    // Add conditions to query
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Add GROUP BY (only for admin query, vendor query already has it)
    if (role !== 'vendor' || !vendorId) {
      query += ' GROUP BY p.product_id';
    }

    // Add sorting
    const validSortFields = ['name', 'base_price', 'stock_status', 'created_at', 'total_sold'];
    const validSortOrders = ['asc', 'desc'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    values.push(limit, offset);

    // Execute query
    const [rows] = await pool.query(query, values);

    // Get total count
    let countQuery: string;
    const countValues = [...values.slice(0, -2)]; // Remove limit and offset

    if (role === 'vendor' && vendorId) {
      countQuery = `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM vendor_products vp
        JOIN products p ON vp.product_id = p.product_id
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.category_id
        WHERE vp.vendor_id = ?
      `;
      if (conditions.length > 0) {
        countQuery += ' AND ' + conditions.join(' AND ');
      }
    } else {
      countQuery = `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM products p
        LEFT JOIN product_categories pc ON p.product_id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.category_id
        WHERE 1=1
      `;
      if (conditions.length > 0) {
        countQuery += ' AND ' + conditions.join(' AND ');
      }
    }

    const [countRows] = await pool.query(countQuery, countValues);
    const total = (countRows as any)[0]?.total || 0;

    // Format products
    const products = (rows as any[] || []).map(product => ({
      ...product,
      is_active: Boolean(product.is_active),
      vendor_active: product.vendor_active !== undefined ? Boolean(product.vendor_active) : undefined
    }));

    return {
      products,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Create a new product
 * @param data Product data
 * @param userId User ID creating the product
 * @param role User role (admin/vendor)
 */
export async function createProduct(data: ProductData, userId: number, role: string) {
  const pool = await getPool();
  let connection;
  
  try {
    connection = await pool.getConnection();
    // Transaction handling with pool - consider using connection from pool

    const { basicInfo, options, images = [], features = [] } = data;
    const {
      name,
      slug,
      shortDescription,
      fullDescription,
      sku,
      basePrice,
      vendorId,
      isActive = true,
      isFeatured = false,
      category,
      brand
    } = basicInfo;

    // Use provided slug or generate from name as fallback
    let finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if slug exists and make it unique
    let slugCounter = 0;
    let originalSlug = finalSlug;
    while (true) {
      const [existingProduct] = await connection.query<RowDataPacket[]>(
        'SELECT product_id FROM products WHERE slug = ? LIMIT 1',
        [finalSlug]
      );
      
      if (existingProduct.length === 0) {
        break; // Slug is unique
      }
      
      slugCounter++;
      finalSlug = `${originalSlug}-${slugCounter}`;
    }

    // Handle brand - get or create brand
    let brandId: number | null = null;
    if (brand && brand.trim()) {
      // Check if brand exists
      const [existingBrands] = await connection.query<RowDataPacket[]>(
        'SELECT brand_id FROM brands WHERE name = ?',
        [brand.trim()]
      );
      
      if (existingBrands.length > 0) {
        brandId = existingBrands[0].brand_id;
      } else {
        // Create new brand
        const brandSlug = brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [brandResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO brands (name, slug, is_active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
          [brand.trim(), brandSlug]
        );
        brandId = brandResult.insertId;
      }
    } else {
      // Create default brand for vendor products if no brand specified
      const defaultBrandName = role === 'vendor' ? 'Vendor Products' : 'General';
      const [existingDefaultBrand] = await connection.query<RowDataPacket[]>(
        'SELECT brand_id FROM brands WHERE name = ?',
        [defaultBrandName]
      );
      
      if (existingDefaultBrand.length > 0) {
        brandId = existingDefaultBrand[0].brand_id;
      } else {
        // Create default brand
        const defaultSlug = defaultBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [defaultBrandResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO brands (name, slug, is_active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
          [defaultBrandName, defaultSlug]
        );
        brandId = defaultBrandResult.insertId;
      }
    }

    // Insert the product
    const [productResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO products (
        name,
        slug,
        short_description,
        full_description,
        sku,
        base_price,
        brand_id,
        stock_status,
        status,
        is_active,
        is_featured,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_stock', 'active', ?, ?, NOW(), NOW())`,
      [name, finalSlug, shortDescription, fullDescription || '', sku, basePrice, brandId, isActive, isFeatured]
    );

    const productId = productResult.insertId;

    // Find and insert category
    if (category) {
      const [categoryRows] = await connection.query<RowDataPacket[]>(
        'SELECT category_id FROM categories WHERE name = ?',
        [category]
      );
      if (categoryRows.length > 0) {
        await pool.query(
          `INSERT INTO product_categories (
            product_id,
            category_id,
            is_primary,
            created_at
          ) VALUES (?, ?, 1, NOW())`,
          [productId, categoryRows[0].category_id]
        );
      }
    }

    // Handle vendor assignment
    if (role === 'admin' && vendorId && vendorId !== '' && vendorId !== 'marketplace') {
      // Admin creating product and assigning to vendor
      await pool.query(
        `INSERT INTO vendor_products (
          vendor_id,
          product_id,
          vendor_sku,
          vendor_price,
          quantity_available,
          minimum_order_qty,
          lead_time_days,
          is_active,
          vendor_description,
          vendor_notes
        ) VALUES (?, ?, ?, ?, 100, 1, 7, 1, ?, 'Product created by admin')`,
        [
          vendorId,
          productId,
          `V${vendorId}-${sku}`,
          basePrice,
          `${name} - Available from vendor`
        ]
      );
    } else if (role === 'admin' && (!vendorId || vendorId === '' || vendorId === 'marketplace')) {
      // Admin creating marketplace product - assign to default vendor or leave unassigned
      // For now, we'll leave it unassigned as the admin should specify a vendor
      console.log('Product created by admin but no vendor specified - product will be unassigned');
    } else if (role === 'vendor') {
      // Vendor creating their own product
      const [vendorInfo] = await connection.query<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [userId]
      );
      
      if (vendorInfo.length > 0) {
        await pool.query(
          `INSERT INTO vendor_products (
            vendor_id,
            product_id,
            vendor_sku,
            vendor_price,
            quantity_available,
            minimum_order_qty,
            lead_time_days,
            is_active,
            vendor_description
          ) VALUES (?, ?, ?, ?, 100, 1, 7, 1, ?)`,
          [
            vendorInfo[0].vendor_info_id,
            productId,
            sku,
            basePrice,
            shortDescription
          ]
        );
      }
    }

    // Insert images
    if (images.length > 0) {
      for (const image of images) {
        await pool.query(
          `INSERT INTO product_images (
            product_id,
            image_url,
            is_primary,
            created_at
          ) VALUES (?, ?, ?, NOW())`,
          [productId, image.url, image.isPrimary || false]
        );
      }
    }

    // Insert features
    if (features.length > 0) {
      for (const feature of features) {
        await pool.query(
          `INSERT INTO product_features (
            product_id,
            feature_name,
            feature_value,
            description,
            created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [
            productId,
            feature.name,
            feature.value || '',
            feature.description || ''
          ]
        );
      }
    }

    // Commit handling needs review with pool

    return {
      success: true,
      productId,
      message: 'Product created successfully'
    };
  } catch (error) {
    if (connection) {
      // Rollback handling needs review with pool
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}