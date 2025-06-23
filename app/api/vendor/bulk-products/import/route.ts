import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

interface ProductRow {
  name: string;
  sku: string;
  description: string;
  short_description: string;
  category_name: string;
  brand_name: string;
  base_price: string;
  sale_price: string;
  cost_price: string;
  weight: string;
  width: string;
  height: string;
  depth: string;
  material: string;
  color: string;
  finish: string;
  is_active: string;
  is_featured: string;
  stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: string;
  meta_title: string;
  meta_description: string;
  tags: string;
  image_urls: string;
  room_types: string;
  mount_types: string;
  control_types: string;
  light_filtering: string;
  energy_efficiency: string;
  child_safety_certified: string;
  warranty_years: string;
  custom_width_min: string;
  custom_width_max: string;
  custom_height_min: string;
  custom_height_max: string;
  notes: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Invalid file. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header and validate
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const requiredHeaders = ['name', 'sku', 'category_name', 'base_price'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Create bulk job record
    const jobId = uuidv4();
    const [jobResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO bulk_product_jobs 
       (job_id, vendor_id, operation_type, file_name, total_records, status, created_at) 
       VALUES (?, ?, 'import', ?, ?, 'pending', NOW())`,
      [jobId, vendorId, file.name, lines.length - 1]
    );

    // Process CSV asynchronously
    processCSVImport(jobId, vendorId, headers, lines.slice(1));

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Import job started successfully',
      totalRecords: lines.length - 1,
    });

  } catch (error) {
    console.error('Error starting CSV import:', error);
    return NextResponse.json(
      { error: 'Failed to start import process' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Async function to process CSV import
async function processCSVImport(jobId: string, vendorId: number, headers: string[], dataLines: string[]) {
  const pool = await getPool();
  let successCount = 0;
  let errorCount = 0;
  const errors: ValidationError[] = [];

  try {
    // Update job status to processing
    await pool.execute(
      'UPDATE bulk_product_jobs SET status = ?, started_at = NOW() WHERE job_id = ?',
      ['processing', jobId]
    );

    // Get category mappings
    const [categories] = await pool.execute(
      'SELECT category_id, name FROM categories WHERE is_active = 1'
    );

    const categoryMap = new Map((categories as any[]).map(c => [c.name.toLowerCase(), c.category_id]));

    // Process each row
    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed
      
      try {
        const values = parseCSVLine(dataLines[i]);
        const rowData: any = {};
        
        // Map values to headers
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Validate and process row
        const validationErrors = validateProductRow(rowData, rowNumber);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          errorCount++;
          continue;
        }

        // Get or create category
        let categoryId = categoryMap.get(rowData.category_name?.toLowerCase());
        if (!categoryId && rowData.category_name) {
          const [categoryResult] = await pool.execute<ResultSetHeader>(
            'INSERT INTO categories (name, slug, is_active) VALUES (?, ?, 1)',
            [rowData.category_name, rowData.category_name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
          );
          categoryId = categoryResult.insertId;
          categoryMap.set(rowData.category_name.toLowerCase(), categoryId);
        }

        // Note: brand_name is ignored since vendor's business_name is used as brand

        // Create product slug
        const slug = rowData.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');

        // Check if product exists (by SKU) in vendor_products table
        const [existingProducts] = await pool.execute(
          `SELECT p.product_id FROM products p 
           JOIN vendor_products vp ON p.product_id = vp.product_id 
           WHERE p.sku = ? AND vp.vendor_id = ?`,
          [rowData.sku, vendorId]
        );

        let productId;

        if (Array.isArray(existingProducts) && existingProducts.length > 0) {
          // Update existing product
          productId = (existingProducts[0] as any).product_id;
          
          await pool.execute(
            `UPDATE products SET 
             name = ?, slug = ?, full_description = ?, short_description = ?,
             category_id = ?, base_price = ?, 
             finish = ?, tags = ?, room_types = ?, mount_types = ?, control_types = ?,
             light_filtering = ?, energy_efficiency = ?, child_safety_certified = ?,
             warranty_years = ?, custom_width_min = ?, custom_width_max = ?,
             custom_height_min = ?, custom_height_max = ?, notes = ?,
             is_active = ?, is_featured = ?, updated_at = NOW()
             WHERE product_id = ?`,
            [
              rowData.name, slug, rowData.description, rowData.short_description,
              categoryId, parseFloat(rowData.base_price) || 0,
              rowData.finish, rowData.tags, rowData.room_types, rowData.mount_types, rowData.control_types,
              rowData.light_filtering, rowData.energy_efficiency, 
              rowData.child_safety_certified?.toLowerCase() === 'true' ? 1 : 0,
              parseInt(rowData.warranty_years) || 1,
              parseFloat(rowData.custom_width_min) || null,
              parseFloat(rowData.custom_width_max) || null,
              parseFloat(rowData.custom_height_min) || null,
              parseFloat(rowData.custom_height_max) || null,
              rowData.notes,
              rowData.is_active?.toLowerCase() === 'true' ? 1 : 0,
              rowData.is_featured?.toLowerCase() === 'true' ? 1 : 0,
              productId
            ]
          );

          // Update vendor_products table
          await pool.execute(
            `UPDATE vendor_products SET 
             vendor_price = ?, cost_price = ?, quantity_available = ?, 
             low_stock_threshold = ?, allow_backorder = ?, updated_at = NOW()
             WHERE vendor_id = ? AND product_id = ?`,
            [
              parseFloat(rowData.base_price) || 0,
              rowData.cost_price ? parseFloat(rowData.cost_price) : null,
              parseInt(rowData.stock_quantity) || 0,
              parseInt(rowData.low_stock_threshold) || 0,
              rowData.allow_backorder?.toLowerCase() === 'true' ? 1 : 0,
              vendorId, productId
            ]
          );
        } else {
          // Create new product
          const [productResult] = await pool.execute<ResultSetHeader>(
            `INSERT INTO products 
             (name, slug, sku, full_description, short_description, category_id,
              base_price, finish, tags, room_types, mount_types, control_types,
              light_filtering, energy_efficiency, child_safety_certified, warranty_years,
              custom_width_min, custom_width_max, custom_height_min, custom_height_max,
              notes, is_active, is_featured, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              rowData.name, slug, rowData.sku, rowData.description, 
              rowData.short_description, categoryId,
              parseFloat(rowData.base_price) || 0,
              rowData.finish, rowData.tags, rowData.room_types, rowData.mount_types, rowData.control_types,
              rowData.light_filtering, rowData.energy_efficiency,
              rowData.child_safety_certified?.toLowerCase() === 'true' ? 1 : 0,
              parseInt(rowData.warranty_years) || 1,
              parseFloat(rowData.custom_width_min) || null,
              parseFloat(rowData.custom_width_max) || null,
              parseFloat(rowData.custom_height_min) || null,
              parseFloat(rowData.custom_height_max) || null,
              rowData.notes,
              rowData.is_active?.toLowerCase() === 'true' ? 1 : 0,
              rowData.is_featured?.toLowerCase() === 'true' ? 1 : 0
            ]
          );

          productId = productResult.insertId;

          // Create vendor_products relationship
          await pool.execute(
            `INSERT INTO vendor_products 
             (vendor_id, product_id, vendor_price, cost_price, quantity_available,
              low_stock_threshold, allow_backorder, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              vendorId, productId,
              parseFloat(rowData.base_price) || 0,
              rowData.cost_price ? parseFloat(rowData.cost_price) : null,
              parseInt(rowData.stock_quantity) || 0,
              parseInt(rowData.low_stock_threshold) || 0,
              rowData.allow_backorder?.toLowerCase() === 'true' ? 1 : 0,
              rowData.is_active?.toLowerCase() === 'true' ? 1 : 0
            ]
          );
        }

        successCount++;

        // Update progress
        await pool.execute(
          'UPDATE bulk_product_jobs SET processed_records = ?, success_count = ?, error_count = ? WHERE job_id = ?',
          [i + 1, successCount, errorCount, jobId]
        );

      } catch (error) {
        errorCount++;
        errors.push({
          row: rowNumber,
          field: 'general',
          message: `Processing error: ${error}`
        });
      }
    }

    // Complete job
    await pool.execute(
      `UPDATE bulk_product_jobs 
       SET status = ?, processed_records = ?, success_count = ?, error_count = ?, 
           errors = ?, completed_at = NOW() 
       WHERE job_id = ?`,
      [
        errorCount > 0 ? 'completed_with_errors' : 'completed',
        dataLines.length, successCount, errorCount,
        errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null, // Limit errors stored
        jobId
      ]
    );

  } catch (error) {
    // Mark job as failed
    await pool.execute(
      'UPDATE bulk_product_jobs SET status = ?, error_message = ?, completed_at = NOW() WHERE job_id = ?',
      ['failed', error instanceof Error ? error.message : 'Unknown error', jobId]
    );
  }
}

// Validation function
function validateProductRow(data: any, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name?.trim()) {
    errors.push({ row: rowNumber, field: 'name', message: 'Product name is required' });
  }
  if (!data.sku?.trim()) {
    errors.push({ row: rowNumber, field: 'sku', message: 'SKU is required' });
  }
  if (!data.category_name?.trim()) {
    errors.push({ row: rowNumber, field: 'category_name', message: 'Category name is required' });
  }
  if (!data.base_price || isNaN(parseFloat(data.base_price))) {
    errors.push({ row: rowNumber, field: 'base_price', message: 'Valid base price is required' });
  }

  // Price validations
  if (data.sale_price && isNaN(parseFloat(data.sale_price))) {
    errors.push({ row: rowNumber, field: 'sale_price', message: 'Sale price must be a valid number' });
  }
  if (data.cost_price && isNaN(parseFloat(data.cost_price))) {
    errors.push({ row: rowNumber, field: 'cost_price', message: 'Cost price must be a valid number' });
  }

  // Dimension validations
  if (data.weight && isNaN(parseFloat(data.weight))) {
    errors.push({ row: rowNumber, field: 'weight', message: 'Weight must be a valid number' });
  }
  if (data.width && isNaN(parseFloat(data.width))) {
    errors.push({ row: rowNumber, field: 'width', message: 'Width must be a valid number' });
  }
  if (data.height && isNaN(parseFloat(data.height))) {
    errors.push({ row: rowNumber, field: 'height', message: 'Height must be a valid number' });
  }

  // Boolean validations
  const booleanFields = ['is_active', 'is_featured', 'allow_backorder', 'child_safety_certified'];
  booleanFields.forEach(field => {
    if (data[field] && !['true', 'false', '1', '0'].includes(data[field].toLowerCase())) {
      errors.push({ row: rowNumber, field, message: `${field} must be true/false or 1/0` });
    }
  });

  return errors;
}