import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface VendorParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: VendorParams) {
  let connection;
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    const pool = await getPool();
    connection = await pool.getConnection();

    // Get vendors assigned to this product
    const [vendorRows] = await connection.query(
      `SELECT vi.vendor_info_id as vendorId, vi.company_name as companyName, 
              vi.status, vp.vendor_price, vp.status as vendorProductStatus,
              vp.created_at as assignedAt
       FROM vendor_products vp
       JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
       WHERE vp.product_id = ?
       ORDER BY vp.created_at DESC`,
      [productId]
    );

    const vendors = (vendorRows || []).map(vendor => ({
      vendorId: vendor.vendorId,
      companyName: vendor.companyName,
      status: vendor.status,
      vendorPrice: vendor.vendor_price,
      vendorProductStatus: vendor.vendorProductStatus,
      assignedAt: vendor.assignedAt
    }));

    return NextResponse.json({
      vendors,
      totalVendors: vendors.length
    });

  } catch (error) {
    console.error('Error fetching product vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product vendors' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}