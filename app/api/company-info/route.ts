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
      // Check if table exists and get company profile
      const [rows] = await connection.execute(`
        SELECT profile_data 
        FROM company_profile 
        WHERE id = 1
      `).catch(() => [[]]);

      let companyInfo = DEFAULT_COMPANY_INFO;

      if (Array.isArray(rows) && rows.length > 0) {
        const data = (rows[0] as any).profile_data;
        const profileData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Merge with defaults to ensure all fields are present
        companyInfo = { ...DEFAULT_COMPANY_INFO, ...profileData };
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