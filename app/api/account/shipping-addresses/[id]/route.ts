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

interface UpdateAddressRequest {
  address_name?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
  is_billing_address?: boolean;
  delivery_instructions?: string;
  delivery_preference?: 'standard' | 'signature_required' | 'leave_at_door' | 'front_desk';
  access_code?: string;
}

// GET /api/account/shipping-addresses/[id] - Get specific shipping address
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = parseInt(params.id);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const [addresses] = await pool.execute<ShippingAddressRow[]>(
      `SELECT * FROM user_shipping_addresses 
       WHERE address_id = ? AND user_id = ? AND is_active = TRUE`,
      [addressId, user.userId]
    );

    if (addresses.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    const address = addresses[0];
    return NextResponse.json({
      success: true,
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
        verificationSource: address.verification_source,
        lastVerifiedAt: address.last_verified_at,
        lastUsedAt: address.last_used_at,
        usageCount: address.usage_count,
        createdAt: address.created_at,
        updatedAt: address.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching shipping address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping address' },
      { status: 500 }
    );
  }
}

// PUT /api/account/shipping-addresses/[id] - Update shipping address
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = parseInt(params.id);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const body: UpdateAddressRequest = await req.json();

    const pool = await getPool();
    connection = await pool.getConnection();

    // Verify address belongs to user
    const [existingAddress] = await connection.execute<ShippingAddressRow[]>(
      'SELECT * FROM user_shipping_addresses WHERE address_id = ? AND user_id = ? AND is_active = TRUE',
      [addressId, user.userId]
    );

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if address name is being changed and ensure uniqueness
    if (body.address_name && body.address_name !== existingAddress[0].address_name) {
      const [nameCheck] = await connection.execute<RowDataPacket[]>(
        'SELECT address_id FROM user_shipping_addresses WHERE user_id = ? AND address_name = ? AND address_id != ? AND is_active = TRUE',
        [user.userId, body.address_name, addressId]
      );

      if (nameCheck.length > 0) {
        return NextResponse.json(
          { error: 'An address with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Transaction handling with pool - consider using connection from pool

    try {
      // If setting as default, unset other defaults
      if (body.is_default) {
        await pool.execute(
          'UPDATE user_shipping_addresses SET is_default = FALSE WHERE user_id = ? AND address_id != ? AND is_default = TRUE',
          [user.userId, addressId]
        );
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldMappings = {
        address_name: body.address_name,
        first_name: body.first_name,
        last_name: body.last_name,
        company: body.company,
        address_line_1: body.address_line_1,
        address_line_2: body.address_line_2,
        city: body.city,
        state_province: body.state_province,
        postal_code: body.postal_code,
        country: body.country,
        phone: body.phone,
        email: body.email,
        is_default: body.is_default,
        is_billing_address: body.is_billing_address,
        delivery_instructions: body.delivery_instructions,
        delivery_preference: body.delivery_preference,
        access_code: body.access_code
      };

      Object.entries(fieldMappings).forEach(([field, value]) => {
        if (value !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      });

      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      // Add address_id for WHERE clause
      updateValues.push(addressId, user.userId);

      await pool.execute(
        `UPDATE user_shipping_addresses 
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE address_id = ? AND user_id = ?`,
        updateValues
      );

      // If address was updated to be unverified, clear verification info
      if (body.address_line_1 || body.city || body.state_province || body.postal_code || body.country) {
        await pool.execute(
          'UPDATE user_shipping_addresses SET is_verified = FALSE, verification_source = NULL, last_verified_at = NULL WHERE address_id = ?',
          [addressId]
        );
      }

      // Commit handling needs review with pool

      // Fetch updated address
      const [updatedAddress] = await connection.execute<ShippingAddressRow[]>(
        'SELECT * FROM user_shipping_addresses WHERE address_id = ?',
        [addressId]
      );

      const address = updatedAddress[0];
      return NextResponse.json({
        success: true,
        message: 'Shipping address updated successfully',
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
          verificationSource: address.verification_source,
          lastVerifiedAt: address.last_verified_at,
          createdAt: address.created_at,
          updatedAt: address.updated_at
        }
      });

    } catch (transactionError) {
      // Rollback handling needs review with pool
      throw transactionError;
    }

  } catch (error) {
    console.error('Error updating shipping address:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping address' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// DELETE /api/account/shipping-addresses/[id] - Delete shipping address
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const addressId = parseInt(params.id);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    // Verify address belongs to user and get current info
    const [existingAddress] = await connection.execute<ShippingAddressRow[]>(
      'SELECT * FROM user_shipping_addresses WHERE address_id = ? AND user_id = ? AND is_active = TRUE',
      [addressId, user.userId]
    );

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    const addressInfo = existingAddress[0];

    // Transaction handling with pool - consider using connection from pool

    try {
      // Check if this address is being used in any active orders
      const [orderUsage] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM orders 
         WHERE (shipping_address_id = ? OR billing_address_id = ?) 
         AND status NOT IN ('cancelled', 'refunded')`,
        [addressId, addressId]
      );

      if ((orderUsage[0] as any).count > 0) {
        // Soft delete if address is in use
        await pool.execute(
          'UPDATE user_shipping_addresses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE address_id = ?',
          [addressId]
        );
      } else {
        // Hard delete if not in use
        await pool.execute(
          'DELETE FROM user_shipping_addresses WHERE address_id = ?',
          [addressId]
        );
      }

      // If deleted address was default, set another address as default
      if (addressInfo.is_default) {
        const [otherAddresses] = await connection.execute<RowDataPacket[]>(
          'SELECT address_id FROM user_shipping_addresses WHERE user_id = ? AND address_id != ? AND is_active = TRUE ORDER BY last_used_at DESC, created_at DESC LIMIT 1',
          [user.userId, addressId]
        );

        if (otherAddresses.length > 0) {
          await pool.execute(
            'UPDATE user_shipping_addresses SET is_default = TRUE WHERE address_id = ?',
            [(otherAddresses[0] as any).address_id]
          );
        }
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Shipping address deleted successfully'
      });

    } catch (transactionError) {
      // Rollback handling needs review with pool
      throw transactionError;
    }

  } catch (error) {
    console.error('Error deleting shipping address:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping address' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}