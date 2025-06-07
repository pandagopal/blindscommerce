import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SocialAccountRow extends RowDataPacket {
  id: number;
  platform: string;
  account_name: string;
  account_url: string;
  account_id: string;
  is_active: number;
  auto_post: number;
  post_schedule: string;
  display_order: number;
  show_in_footer: number;
  show_in_header: number;
  icon_class: string;
  created_at: string;
  updated_at: string;
}

// GET /api/social/accounts - Get social media accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const adminView = searchParams.get('admin') === 'true';
    
    const user = await getCurrentUser();
    
    // Admin view requires admin privileges
    if (adminView && (!user || user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const pool = await getPool();

    let whereClause = '1=1';
    const queryParams: any[] = [];

    if (!includeInactive) {
      whereClause += ' AND is_active = 1';
    }

    const [accounts] = await pool.execute<SocialAccountRow[]>(
      `SELECT * FROM social_media_accounts 
       WHERE ${whereClause}
       ORDER BY display_order ASC, platform ASC`,
      queryParams
    );

    // Format response - hide sensitive data for non-admin users
    const formattedAccounts = accounts.map(account => {
      const baseData = {
        id: account.id,
        platform: account.platform,
        accountName: account.account_name,
        accountUrl: account.account_url,
        isActive: Boolean(account.is_active), // Convert 0/1 to false/true
        displayOrder: account.display_order,
        showInFooter: Boolean(account.show_in_footer), // Convert 0/1 to false/true
        showInHeader: Boolean(account.show_in_header), // Convert 0/1 to false/true
        iconClass: account.icon_class,
        createdAt: account.created_at
      };

      // Include admin-only data if user is admin
      if (adminView && user?.role === 'admin') {
        return {
          ...baseData,
          accountId: account.account_id,
          autoPost: Boolean(account.auto_post), // Convert 0/1 to false/true
          postSchedule: account.post_schedule ? JSON.parse(account.post_schedule) : null,
          updatedAt: account.updated_at
        };
      }

      return baseData;
    });

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
      total: accounts.length
    });

  } catch (error) {
    console.error('Error fetching social media accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media accounts' },
      { status: 500 }
    );
  }
}

// POST /api/social/accounts - Create social media account (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      platform,
      accountName,
      accountUrl,
      accountId,
      autoPost = false,
      postSchedule,
      displayOrder = 0,
      showInFooter = true,
      showInHeader = false,
      iconClass
    } = body;

    if (!platform || !accountName || !accountUrl) {
      return NextResponse.json(
        { error: 'Platform, account name, and URL are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if account already exists
    const [existingAccounts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM social_media_accounts WHERE platform = ? AND account_name = ?',
      [platform, accountName]
    );

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        { error: 'Account with this platform and name already exists' },
        { status: 400 }
      );
    }

    // Insert new account
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO social_media_accounts (
        platform,
        account_name,
        account_url,
        account_id,
        auto_post,
        post_schedule,
        display_order,
        show_in_footer,
        show_in_header,
        icon_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        platform,
        accountName,
        accountUrl,
        accountId,
        autoPost ? 1 : 0, // Convert boolean to 0/1
        postSchedule ? JSON.stringify(postSchedule) : null,
        displayOrder,
        showInFooter ? 1 : 0, // Convert boolean to 0/1
        showInHeader ? 1 : 0, // Convert boolean to 0/1
        iconClass
      ]
    );

    return NextResponse.json({
      success: true,
      accountId: result.insertId,
      message: 'Social media account created successfully'
    });

  } catch (error) {
    console.error('Error creating social media account:', error);
    return NextResponse.json(
      { error: 'Failed to create social media account' },
      { status: 500 }
    );
  }
}

// PUT /api/social/accounts - Update multiple accounts order (admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { accounts } = body;

    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'Accounts array is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update display order for each account
      for (const account of accounts) {
        if (account.id && typeof account.displayOrder === 'number') {
          await connection.execute(
            'UPDATE social_media_accounts SET display_order = ? WHERE id = ?',
            [account.displayOrder, account.id]
          );
        }
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Account order updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating account order:', error);
    return NextResponse.json(
      { error: 'Failed to update account order' },
      { status: 500 }
    );
  }
}