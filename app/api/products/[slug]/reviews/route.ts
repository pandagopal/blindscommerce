import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ReviewRow extends RowDataPacket {
  review_id: number;
  product_id: number;
  user_id: number | null;
  guest_name: string | null;
  rating: number;
  title: string;
  review_text: string;
  is_verified_purchase: number; // MySQL TINYINT(1) returns 0/1
  helpful_count: number;
  created_at: string;
  user_first_name?: string;
  user_last_name?: string;
  image_urls?: string;
}

// GET /api/products/[slug]/reviews - Get reviews for a product
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, oldest, highest, lowest, helpful
    const rating = searchParams.get('rating'); // Filter by specific rating
    const offset = (page - 1) * limit;

    const pool = await getPool();

    // First get the product ID by slug
    const [productRows] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE slug = ? AND is_active = TRUE',
      [params.slug]
    );

    if (productRows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productId = productRows[0].product_id;

    // Build sort clause
    let sortClause = 'ORDER BY pr.created_at DESC'; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        sortClause = 'ORDER BY pr.created_at ASC';
        break;
      case 'highest':
        sortClause = 'ORDER BY pr.rating DESC, pr.created_at DESC';
        break;
      case 'lowest':
        sortClause = 'ORDER BY pr.rating ASC, pr.created_at DESC';
        break;
      case 'helpful':
        sortClause = 'ORDER BY pr.helpful_count DESC, pr.created_at DESC';
        break;
    }

    // Build rating filter
    let ratingFilter = '';
    const queryParams: any[] = [productId];
    if (rating && !isNaN(parseInt(rating))) {
      ratingFilter = 'AND pr.rating = ?';
      queryParams.push(parseInt(rating));
    }

    // Get reviews with user info and images
    const reviewsQuery = `
      SELECT 
        pr.review_id,
        pr.product_id,
        pr.user_id,
        pr.guest_name,
        pr.rating,
        pr.title,
        pr.review_text,
        pr.is_verified_purchase,
        pr.helpful_count,
        pr.created_at,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        GROUP_CONCAT(ri.image_url) as image_urls
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.user_id
      LEFT JOIN review_images ri ON pr.review_id = ri.review_id
      WHERE pr.product_id = ? AND pr.is_approved = TRUE ${ratingFilter}
      GROUP BY pr.review_id
      ${sortClause}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const [reviews] = await pool.execute<ReviewRow[]>(reviewsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_reviews pr
      WHERE pr.product_id = ? AND pr.is_approved = TRUE ${ratingFilter}
    `;

    const countParams = rating && !isNaN(parseInt(rating)) ? [productId, parseInt(rating)] : [productId];
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
    const totalReviews = countRows[0].total;

    // Get rating distribution
    const distributionQuery = `
      SELECT 
        rating,
        COUNT(*) as count
      FROM product_reviews
      WHERE product_id = ? AND is_approved = TRUE
      GROUP BY rating
      ORDER BY rating DESC
    `;

    const [distributionRows] = await pool.execute<RowDataPacket[]>(distributionQuery, [productId]);

    // Format reviews response
    const formattedReviews = reviews.map(review => ({
      id: review.review_id,
      rating: review.rating,
      title: review.title,
      text: review.review_text,
      author: review.user_id 
        ? `${review.user_first_name} ${review.user_last_name?.charAt(0)}.`
        : review.guest_name,
      isVerifiedPurchase: Boolean(review.is_verified_purchase), // Convert 0/1 to false/true
      helpfulCount: review.helpful_count,
      createdAt: review.created_at,
      images: review.image_urls ? review.image_urls.split(',') : []
    }));

    // Format rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
      const found = distributionRows.find(row => row.rating === rating);
      return {
        rating,
        count: found ? found.count : 0
      };
    });

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        limit
      },
      ratingDistribution,
      averageRating: distributionRows.length > 0 
        ? distributionRows.reduce((sum, row) => sum + (row.rating * row.count), 0) / totalReviews
        : 0
    });

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/products/[slug]/reviews - Create a new review
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const user = await getCurrentUser();

    // Validate required fields
    if (!body.rating || !body.title || !body.reviewText) {
      return NextResponse.json(
        { error: 'Rating, title, and review text are required' },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // For guest reviews, require name and email
    if (!user && (!body.guestName || !body.guestEmail)) {
      return NextResponse.json(
        { error: 'Name and email are required for guest reviews' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get product ID by slug
    const [productRows] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE slug = ? AND is_active = TRUE',
      [params.slug]
    );

    if (productRows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productId = productRows[0].product_id;

    // Check if user already reviewed this product
    if (user) {
      const [existingReviews] = await pool.execute<RowDataPacket[]>(
        'SELECT review_id FROM product_reviews WHERE product_id = ? AND user_id = ?',
        [productId, user.userId]
      );

      if (existingReviews.length > 0) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        );
      }

      // Check if user purchased this product (for verified purchase flag)
      const [orderItems] = await pool.execute<RowDataPacket[]>(
        `SELECT oi.order_item_id 
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'completed'`,
        [user.userId, productId]
      );

      body.isVerifiedPurchase = orderItems.length > 0 ? 1 : 0;
    }

    // Insert review
    const insertQuery = `
      INSERT INTO product_reviews (
        product_id,
        user_id,
        guest_name,
        guest_email,
        rating,
        title,
        review_text,
        is_verified_purchase,
        is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      productId,
      user?.userId || null,
      user ? null : body.guestName,
      user ? null : body.guestEmail,
      body.rating,
      body.title,
      body.reviewText,
      body.isVerifiedPurchase || 0,
      1 // Auto-approve for now, can add moderation later
    ]);

    const reviewId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      reviewId,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}