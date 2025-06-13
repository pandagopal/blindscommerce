import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// Default company info if none is set in database
const DEFAULT_COMPANY_INFO = {
  companyName: 'Smart Blinds Hub',
  emergencyHotline: '1-800-BLINDS',
  customerService: '1-800-555-0123',
  salesPhone: '1-800-555-0124',
  techSupport: '1-800-555-0125',
  mainEmail: 'info@smartblindshub.com',
  salesEmail: 'sales@smartblindshub.com',
  supportEmail: 'support@smartblindshub.com',
  website: 'https://smartblindshub.com',
  tagline: 'Transform Your Space with Smart Window Solutions',
  businessHours: {
    weekdays: '9:00 AM - 6:00 PM EST',
    saturday: '10:00 AM - 4:00 PM EST',
    sunday: 'Closed'
  }
};

// GET - Get public company information
export async function GET(request: NextRequest) {
  try {
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get company info from existing settings table
      const [rows] = await connection.execute(`
        SELECT config_key, config_value, config_type 
        FROM upload_security_config 
        WHERE config_key LIKE "general_%" AND is_active = TRUE
      `).catch(() => [[]]);

      let companyInfo = { ...DEFAULT_COMPANY_INFO };

      if (Array.isArray(rows) && rows.length > 0) {
        // Convert flat settings to company info structure
        rows.forEach((row: any) => {
          const { config_key, config_value, config_type } = row;
          const key = config_key.replace('general_', '');
          
          let parsedValue;
          switch (config_type) {
            case 'boolean':
              parsedValue = config_value === 'true';
              break;
            case 'integer':
              parsedValue = parseInt(config_value);
              break;
            case 'json':
              try {
                parsedValue = JSON.parse(config_value);
              } catch {
                parsedValue = config_value;
              }
              break;
            default:
              parsedValue = config_value;
          }
          
          // Only override defaults with non-null, non-empty values
          if (parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
            // Map database keys to company info structure
            switch (key) {
              case 'site_name':
                companyInfo.companyName = parsedValue;
                break;
              case 'phone':
                companyInfo.emergencyHotline = parsedValue;
                break;
              case 'contact_email':
                companyInfo.mainEmail = parsedValue;
                break;
              case 'site_description':
                companyInfo.tagline = parsedValue;
                break;
              default:
                // Keep any other fields that might match
                if (companyInfo.hasOwnProperty(key)) {
                  companyInfo[key as keyof typeof companyInfo] = parsedValue;
                }
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        companyInfo
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get company info error:', error);
    // Return default info if database fails
    return NextResponse.json({
      success: true,
      companyInfo: DEFAULT_COMPANY_INFO
    });
  }
}