import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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
    const pool = await getPool();

    try {
      // Get company info from new company_settings table
      const [rows] = await pool.execute(`
        SELECT setting_key, setting_value, setting_type 
        FROM company_settings 
        WHERE is_public = TRUE
      `).catch(() => [[]]);

      let companyInfo = { ...DEFAULT_COMPANY_INFO };

      if (Array.isArray(rows) && rows.length > 0) {
        // Convert flat settings to company info structure
        rows.forEach((row: any) => {
          const { setting_key, setting_value, setting_type } = row;
          
          let parsedValue;
          switch (setting_type) {
            case 'boolean':
              parsedValue = setting_value === 'true';
              break;
            case 'number':
              parsedValue = parseFloat(setting_value);
              break;
            case 'json':
              try {
                parsedValue = JSON.parse(setting_value);
              } catch {
                parsedValue = setting_value;
              }
              break;
            default:
              parsedValue = setting_value;
          }
          
          // Only override defaults with non-null, non-empty values
          if (parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
            // Map database keys to company info structure
            switch (setting_key) {
              case 'company_name':
                companyInfo.companyName = parsedValue;
                break;
              case 'emergency_hotline':
                companyInfo.emergencyHotline = parsedValue;
                break;
              case 'contact_phone':
                companyInfo.customerService = parsedValue;
                break;
              case 'contact_email':
                companyInfo.supportEmail = parsedValue;
                break;
              case 'sales_email':
                companyInfo.salesEmail = parsedValue;
                break;
              case 'info_email':
                companyInfo.mainEmail = parsedValue;
                break;
              case 'website_url':
                companyInfo.website = parsedValue;
                break;
              case 'business_hours':
                companyInfo.businessHours = parsedValue;
                break;
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        companyInfo
      });

    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return default info if database query fails
      return NextResponse.json({
        success: true,
        companyInfo: DEFAULT_COMPANY_INFO
      });
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