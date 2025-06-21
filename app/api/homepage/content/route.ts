import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Setting extends RowDataPacket {
  setting_key: string;
  setting_value: string;
  setting_type: string;
}

export async function GET(request: NextRequest) {
  try {
    const pool = await getPool();
    
    // Get homepage and promotional content
    const [settings] = await pool.execute<Setting[]>(
      `SELECT setting_key, setting_value, setting_type 
       FROM company_settings 
       WHERE category IN ('homepage', 'promotions') AND is_public = true
       ORDER BY setting_key`
    );

    // Parse settings into structured content
    const content: { [key: string]: any } = {};
    const heroSlides: any[] = [];
    const promoBanners: string[] = [];

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

      // Group hero slide content
      if (setting.setting_key.startsWith('hero_slide_')) {
        const parts = setting.setting_key.split('_');
        const slideNumber = parseInt(parts[2]) - 1;
        const property = parts.slice(3).join('_');
        
        if (!heroSlides[slideNumber]) {
          heroSlides[slideNumber] = {};
        }
        heroSlides[slideNumber][property] = value;
      }
      // Group promo banners
      else if (setting.setting_key.startsWith('promo_banner_')) {
        promoBanners.push(value);
      }
      else {
        content[setting.setting_key] = value;
      }
    });

    // Add default hero slides if none exist
    if (heroSlides.length === 0) {
      heroSlides.push(
        {
          title: 'Transform Your Space with Premium Blinds',
          description: 'Discover our collection of custom blinds and shades',
          cta: 'Shop Now'
        },
        {
          title: 'Free Shipping on Orders Over $100',
          description: 'Get your custom window treatments delivered free',
          cta: 'Learn More'
        },
        {
          title: 'Save Up to 40% Off',
          description: 'Limited time offer on select window treatments',
          cta: 'Shop Sale'
        }
      );
    }

    // Add default promo banners if none exist
    if (promoBanners.length === 0) {
      promoBanners.push(
        'Free Shipping on orders over $100',
        'Extra 20% off Cellular Shades',
        'Free Cordless Upgrade'
      );
    }

    return NextResponse.json({
      heroSlides: heroSlides.filter(slide => slide), // Remove empty slides
      promoBanners,
      content
    });
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    
    // Return default content if database fails
    return NextResponse.json({
      heroSlides: [
        {
          title: 'Transform Your Space with Premium Blinds',
          description: 'Discover our collection of custom blinds and shades',
          cta: 'Shop Now'
        },
        {
          title: 'Free Shipping on Orders Over $100',
          description: 'Get your custom window treatments delivered free',
          cta: 'Learn More'
        },
        {
          title: 'Save Up to 40% Off',
          description: 'Limited time offer on select window treatments',
          cta: 'Shop Sale'
        }
      ],
      promoBanners: [
        'Free Shipping on orders over $100',
        'Extra 20% off Cellular Shades',
        'Free Cordless Upgrade'
      ],
      content: {}
    });
  }
}