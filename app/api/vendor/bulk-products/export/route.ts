import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ProductExportRow extends RowDataPacket {
  product_id: number;
  name: string;
  sku: string;
  description: string;
  short_description: string;
  category_name: string;
  brand_name: string;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  finish: string;
  is_active: number;
  is_featured: number;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorder: number;
  meta_title: string;
  meta_description: string;
  tags: string;
  image_urls: string;
  room_types: string;
  mount_types: string;
  control_types: string;
  light_filtering: string;
  energy_efficiency: string;
  child_safety_certified: number;
  warranty_years: number;
  custom_width_min: number;
  custom_width_max: number;
  custom_height_min: number;
  custom_height_max: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendorId = (vendors[0] as any).vendor_info_id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeImages = searchParams.get('includeImages') === 'true';
    const includePricing = searchParams.get('includePricing') === 'true';
    const includeInventory = searchParams.get('includeInventory') === 'true';
    const categoryFilter = searchParams.get('categoryFilter');

    // Build query
    let whereClause = 'WHERE vp.vendor_id = ?';
    const queryParams: any[] = [vendorId];

    if (!includeInactive) {
      whereClause += ' AND p.is_active = 1';
    }

    if (categoryFilter && categoryFilter.trim()) {
      whereClause += ' AND c.name LIKE ?';
      queryParams.push(`%${categoryFilter.trim()}%`);
    }

    // Build select fields based on options
    let selectFields = `
      p.product_id,
      p.name,
      p.sku,
      p.full_description as description,
      p.short_description,
      COALESCE(c.name, '') as category_name,
      COALESCE(vi.business_name, '') as brand_name,
      p.finish,
      p.is_active,
      p.is_featured,
      p.meta_title,
      p.meta_description,
      p.tags,
      p.room_types,
      p.mount_types,
      p.control_types,
      p.light_filtering,
      p.energy_efficiency,
      p.child_safety_certified,
      p.warranty_years,
      p.custom_width_min,
      p.custom_width_max,
      p.custom_height_min,
      p.custom_height_max,
      p.notes,
      p.created_at,
      p.updated_at
    `;

    if (includePricing) {
      selectFields += `,
        p.base_price,
        p.sale_price,
        p.cost_price
      `;
    }

    if (includeInventory) {
      selectFields += `,
        COALESCE(i.stock_quantity, 0) as stock_quantity,
        COALESCE(i.low_stock_threshold, 0) as low_stock_threshold,
        COALESCE(i.allow_backorder, 0) as allow_backorder
      `;
    }

    if (includeImages) {
      selectFields += `,
        GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.display_order SEPARATOR ',') as image_urls
      `;
    }

    const query = `
      SELECT ${selectFields}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      ${includeInventory ? 'LEFT JOIN product_inventory i ON p.product_id = i.product_id' : ''}
      ${includeImages ? 'LEFT JOIN product_images pi ON p.product_id = pi.product_id' : ''}
      ${whereClause}
      ${includeImages ? 'GROUP BY p.product_id' : ''}
      ORDER BY p.name
    `;

    const [products] = await pool.execute<ProductExportRow[]>(query, queryParams);

    // Generate CSV
    const headers = [
      'name',
      'sku',
      'description',
      'short_description',
      'category_name',
      'brand_name',
      ...(includePricing ? ['base_price', 'sale_price', 'cost_price'] : []),
      'finish',
      'is_active',
      'is_featured',
      ...(includeInventory ? ['stock_quantity', 'low_stock_threshold', 'allow_backorder'] : []),
      'meta_title',
      'meta_description',
      'tags',
      ...(includeImages ? ['image_urls'] : []),
      'room_types',
      'mount_types',
      'control_types',
      'light_filtering',
      'energy_efficiency',
      'child_safety_certified',
      'warranty_years',
      'custom_width_min',
      'custom_width_max',
      'custom_height_min',
      'custom_height_max',
      'notes',
      'created_at',
      'updated_at'
    ];

    const csvRows = [headers.join(',')];

    for (const product of products) {
      const row = [
        escapeCsvValue(product.name || ''),
        escapeCsvValue(product.sku || ''),
        escapeCsvValue(product.description || ''),
        escapeCsvValue(product.short_description || ''),
        escapeCsvValue(product.category_name || ''),
        escapeCsvValue(product.brand_name || ''),
        ...(includePricing ? [
          product.base_price || 0,
          product.sale_price || '',
          product.cost_price || ''
        ] : []),
        escapeCsvValue(product.finish || ''),
        product.is_active ? 'TRUE' : 'FALSE',
        product.is_featured ? 'TRUE' : 'FALSE',
        ...(includeInventory ? [
          product.stock_quantity || 0,
          product.low_stock_threshold || 0,
          product.allow_backorder ? 'TRUE' : 'FALSE'
        ] : []),
        escapeCsvValue(product.meta_title || ''),
        escapeCsvValue(product.meta_description || ''),
        escapeCsvValue(product.tags || ''),
        ...(includeImages ? [escapeCsvValue(product.image_urls || '')] : []),
        escapeCsvValue(product.room_types || ''),
        escapeCsvValue(product.mount_types || ''),
        escapeCsvValue(product.control_types || ''),
        escapeCsvValue(product.light_filtering || ''),
        escapeCsvValue(product.energy_efficiency || ''),
        product.child_safety_certified ? 'TRUE' : 'FALSE',
        product.warranty_years || 0,
        product.custom_width_min || 0,
        product.custom_width_max || 0,
        product.custom_height_min || 0,
        product.custom_height_max || 0,
        escapeCsvValue(product.notes || ''),
        product.created_at,
        product.updated_at
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-export-${timestamp}.csv`;

    const response = new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    );
  }
}

// Helper function to escape CSV values
function escapeCsvValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (!value) {
    return '';
  }

  const stringValue = value.toString();
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}