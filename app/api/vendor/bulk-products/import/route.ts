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

        // Check if product exists (by SKU)
        const [existingProducts] = await pool.execute(
          'SELECT product_id FROM products WHERE sku = ? AND vendor_id = ?',
          [rowData.sku, vendorId]
        );

        if (Array.isArray(existingProducts) && existingProducts.length > 0) {
          // Update existing product
          const productId = (existingProducts[0] as any).product_id;
          
          await pool.execute(
            `UPDATE products SET 
             name = ?, slug = ?, description = ?, short_description = ?,
             category_id = ?, base_price = ?, sale_price = ?,
             weight = ?, width = ?, height = ?, depth = ?, material = ?, color = ?,
             is_active = ?, is_featured = ?, meta_title = ?, meta_description = ?,
             updated_at = NOW()
             WHERE product_id = ?`,
            [
              rowData.name, slug, rowData.description, rowData.short_description,
              categoryId, parseFloat(rowData.base_price) || 0,
              rowData.sale_price ? parseFloat(rowData.sale_price) : null,
              parseFloat(rowData.weight) || 0, parseFloat(rowData.width) || 0,
              parseFloat(rowData.height) || 0, parseFloat(rowData.depth) || 0,
              rowData.material, rowData.color,
              rowData.is_active?.toLowerCase() === 'true' ? 1 : 0,
              rowData.is_featured?.toLowerCase() === 'true' ? 1 : 0,
              rowData.meta_title, rowData.meta_description,
              productId
            ]
          );
        } else {
          // Create new product
          await pool.execute(
            `INSERT INTO products 
             (vendor_id, name, slug, sku, description, short_description, category_id,
              base_price, sale_price, weight, width, height, depth, material, color,
              is_active, is_featured, meta_title, meta_description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              vendorId, rowData.name, slug, rowData.sku, rowData.description, 
              rowData.short_description, categoryId,
              parseFloat(rowData.base_price) || 0,
              rowData.sale_price ? parseFloat(rowData.sale_price) : null,
              parseFloat(rowData.weight) || 0, parseFloat(rowData.width) || 0,
              parseFloat(rowData.height) || 0, parseFloat(rowData.depth) || 0,
              rowData.material, rowData.color,
              rowData.is_active?.toLowerCase() === 'true' ? 1 : 0,
              rowData.is_featured?.toLowerCase() === 'true' ? 1 : 0,
              rowData.meta_title, rowData.meta_description
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