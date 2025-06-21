import { getPool } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { calculateTaxWithTaxJar } from './taxjarIntegration';

export interface TaxRate {
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
  effective_date?: string;
  is_active?: boolean;
}

export interface TaxCalculation {
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  tax_breakdown: {
    state_tax: number;
    county_tax: number;
    city_tax: number;
    special_district_tax: number;
  };
  tax_jurisdiction: string;
  zip_code: string;
}

/**
 * Get tax rate by ZIP code with fallback logic
 */
export async function getTaxRateByZip(zipCode: string): Promise<TaxRate> {
  try {
    const pool = await getPool();
    
    // Clean the ZIP code (remove any non-numeric characters except hyphens)
    const cleanZip = zipCode.replace(/[^\d-]/g, '').substring(0, 10);
    
    // Try exact ZIP code match first
    let [rows] = await pool.execute<any[]>(
      'SELECT * FROM tax_rates WHERE zip_code = ? AND is_active = TRUE LIMIT 1',
      [cleanZip]
    );
    
    if (rows.length > 0) {
      return rows[0] as TaxRate;
    }
    
    // Try 5-digit ZIP if 9-digit ZIP+4 was provided
    if (cleanZip.length > 5) {
      const shortZip = cleanZip.substring(0, 5);
      [rows] = await pool.execute<any[]>(
        'SELECT * FROM tax_rates WHERE zip_code = ? AND is_active = TRUE LIMIT 1',
        [shortZip]
      );
      
      if (rows.length > 0) {
        return rows[0] as TaxRate;
      }
    }
    
    // Try to determine state from ZIP code ranges
    const stateCode = getStateFromZip(cleanZip);
    if (stateCode) {
      [rows] = await pool.execute<any[]>(
        'SELECT * FROM tax_rates WHERE state_code = ? AND zip_code = "00000" AND is_active = TRUE LIMIT 1',
        [stateCode]
      );
      
      if (rows.length > 0) {
        return rows[0] as TaxRate;
      }
    }
    
    // Fallback to US average
    [rows] = await pool.execute<any[]>(
      'SELECT * FROM tax_rates WHERE zip_code = "99999" AND is_active = TRUE LIMIT 1'
    );
    
    if (rows.length > 0) {
      return rows[0] as TaxRate;
    }
    
    // Ultimate fallback - return a default rate
    return {
      tax_rate_id: 0,
      zip_code: zipCode,
      city: 'Unknown',
      county: 'Unknown',
      state_code: 'US',
      state_name: 'United States',
      state_tax_rate: 6.0,
      county_tax_rate: 2.0,
      city_tax_rate: 0.0,
      special_district_tax_rate: 0.0,
      total_tax_rate: 8.0,
      tax_jurisdiction: 'Default US Rate'
    };
    
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    
    // Return default rate on error
    return {
      tax_rate_id: 0,
      zip_code: zipCode,
      city: 'Unknown',
      county: 'Unknown', 
      state_code: 'US',
      state_name: 'United States',
      state_tax_rate: 6.0,
      county_tax_rate: 2.0,
      city_tax_rate: 0.0,
      special_district_tax_rate: 0.0,
      total_tax_rate: 8.0,
      tax_jurisdiction: 'Default US Rate'
    };
  }
}

/**
 * Calculate tax for a given subtotal and ZIP code
 */
export async function calculateTax(subtotal: number, zipCode: string): Promise<TaxCalculation> {
  // Check if TaxJar API is enabled and try it first
  const useTaxJar = await getSetting('integrations', 'use_taxjar_api');
  
  if (useTaxJar) {
    const taxJarResult = await calculateTaxWithTaxJar(subtotal, 0, zipCode);
    if (taxJarResult) {
      return taxJarResult;
    }
    console.warn('TaxJar calculation failed, falling back to local rates');
  }

  // Fallback to local tax rates
  const taxRate = await getTaxRateByZip(zipCode);
  
  // Convert percentage rates to decimals
  const stateRate = taxRate.state_tax_rate / 100;
  const countyRate = taxRate.county_tax_rate / 100;
  const cityRate = taxRate.city_tax_rate / 100;
  const specialRate = taxRate.special_district_tax_rate / 100;
  const totalRate = taxRate.total_tax_rate / 100;
  
  // Calculate individual tax components
  const stateTax = subtotal * stateRate;
  const countyTax = subtotal * countyRate;
  const cityTax = subtotal * cityRate;
  const specialDistrictTax = subtotal * specialRate;
  
  // Total tax amount
  const taxAmount = subtotal * totalRate;
  
  return {
    subtotal,
    tax_rate: taxRate.total_tax_rate,
    tax_amount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
    total_amount: Math.round((subtotal + taxAmount) * 100) / 100,
    tax_breakdown: {
      state_tax: Math.round(stateTax * 100) / 100,
      county_tax: Math.round(countyTax * 100) / 100,
      city_tax: Math.round(cityTax * 100) / 100,
      special_district_tax: Math.round(specialDistrictTax * 100) / 100
    },
    tax_jurisdiction: taxRate.tax_jurisdiction,
    zip_code: taxRate.zip_code
  };
}

/**
 * Determine state code from ZIP code ranges
 * This is a simplified version - in production you'd want a more comprehensive lookup
 */
function getStateFromZip(zipCode: string): string | null {
  if (!zipCode || zipCode.length < 5) return null;
  
  const zip = parseInt(zipCode.substring(0, 5));
  
  // Major ZIP code ranges by state
  if (zip >= 10001 && zip <= 14999) return 'NY'; // New York
  if (zip >= 90001 && zip <= 96999) return 'CA'; // California  
  if (zip >= 75001 && zip <= 79999) return 'TX'; // Texas
  if (zip >= 60001 && zip <= 62999) return 'IL'; // Illinois
  if (zip >= 33001 && zip <= 34999) return 'FL'; // Florida
  if (zip >= 98001 && zip <= 99499) return 'WA'; // Washington
  if (zip >= 97001 && zip <= 97999) return 'OR'; // Oregon
  if (zip >= 19701 && zip <= 19999) return 'DE'; // Delaware
  
  // Add more state ranges as needed
  return null;
}

/**
 * Get all tax rates for admin management
 */
export async function getAllTaxRates(
  limit: number = 100, 
  offset: number = 0,
  searchTerm?: string
): Promise<{ taxRates: TaxRate[], total: number }> {
  try {
    const pool = await getPool();
    
    let whereClause = 'WHERE is_active = TRUE';
    let params: any[] = [];
    
    if (searchTerm) {
      whereClause += ' AND (zip_code LIKE ? OR city LIKE ? OR state_name LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Get total count
    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM tax_rates ${whereClause}`,
      params
    );
    const total = countRows[0].total;
    
    // Get paginated results
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM tax_rates ${whereClause} ORDER BY state_code, city, zip_code LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    return {
      taxRates: rows as TaxRate[],
      total
    };
    
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    return { taxRates: [], total: 0 };
  }
}

/**
 * Add or update tax rate
 */
export async function upsertTaxRate(taxRate: Omit<TaxRate, 'tax_rate_id' | 'created_at' | 'updated_at'>): Promise<boolean> {
  try {
    const pool = await getPool();
    
    await pool.execute(
      `INSERT INTO tax_rates 
       (zip_code, city, county, state_code, state_name, state_tax_rate, county_tax_rate, 
        city_tax_rate, special_district_tax_rate, total_tax_rate, tax_jurisdiction, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
       city = VALUES(city),
       county = VALUES(county),
       state_name = VALUES(state_name),
       state_tax_rate = VALUES(state_tax_rate),
       county_tax_rate = VALUES(county_tax_rate),
       city_tax_rate = VALUES(city_tax_rate),
       special_district_tax_rate = VALUES(special_district_tax_rate),
       total_tax_rate = VALUES(total_tax_rate),
       tax_jurisdiction = VALUES(tax_jurisdiction),
       updated_at = CURRENT_TIMESTAMP`,
      [
        taxRate.zip_code,
        taxRate.city,
        taxRate.county,
        taxRate.state_code,
        taxRate.state_name,
        taxRate.state_tax_rate,
        taxRate.county_tax_rate,
        taxRate.city_tax_rate,
        taxRate.special_district_tax_rate,
        taxRate.total_tax_rate,
        taxRate.tax_jurisdiction
      ]
    );
    
    return true;
  } catch (error) {
    console.error('Error upserting tax rate:', error);
    return false;
  }
}