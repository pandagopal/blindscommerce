import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface TaxRate {
  tax_rate_id: number;
  zip_code: string;
  city: string;
  county: string;
  state_code: string;
  state_name: string;
  state_tax_rate: number;
  county_tax_rate: number;
  city_tax_rate: number;
  special_district_tax_rate: number;
  total_tax_rate: number;
  tax_jurisdiction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/tax-rates - List tax rates with pagination and search
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';

    const pool = await getPool();
    
    // Build WHERE clause and parameters for search
    let whereClause = 'WHERE is_active = TRUE';
    let params = [];
    
    if (search) {
      whereClause += ' AND (zip_code LIKE ? OR city LIKE ? OR state_name LIKE ? OR state_code LIKE ?)';
      const searchPattern = `%${search}%`;
      params = [searchPattern, searchPattern, searchPattern, searchPattern];
    }
    
    // Get total count
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM tax_rates ${whereClause}`,
      params
    );
    const total = countRows[0].total;
    
    // Get paginated results - use string interpolation for LIMIT/OFFSET (safe with validated integers)
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM tax_rates ${whereClause} 
       ORDER BY state_code, city, zip_code 
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    
    return NextResponse.json({
      taxRates: rows as TaxRate[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/tax-rates - Delete tax rates (bulk or single)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxRateIds } = await request.json();
    
    if (!taxRateIds || !Array.isArray(taxRateIds) || taxRateIds.length === 0) {
      return NextResponse.json({ error: 'Tax rate IDs are required' }, { status: 400 });
    }

    const pool = await getPool();
    
    // Soft delete by setting is_active to FALSE
    const placeholders = taxRateIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE tax_rates SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE tax_rate_id IN (${placeholders})`,
      taxRateIds
    );
    
    return NextResponse.json({
      success: true,
      message: `${taxRateIds.length} tax rate(s) deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting tax rates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/tax-rates - Create or update a single tax rate
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxRate = await request.json();
    
    // Validate required fields
    const requiredFields = ['zip_code', 'state_code', 'total_tax_rate'];
    const missingFields = requiredFields.filter(field => !taxRate[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate data types
    if (isNaN(parseFloat(taxRate.total_tax_rate)) || parseFloat(taxRate.total_tax_rate) < 0) {
      return NextResponse.json({ error: 'Invalid total tax rate' }, { status: 400 });
    }

    const pool = await getPool();
    
    // Check if tax rate already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT tax_rate_id FROM tax_rates WHERE zip_code = ? AND state_code = ?',
      [taxRate.zip_code, taxRate.state_code]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(`
        UPDATE tax_rates SET
          city = ?, county = ?, state_name = ?,
          state_tax_rate = ?, county_tax_rate = ?, city_tax_rate = ?,
          special_district_tax_rate = ?, total_tax_rate = ?, tax_jurisdiction = ?,
          is_active = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE zip_code = ? AND state_code = ?
      `, [
        taxRate.city || '',
        taxRate.county || '',
        taxRate.state_name || '',
        parseFloat(taxRate.state_tax_rate || 0),
        parseFloat(taxRate.county_tax_rate || 0),
        parseFloat(taxRate.city_tax_rate || 0),
        parseFloat(taxRate.special_district_tax_rate || 0),
        parseFloat(taxRate.total_tax_rate),
        taxRate.tax_jurisdiction || '',
        taxRate.zip_code,
        taxRate.state_code
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Tax rate updated successfully'
      });
    } else {
      // Insert new
      await pool.execute(`
        INSERT INTO tax_rates 
        (zip_code, city, county, state_code, state_name, state_tax_rate, 
         county_tax_rate, city_tax_rate, special_district_tax_rate, 
         total_tax_rate, tax_jurisdiction, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [
        taxRate.zip_code,
        taxRate.city || '',
        taxRate.county || '',
        taxRate.state_code,
        taxRate.state_name || '',
        parseFloat(taxRate.state_tax_rate || 0),
        parseFloat(taxRate.county_tax_rate || 0),
        parseFloat(taxRate.city_tax_rate || 0),
        parseFloat(taxRate.special_district_tax_rate || 0),
        parseFloat(taxRate.total_tax_rate),
        taxRate.tax_jurisdiction || ''
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Tax rate created successfully'
      });
    }
    
  } catch (error) {
    console.error('Error creating/updating tax rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}