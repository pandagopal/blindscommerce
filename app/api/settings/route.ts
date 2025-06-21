import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Setting extends RowDataPacket {
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  is_public: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';

    const pool = await getPool();
    
    let query = 'SELECT setting_key, setting_value, setting_type, category FROM company_settings';
    const params: any[] = [];
    const conditions: string[] = [];

    if (publicOnly) {
      conditions.push('is_public = true');
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category, setting_key';

    const [settings] = await pool.execute<Setting[]>(query, params);

    // Convert settings to object format and parse values by type
    const settingsObject: { [key: string]: any } = {};
    
    settings.forEach(setting => {
      let value: any = setting.setting_value;
      
      // Parse value based on type
      switch (setting.setting_type) {
        case 'number':
          value = parseFloat(setting.setting_value);
          break;
        case 'boolean':
          value = setting.setting_value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(setting.setting_value);
          } catch (e) {
            value = setting.setting_value;
          }
          break;
        default:
          value = setting.setting_value;
      }
      
      settingsObject[setting.setting_key] = value;
    });

    return NextResponse.json({
      settings: settingsObject,
      categories: [...new Set(settings.map(s => s.category))]
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Update settings one by one
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await pool.execute(
        'UPDATE company_settings SET setting_value = ? WHERE setting_key = ?',
        [stringValue, key]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}