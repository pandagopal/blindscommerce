import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST /api/analytics/events - Track analytics events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventType,
      eventCategory,
      eventAction,
      eventLabel,
      eventValue,
      pageUrl,
      pageTitle,
      pagePath,
      productId,
      categoryId,
      orderId,
      customProperties
    } = body;

    // Validate required fields
    if (!eventType || !eventCategory || !eventAction || !pageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, eventCategory, eventAction, pageUrl' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Get session ID from headers or generate one
    let sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get device and browser information
    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' :
                      /iPad/.test(userAgent) ? 'tablet' : 'desktop';
    
    // Simple browser detection
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Get referrer and IP
    const referrerUrl = req.headers.get('referer') || null;
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Parse UTM parameters from URL
    let utmSource = null, utmMedium = null, utmCampaign = null, utmTerm = null, utmContent = null;
    
    try {
      const urlObj = new URL(pageUrl);
      utmSource = urlObj.searchParams.get('utm_source');
      utmMedium = urlObj.searchParams.get('utm_medium');
      utmCampaign = urlObj.searchParams.get('utm_campaign');
      utmTerm = urlObj.searchParams.get('utm_term');
      utmContent = urlObj.searchParams.get('utm_content');
    } catch (error) {
      // Invalid URL, ignore UTM parsing
    }

    // Insert analytics event
    await pool.execute<ResultSetHeader>(
      `INSERT INTO analytics_events (
        session_id,
        user_id,
        event_type,
        event_category,
        event_action,
        event_label,
        event_value,
        page_url,
        page_title,
        page_path,
        referrer_url,
        product_id,
        category_id,
        order_id,
        user_agent,
        device_type,
        browser,
        os,
        ip_address,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        custom_properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        user?.userId || null,
        eventType,
        eventCategory,
        eventAction,
        eventLabel,
        eventValue,
        pageUrl,
        pageTitle,
        pagePath,
        referrerUrl,
        productId,
        categoryId,
        orderId,
        userAgent,
        deviceType,
        browser,
        os,
        ipAddress,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        customProperties ? JSON.stringify(customProperties) : null
      ]
    );

    // Return session ID for client-side tracking
    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}