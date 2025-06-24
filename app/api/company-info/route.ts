import { NextRequest, NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/settings';
import { cache, CacheKeys } from '@/lib/cache';

// Default company info if none is set in database
const DEFAULT_COMPANY_INFO = {
  companyName: 'Smart Blinds Hub',
  emergencyHotline: '1-800-BLINDS',
  customerService: '1-800-555-0123',
  salesPhone: '1-800-555-0124',
  techSupport: '1-800-555-0125',
  mainEmail: 'info@smartblindshub.com',
  salesEmail: 'sales@smartblindshub.com',
  supportEmail: 'support@smartblindshub.com',
  website: 'https://smartblindshub.com',
  tagline: 'Transform Your Space with Smart Window Solutions',
  businessHours: {
    weekdays: '9:00 AM - 6:00 PM EST',
    saturday: '10:00 AM - 4:00 PM EST',
    sunday: 'Closed'
  }
};

// GET - Get public company information
export async function GET(request: NextRequest) {
  try {
    const cacheKey = CacheKeys.companyInfo.public();
    
    // Check cache first
    const cachedInfo = cache.get(cacheKey);
    if (cachedInfo) {
      return NextResponse.json({
        success: true,
        companyInfo: cachedInfo,
        cached: true
      });
    }

    // Get settings from admin settings system
    const settings = await getPlatformSettings();
    
    // Build company info from general settings with fallbacks to defaults
    const companyInfo = {
      companyName: settings.general.site_name || DEFAULT_COMPANY_INFO.companyName,
      emergencyHotline: settings.general.phone || DEFAULT_COMPANY_INFO.emergencyHotline,
      customerService: settings.general.phone || DEFAULT_COMPANY_INFO.customerService,
      salesPhone: settings.general.phone || DEFAULT_COMPANY_INFO.salesPhone,
      techSupport: settings.general.phone || DEFAULT_COMPANY_INFO.techSupport,
      mainEmail: settings.general.contact_email || DEFAULT_COMPANY_INFO.mainEmail,
      salesEmail: settings.general.contact_email || DEFAULT_COMPANY_INFO.salesEmail,
      supportEmail: settings.general.contact_email || DEFAULT_COMPANY_INFO.supportEmail,
      website: DEFAULT_COMPANY_INFO.website,
      tagline: DEFAULT_COMPANY_INFO.tagline,
      businessHours: DEFAULT_COMPANY_INFO.businessHours
    };

    // Cache the company info
    cache.set(cacheKey, companyInfo);

    return NextResponse.json({
      success: true,
      companyInfo,
      cached: false
    });

  } catch (error) {
    console.error('Get company info error:', error);
    // Return default info if settings fail
    return NextResponse.json({
      success: true,
      companyInfo: DEFAULT_COMPANY_INFO
    });
  }
}