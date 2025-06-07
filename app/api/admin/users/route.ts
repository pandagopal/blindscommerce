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
    const client = await pool.getConnection();

    try {
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.role,
          u.is_active,
          u.is_verified,
          u.created_at,
          u.last_login,
          v.business_name,
          v.business_email,
          v.business_phone,
          v.approval_status as vendor_status,
          v.is_verified as vendor_verified,
          v.is_active as vendor_active,
          s.territory as sales_territory,
          s.commission_rate,
          s.is_active as sales_active,
          i.certification_number,
          i.service_area,
          i.is_active as installer_active
        FROM users u
        LEFT JOIN vendor_info v ON u.user_id = v.user_id
        LEFT JOIN sales_staff s ON u.user_id = s.user_id
        LEFT JOIN installers i ON u.user_id = i.user_id
        WHERE 1=1
      `;

      const values: any[] = [];

      if (search) {
        query += ` AND (
          u.email LIKE ? OR 
          u.first_name LIKE ? OR 
          u.last_name LIKE ? OR 
          u.phone LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        values.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (role && role !== 'all') {
        if (role === 'admin') {
          query += ` AND u.role = 'admin'`;
        } else if (role === 'vendor') {
          query += ` AND v.business_name IS NOT NULL`;
        } else if (role === 'sales') {
          query += ` AND s.territory IS NOT NULL`;
        } else if (role === 'installer') {
          query += ` AND i.certification_number IS NOT NULL`;
        } else if (role === 'customer') {
          query += ` AND u.role NOT IN ('admin', 'vendor', 'sales', 'installer')`;
        }
      }

      // Add sorting
      const validSortFields = ['email', 'first_name', 'last_name', 'created_at', 'last_login'];
      const validSortOrders = ['asc', 'desc'];

      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

      query += ` ORDER BY u.${finalSortBy} ${finalSortOrder}`;

      // Add pagination
      query += ` LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      console.log('Query:', query);
      console.log('Values:', values);

      const [result] = await client.query(query, values);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM users u
        WHERE 1=1
        ${search ? `AND (
          u.email LIKE ? OR
          u.first_name LIKE ? OR
          u.last_name LIKE ? OR
          u.phone LIKE ?
        )` : ''}
      `;

      const [countResult] = await client.query(
        countQuery,
        search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []
      );

      return NextResponse.json({
        users: result,
        total: parseInt((countResult as any[])[0].count)
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
    const client = await pool.getConnection();

    try {
      await client.beginTransaction();

      // Check if email already exists
      const [existingUser] = await client.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if ((existingUser as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const userQuery = `
        INSERT INTO users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          role,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [userResult] = await client.execute(userQuery, [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        isActive ? 1 : 0 // Convert boolean to 0/1
      ]);

      const userId = (userResult as any).insertId;

      // Add role-specific entry
      if (role === 'vendor') {
        await client.execute(
          `INSERT INTO vendor_info (
            user_id,
            business_name,
            business_email,
            business_phone,
            is_active,
            is_verified,
            approval_status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            `${firstName || ''} ${lastName || ''}'s Business`.trim(),
            email,
            phone,
            isActive ? 1 : 0, // Convert boolean to 0/1
            0, // Convert boolean to 0/1
            'pending'
          ]
        );
      } else if (role === 'sales') {
        await client.execute(
          `INSERT INTO sales_staff (
            user_id, hire_date, created_at, updated_at
          ) VALUES (?, NOW(), NOW(), NOW())`,
          [userId]
        );
      } else if (role === 'installer') {
        await client.execute(
          `INSERT INTO installers (
            user_id, created_at, updated_at
          ) VALUES (?, NOW(), NOW())`,
          [userId]
        );
      }

      // Create user preferences
      const preferencesQuery = `
        INSERT INTO user_preferences (
          user_id,
          created_at,
          updated_at
        ) VALUES (?, NOW(), NOW())
      `;

      await client.execute(preferencesQuery, [userId]);

      // Create user notifications
      const notificationsQuery = `
        INSERT INTO user_notifications (
          user_id,
          created_at,
          updated_at
        ) VALUES (?, NOW(), NOW())
      `;

      await client.execute(notificationsQuery, [userId]);

      // Create user wishlist
      const wishlistQuery = `
        INSERT INTO wishlist (
          user_id,
          created_at
        ) VALUES (?, NOW())
      `;

      await client.execute(wishlistQuery, [userId]);

      await client.commit();

      return NextResponse.json({ 
        success: true,
        user_id: userId
      });
    } catch (error) {
      await client.rollback();
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