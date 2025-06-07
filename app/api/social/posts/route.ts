import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SocialPostRow extends RowDataPacket {
  id: number;
  account_id: number;
  post_type: string;
  title: string;
  content: string;
  image_urls: string;
  video_url: string;
  product_id: number;
  post_status: string;
  scheduled_at: string;
  published_at: string;
  platform_post_id: string;
  platform_url: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  clicks_count: number;
  hashtags: string;
  mentions: string;
  campaign_name: string;
  created_at: string;
  updated_at: string;
  platform: string;
  account_name: string;
  product_name: string;
  product_slug: string;
}

// GET /api/social/posts - Get social media posts
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || 'all';
    const platform = searchParams.get('platform') || 'all';
    const campaign = searchParams.get('campaign');
    const postType = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    const pool = await getPool();

    // Build WHERE clause
    let whereClause = '1=1';
    const queryParams: any[] = [];

    if (status !== 'all') {
      whereClause += ' AND smp.post_status = ?';
      queryParams.push(status);
    }

    if (platform !== 'all') {
      whereClause += ' AND sma.platform = ?';
      queryParams.push(platform);
    }

    if (campaign) {
      whereClause += ' AND smp.campaign_name = ?';
      queryParams.push(campaign);
    }

    if (postType) {
      whereClause += ' AND smp.post_type = ?';
      queryParams.push(postType);
    }

    // Add date range filter if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate) {
      whereClause += ' AND smp.created_at >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND smp.created_at <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }

    const validSortFields = ['created_at', 'scheduled_at', 'published_at', 'likes_count', 'comments_count', 'shares_count'];
    const finalSortBy = validSortFields.includes(sortBy) ? `smp.${sortBy}` : 'smp.created_at';
    const finalSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    // Get posts with account and product info
    const [posts] = await pool.execute<SocialPostRow[]>(
      `SELECT 
        smp.*,
        sma.platform,
        sma.account_name,
        p.name as product_name,
        p.slug as product_slug
      FROM social_media_posts smp
      JOIN social_media_accounts sma ON smp.account_id = sma.id
      LEFT JOIN products p ON smp.product_id = p.product_id
      WHERE ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM social_media_posts smp
       JOIN social_media_accounts sma ON smp.account_id = sma.id
       WHERE ${whereClause}`,
      queryParams
    );

    // Get engagement statistics
    const [statsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_posts,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        SUM(shares_count) as total_shares,
        SUM(views_count) as total_views,
        SUM(clicks_count) as total_clicks,
        AVG(likes_count) as avg_likes,
        AVG(comments_count) as avg_comments
       FROM social_media_posts smp
       JOIN social_media_accounts sma ON smp.account_id = sma.id
       WHERE ${whereClause}`,
      queryParams
    );

    // Format posts
    const formattedPosts = posts.map(post => ({
      id: post.id,
      accountId: post.account_id,
      platform: post.platform,
      accountName: post.account_name,
      postType: post.post_type,
      title: post.title,
      content: post.content,
      imageUrls: post.image_urls ? JSON.parse(post.image_urls) : [],
      videoUrl: post.video_url,
      productId: post.product_id,
      productName: post.product_name,
      productSlug: post.product_slug,
      postStatus: post.post_status,
      scheduledAt: post.scheduled_at,
      publishedAt: post.published_at,
      platformPostId: post.platform_post_id,
      platformUrl: post.platform_url,
      engagement: {
        likes: post.likes_count,
        comments: post.comments_count,
        shares: post.shares_count,
        views: post.views_count,
        clicks: post.clicks_count
      },
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      mentions: post.mentions ? JSON.parse(post.mentions) : [],
      campaignName: post.campaign_name,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    }));

    const stats = statsResult[0];

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalPosts: countResult[0].total,
        limit
      },
      statistics: {
        totalPosts: stats.total_posts,
        totalLikes: stats.total_likes,
        totalComments: stats.total_comments,
        totalShares: stats.total_shares,
        totalViews: stats.total_views,
        totalClicks: stats.total_clicks,
        averageLikes: Math.round(stats.avg_likes || 0),
        averageComments: Math.round(stats.avg_comments || 0),
        engagementRate: stats.total_views > 0 ? 
          ((stats.total_likes + stats.total_comments + stats.total_shares) / stats.total_views * 100).toFixed(2) : '0.00'
      }
    });

  } catch (error) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media posts' },
      { status: 500 }
    );
  }
}

// POST /api/social/posts - Create social media post
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
      accountId,
      postType,
      title,
      content,
      imageUrls = [],
      videoUrl,
      productId,
      scheduledAt,
      hashtags = [],
      mentions = [],
      campaignName,
      utmSource,
      utmMedium,
      utmCampaign
    } = body;

    if (!accountId || !postType || !content) {
      return NextResponse.json(
        { error: 'Account ID, post type, and content are required' },
        { status: 400 }
      );
    }

    const validPostTypes = ['product_showcase', 'room_inspiration', 'customer_review', 'promotion', 'educational', 'company_news', 'custom'];
    if (!validPostTypes.includes(postType)) {
      return NextResponse.json(
        { error: 'Invalid post type' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify account exists
    const [accounts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM social_media_accounts WHERE id = ? AND is_active = 1',
      [accountId]
    );

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or inactive account' },
        { status: 400 }
      );
    }

    // Determine post status
    const postStatus = scheduledAt ? 'scheduled' : 'draft';

    // Insert post
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO social_media_posts (
        account_id,
        post_type,
        title,
        content,
        image_urls,
        video_url,
        product_id,
        post_status,
        scheduled_at,
        hashtags,
        mentions,
        campaign_name,
        utm_source,
        utm_medium,
        utm_campaign
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        postType,
        title,
        content,
        imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        videoUrl,
        productId,
        postStatus,
        scheduledAt,
        hashtags.length > 0 ? JSON.stringify(hashtags) : null,
        mentions.length > 0 ? JSON.stringify(mentions) : null,
        campaignName,
        utmSource,
        utmMedium,
        utmCampaign
      ]
    );

    return NextResponse.json({
      success: true,
      postId: result.insertId,
      message: `Social media post ${postStatus === 'scheduled' ? 'scheduled' : 'created'} successfully`
    });

  } catch (error) {
    console.error('Error creating social media post:', error);
    return NextResponse.json(
      { error: 'Failed to create social media post' },
      { status: 500 }
    );
  }
}