import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

// GET - Get company profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get company profile from database
      const [rows] = await connection.execute(
        'SELECT profile_data FROM company_profile WHERE id = 1'
      );

      let profile = null;
      if (Array.isArray(rows) && rows.length > 0) {
        const data = (rows[0] as any).profile_data;
        profile = typeof data === 'string' ? JSON.parse(data) : data;
      }

      return NextResponse.json({
        success: true,
        profile
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get company profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get company profile' },
      { status: 500 }
    );
  }
}

// POST - Update company profile
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await request.json();

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Create table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS company_profile (
          id INT PRIMARY KEY DEFAULT 1,
          profile_data JSON NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_by INT,
          FOREIGN KEY (updated_by) REFERENCES users(user_id)
        )
      `);

      // Insert or update company profile
      await connection.execute(
        `INSERT INTO company_profile (id, profile_data, updated_by) 
         VALUES (1, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         profile_data = VALUES(profile_data), 
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(profileData), user.userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Company profile updated successfully'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Update company profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update company profile' },
      { status: 500 }
    );
  }
}