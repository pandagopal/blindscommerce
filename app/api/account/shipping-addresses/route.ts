import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShippingAddressRow extends RowDataPacket {
  address_id: number;
  user_id: number;
  address_name: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  is_billing_address: boolean;
  delivery_instructions?: string;
  delivery_preference: string;
  access_code?: string;
  is_verified: boolean;
  verification_source?: string;
  last_verified_at?: Date;
  last_used_at?: Date;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateAddressRequest {
  address_name: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
  is_billing_address?: boolean;
  delivery_instructions?: string;
  delivery_preference?: 'standard' | 'signature_required' | 'leave_at_door' | 'front_desk';
  access_code?: string;
}

// GET /api/account/shipping-addresses - Get all shipping addresses for user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();
    const [addresses] = await pool.execute<ShippingAddressRow[]>(
      `SELECT 
        address_id, user_id, address_name, first_name, last_name, company,
        address_line_1, address_line_2, city, state_province, postal_code, country,
        phone, email, is_default, is_billing_address, delivery_instructions,
        delivery_preference, access_code, is_verified, verification_source,
        last_verified_at, last_used_at, usage_count, is_active, created_at, updated_at
       FROM user_shipping_addresses 
       WHERE user_id = ? AND is_active = TRUE 
       ORDER BY is_default DESC, last_used_at DESC, created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({
      success: true,
      addresses: addresses.map(address => ({
        id: address.address_id,
        addressName: address.address_name,
        firstName: address.first_name,
        lastName: address.last_name,
        company: address.company,
        addressLine1: address.address_line_1,
        addressLine2: address.address_line_2,
        city: address.city,
        stateProvince: address.state_province,
        postalCode: address.postal_code,
        country: address.country,
        phone: address.phone,
        email: address.email,
        isDefault: address.is_default,
        isBillingAddress: address.is_billing_address,
        deliveryInstructions: address.delivery_instructions,
        deliveryPreference: address.delivery_preference,
        accessCode: address.access_code,
        isVerified: address.is_verified,
        verificationSource: address.verification_source,
        lastVerifiedAt: address.last_verified_at,
        lastUsedAt: address.last_used_at,
        usageCount: address.usage_count,
        createdAt: address.created_at,
        updatedAt: address.updated_at
      }))
    });

  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping addresses' },
      { status: 500 }
    );
  }
}

// POST /api/account/shipping-addresses - Create new shipping address
export async function POST(req: NextRequest) {
  let connection;
  
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateAddressRequest = await req.json();

    // Validate required fields
    if (!body.address_name || !body.first_name || !body.last_name || 
        !body.address_line_1 || !body.city || !body.state_province || 
        !body.postal_code || !body.country) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    // Validate address name uniqueness for user
    const pool = await getPool();
    connection = await pool.getConnection();

    const [existingAddress] = await connection.execute<RowDataPacket[]>(
      'SELECT address_id FROM user_shipping_addresses WHERE user_id = ? AND address_name = ? AND is_active = TRUE',
      [user.userId, body.address_name]
    );

    if (existingAddress.length > 0) {
      return NextResponse.json(
        { error: 'An address with this name already exists' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    try {
      // If this is being set as default, unset other defaults
      if (body.is_default) {
        await connection.execute(
          'UPDATE user_shipping_addresses SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE',
          [user.userId]
        );
      }

      // If user has no addresses yet, make this the default
      const [addressCount] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM user_shipping_addresses WHERE user_id = ? AND is_active = TRUE',
        [user.userId]
      );

      const isFirstAddress = (addressCount[0] as any).count === 0;

      // Create the address
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO user_shipping_addresses (
          user_id, address_name, first_name, last_name, company,
          address_line_1, address_line_2, city, state_province, postal_code, country,
          phone, email, is_default, is_billing_address, delivery_instructions,
          delivery_preference, access_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.userId,
          body.address_name,
          body.first_name,
          body.last_name,
          body.company || null,
          body.address_line_1,
          body.address_line_2 || null,
          body.city,
          body.state_province,
          body.postal_code,
          body.country,
          body.phone || null,
          body.email || null,
          body.is_default || isFirstAddress,
          body.is_billing_address || false,
          body.delivery_instructions || null,
          body.delivery_preference || 'standard',
          body.access_code || null
        ]
      );

      await connection.commit();

      // Fetch the created address
      const [newAddress] = await connection.execute<ShippingAddressRow[]>(
        'SELECT * FROM user_shipping_addresses WHERE address_id = ?',
        [result.insertId]
      );

      const address = newAddress[0];
      return NextResponse.json({
        success: true,
        message: 'Shipping address created successfully',
        address: {
          id: address.address_id,
          addressName: address.address_name,
          firstName: address.first_name,
          lastName: address.last_name,
          company: address.company,
          addressLine1: address.address_line_1,
          addressLine2: address.address_line_2,
          city: address.city,
          stateProvince: address.state_province,
          postalCode: address.postal_code,
          country: address.country,
          phone: address.phone,
          email: address.email,
          isDefault: address.is_default,
          isBillingAddress: address.is_billing_address,
          deliveryInstructions: address.delivery_instructions,
          deliveryPreference: address.delivery_preference,
          accessCode: address.access_code,
          isVerified: address.is_verified,
          createdAt: address.created_at,
          updatedAt: address.updated_at
        }
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creating shipping address:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create shipping address' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}