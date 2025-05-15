import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import bcrypt from 'bcrypt';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number validation regex for different countries
const PHONE_REGEX = {
  US: /^\+1[2-9]\d{9}$/, // +1XXXXXXXXXX (10 digits)
  UK: /^\+44[1-9]\d{9}$/, // +44XXXXXXXXXX (10 digits)
  INDIA: /^\+91[6-9]\d{9}$/, // +91XXXXXXXXXX (10 digits)
  CHINA: /^\+86[1][3-9]\d{9}$/, // +86XXXXXXXXXXX (11 digits)
};

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function isValidPhoneNumber(phone: string): boolean {
  // If phone is empty, consider it valid (as it's optional)
  if (!phone) return true;
  
  // Check if the phone number matches any of the country formats
  return Object.values(PHONE_REGEX).some(regex => regex.test(phone));
}

function getPhoneNumberError(phone: string): string {
  if (!phone) return '';
  
  const countryFormats = {
    US: '+1XXXXXXXXXX',
    UK: '+44XXXXXXXXXX',
    INDIA: '+91XXXXXXXXXX',
    CHINA: '+86XXXXXXXXXXX'
  };

  const allowedFormats = Object.entries(countryFormats)
    .map(([country, format]) => `${country}: ${format}`)
    .join(', ');

  return `Invalid phone number format. Allowed formats: ${allowedFormats}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    const pool = await getPool();
    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.is_admin,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          u.is_verified,
          CASE 
            WHEN vi.vendor_info_id IS NOT NULL THEN 'vendor'
            WHEN ss.sales_staff_id IS NOT NULL THEN 'sales'
            WHEN i.installer_id IS NOT NULL THEN 'installer'
            WHEN u.is_admin THEN 'admin'
            ELSE 'customer'
          END as role
        FROM blinds.users u
        LEFT JOIN blinds.vendor_info vi ON u.user_id = vi.user_id
        LEFT JOIN blinds.sales_staff ss ON u.user_id = ss.user_id
        LEFT JOIN blinds.installers i ON u.user_id = i.user_id
        WHERE 1=1
      `;

      const values: any[] = [];
      let valueIndex = 1;

      if (search) {
        query += ` AND (
          u.email ILIKE $${valueIndex} OR 
          u.first_name ILIKE $${valueIndex} OR 
          u.last_name ILIKE $${valueIndex} OR 
          u.phone ILIKE $${valueIndex}
        )`;
        values.push(`%${search}%`);
        valueIndex++;
      }

      if (role && role !== 'all') {
        if (role === 'admin') {
          query += ` AND u.is_admin = true`;
        } else if (role === 'vendor') {
          query += ` AND vi.vendor_info_id IS NOT NULL`;
        } else if (role === 'sales') {
          query += ` AND ss.sales_staff_id IS NOT NULL`;
        } else if (role === 'installer') {
          query += ` AND i.installer_id IS NOT NULL`;
        } else if (role === 'customer') {
          query += ` AND NOT u.is_admin 
            AND vi.vendor_info_id IS NULL 
            AND ss.sales_staff_id IS NULL 
            AND i.installer_id IS NULL`;
        }
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM (${query}) as count_query`,
        values
      );
      const total = parseInt(countResult.rows[0].count);

      // Add sorting and pagination
      query += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
      values.push(limit, offset);

      const result = await client.query(query, values);

      return NextResponse.json({
        users: result.rows,
        total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      isActive
    } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone number if provided
    if (phone && !isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: getPhoneNumberError(phone) },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT user_id FROM blinds.users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const result = await client.query(
        `INSERT INTO blinds.users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          is_admin,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING user_id`,
        [
          email,
          hashedPassword,
          firstName || null,
          lastName || null,
          phone || null,
          role === 'admin',
          isActive
        ]
      );

      const userId = result.rows[0].user_id;

      // Add role-specific entry
      if (role === 'vendor') {
        await client.query(
          `INSERT INTO blinds.vendor_info (
            user_id, business_name, business_email, created_at, updated_at
          ) VALUES ($1, $2, $3, NOW(), NOW())`,
          [userId, `${firstName || ''} ${lastName || ''}'s Business`.trim(), email]
        );
      } else if (role === 'sales') {
        await client.query(
          `INSERT INTO blinds.sales_staff (
            user_id, hire_date, created_at, updated_at
          ) VALUES ($1, NOW(), NOW(), NOW())`,
          [userId]
        );
      } else if (role === 'installer') {
        await client.query(
          `INSERT INTO blinds.installers (
            user_id, created_at, updated_at
          ) VALUES ($1, NOW(), NOW())`,
          [userId]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true,
        user_id: userId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 