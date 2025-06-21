import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface CsvTaxRate {
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
}

interface UploadResult {
  success: boolean;
  processed: number;
  imported: number;
  updated: number;
  errors: string[];
  preview?: CsvTaxRate[];
}

// POST /api/admin/tax-rates/upload - Upload CSV file with tax rates
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const previewOnly = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Read and parse CSV content
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must contain at least a header and one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    // Validate required headers
    const requiredHeaders = [
      'zip_code', 'city', 'county', 'state_code', 'state_name',
      'state_tax_rate', 'county_tax_rate', 'city_tax_rate', 
      'special_district_tax_rate', 'total_tax_rate', 'tax_jurisdiction'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
        expected_headers: requiredHeaders,
        found_headers: headers
      }, { status: 400 });
    }

    // Parse CSV data
    const taxRates: CsvTaxRate[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const lineNum = i + 2; // +2 because we start from line 1 and skip header
      const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        errors.push(`Line ${lineNum}: Expected ${headers.length} columns, found ${values.length}`);
        continue;
      }

      try {
        const taxRate: CsvTaxRate = {
          zip_code: values[headers.indexOf('zip_code')],
          city: values[headers.indexOf('city')],
          county: values[headers.indexOf('county')],
          state_code: values[headers.indexOf('state_code')],
          state_name: values[headers.indexOf('state_name')],
          state_tax_rate: parseFloat(values[headers.indexOf('state_tax_rate')]),
          county_tax_rate: parseFloat(values[headers.indexOf('county_tax_rate')]),
          city_tax_rate: parseFloat(values[headers.indexOf('city_tax_rate')]),
          special_district_tax_rate: parseFloat(values[headers.indexOf('special_district_tax_rate')]),
          total_tax_rate: parseFloat(values[headers.indexOf('total_tax_rate')]),
          tax_jurisdiction: values[headers.indexOf('tax_jurisdiction')]
        };

        // Validate data
        if (!taxRate.zip_code || taxRate.zip_code.length < 5) {
          errors.push(`Line ${lineNum}: Invalid ZIP code`);
          continue;
        }

        if (!taxRate.state_code || taxRate.state_code.length !== 2) {
          errors.push(`Line ${lineNum}: Invalid state code`);
          continue;
        }

        if (isNaN(taxRate.total_tax_rate) || taxRate.total_tax_rate < 0 || taxRate.total_tax_rate > 50) {
          errors.push(`Line ${lineNum}: Invalid total tax rate`);
          continue;
        }

        taxRates.push(taxRate);
      } catch (error) {
        errors.push(`Line ${lineNum}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    // If preview only, return first 10 rows
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        processed: dataLines.length,
        preview: taxRates.slice(0, 10),
        errors: errors.slice(0, 10), // Show first 10 errors
        total_errors: errors.length
      });
    }

    // Import to database
    if (taxRates.length === 0) {
      return NextResponse.json({ 
        error: 'No valid tax rates found in CSV',
        errors 
      }, { status: 400 });
    }

    const pool = await getPool();
    let imported = 0;
    let updated = 0;

    try {
      await pool.execute('START TRANSACTION');

      for (const taxRate of taxRates) {
        // Check if ZIP code already exists
        const [existing] = await pool.execute<RowDataPacket[]>(
          'SELECT tax_rate_id FROM tax_rates WHERE zip_code = ? AND state_code = ?',
          [taxRate.zip_code, taxRate.state_code]
        );

        if (existing.length > 0) {
          // Update existing record
          await pool.execute(`
            UPDATE tax_rates SET
              city = ?, county = ?, state_name = ?,
              state_tax_rate = ?, county_tax_rate = ?, city_tax_rate = ?,
              special_district_tax_rate = ?, total_tax_rate = ?, tax_jurisdiction = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE zip_code = ? AND state_code = ?
          `, [
            taxRate.city, taxRate.county, taxRate.state_name,
            taxRate.state_tax_rate, taxRate.county_tax_rate, taxRate.city_tax_rate,
            taxRate.special_district_tax_rate, taxRate.total_tax_rate, taxRate.tax_jurisdiction,
            taxRate.zip_code, taxRate.state_code
          ]);
          updated++;
        } else {
          // Insert new record
          await pool.execute(`
            INSERT INTO tax_rates 
            (zip_code, city, county, state_code, state_name, state_tax_rate, 
             county_tax_rate, city_tax_rate, special_district_tax_rate, 
             total_tax_rate, tax_jurisdiction, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
          `, [
            taxRate.zip_code, taxRate.city, taxRate.county, taxRate.state_code, taxRate.state_name,
            taxRate.state_tax_rate, taxRate.county_tax_rate, taxRate.city_tax_rate,
            taxRate.special_district_tax_rate, taxRate.total_tax_rate, taxRate.tax_jurisdiction
          ]);
          imported++;
        }
      }

      await pool.execute('COMMIT');

      // Log the upload activity
      await pool.execute(`
        INSERT INTO upload_security_config 
        (config_key, config_value, config_type, updated_by, description)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `tax_upload_${Date.now()}`,
        JSON.stringify({
          filename: file.name,
          processed: dataLines.length,
          imported,
          updated,
          errors: errors.length,
          timestamp: new Date().toISOString()
        }),
        'json',
        user.userId,
        `Tax rates CSV upload: ${file.name}`
      ]);

      const result: UploadResult = {
        success: true,
        processed: dataLines.length,
        imported,
        updated,
        errors
      };

      return NextResponse.json(result);

    } catch (dbError) {
      await pool.execute('ROLLBACK');
      console.error('Database error during tax rates upload:', dbError);
      return NextResponse.json({ 
        error: 'Database error during import', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error uploading tax rates:', error);
    return NextResponse.json({ 
      error: 'Failed to upload tax rates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/admin/tax-rates/upload/template - Download CSV template
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csvTemplate = `zip_code,city,county,state_code,state_name,state_tax_rate,county_tax_rate,city_tax_rate,special_district_tax_rate,total_tax_rate,tax_jurisdiction
78701,Austin,Travis County,TX,Texas,6.2500,2.0000,0.0000,0.0000,8.2500,Austin
10001,New York,New York County,NY,New York,4.0000,4.2500,0.0000,0.0000,8.2500,New York City
90210,Beverly Hills,Los Angeles County,CA,California,7.2500,2.2500,0.0000,0.0000,9.5000,Los Angeles County`;

    return new Response(csvTemplate, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tax_rates_template.csv"'
      }
    });

  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}