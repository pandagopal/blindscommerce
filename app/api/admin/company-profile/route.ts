import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get company profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    try {
      // Get company profile from existing settings table
      const [rows] = await pool.execute(
        'SELECT config_key, config_value, config_type FROM upload_security_config WHERE config_key LIKE "general_%" AND is_active = TRUE'
      );

      let profile = null;
      if (Array.isArray(rows) && rows.length > 0) {
        profile = {};
        
        // Convert flat settings to nested profile structure
        rows.forEach((row: any) => {
          const { config_key, config_value, config_type } = row;
          const key = config_key.replace('general_', '');
          
          let parsedValue;
          switch (config_type) {
            case 'boolean':
              parsedValue = config_value === 'true';
              break;
            case 'integer':
              parsedValue = parseInt(config_value);
              break;
            case 'json':
              try {
                parsedValue = JSON.parse(config_value);
              } catch {
                parsedValue = config_value;
              }
              break;
            default:
              parsedValue = config_value;
          }
          
          // Only include non-null, non-empty values
          if (parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
            // Map database keys to profile structure
            switch (key) {
              case 'site_name':
                profile.companyName = parsedValue;
                break;
              case 'phone':
                profile.emergencyHotline = parsedValue;
                break;
              case 'contact_email':
                profile.mainEmail = parsedValue;
                break;
              case 'site_description':
                profile.description = parsedValue;
                break;
              case 'address':
                // Parse address into structured format if needed
                profile.address = { street: parsedValue };
                break;
              case 'timezone':
                profile.timezone = parsedValue;
                break;
              case 'currency':
                profile.currency = parsedValue;
                break;
              case 'tax_rate':
                profile.taxRate = parsedValue;
                break;
              default:
                profile[key] = parsedValue;
            }
          }
        });
        
        // If no settings found, return null
        if (Object.keys(profile).length === 0) {
          profile = null;
        }
      }

      return NextResponse.json({
        success: true,
        profile
      });

    } finally {
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

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Map profile structure to database keys and save to settings table
      const settingsMap = {
        companyName: 'site_name',
        emergencyHotline: 'phone',
        mainEmail: 'contact_email',
        description: 'site_description',
        timezone: 'timezone',
        currency: 'currency',
        taxRate: 'tax_rate'
      };

      // Handle simple mappings
      for (const [profileKey, dbKey] of Object.entries(settingsMap)) {
        const value = profileData[profileKey];
        if (value !== null && value !== undefined && value !== '') {
          const fullDbKey = `general_${dbKey}`;
          let dbType = 'string';
          let dbValue = String(value);

          if (typeof value === 'boolean') {
            dbType = 'boolean';
            dbValue = value.toString();
          } else if (typeof value === 'number') {
            dbType = 'integer';
            dbValue = value.toString();
          }

          await pool.execute(`
            INSERT INTO upload_security_config (config_key, config_value, config_type, updated_by, description, is_active) 
            VALUES (?, ?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE 
              config_value = VALUES(config_value),
              config_type = VALUES(config_type),
              updated_by = VALUES(updated_by),
              updated_at = CURRENT_TIMESTAMP
          `, [
            fullDbKey, 
            dbValue, 
            dbType, 
            user.userId,
            `Company profile setting: ${profileKey}`
          ]);
        }
      }

      // Handle nested objects like address
      if (profileData.address && typeof profileData.address === 'object') {
        const addressStr = profileData.address.street || '';
        if (addressStr) {
          await pool.execute(`
            INSERT INTO upload_security_config (config_key, config_value, config_type, updated_by, description, is_active) 
            VALUES (?, ?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE 
              config_value = VALUES(config_value),
              updated_by = VALUES(updated_by),
              updated_at = CURRENT_TIMESTAMP
          `, [
            'general_address', 
            addressStr, 
            'string', 
            user.userId,
            'Company profile setting: address'
          ]);
        }
      }

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Company profile updated successfully'
      });

    } finally {
      }

  } catch (error) {
    console.error('Update company profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update company profile' },
      { status: 500 }
    );
  }
}