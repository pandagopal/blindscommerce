import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// POST /api/reviews/[reviewId]/helpful - Mark review as helpful or not helpful
export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const body = await req.json();
    const user = await getCurrentUser();
    const reviewId = parseInt(params.reviewId);
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    if (typeof body.isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'isHelpful must be a boolean value' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // For guest users, use session ID (could be stored in localStorage)
    let sessionId = null;
    if (!user) {
      sessionId = body.sessionId || req.headers.get('x-session-id');
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required for guest users' },
          { status: 400 }
        );
      }
    }

    // Check if user/session already voted on this review
    let existingVoteQuery = '';
    let existingVoteParams: any[] = [reviewId];
    
    if (user) {
      existingVoteQuery = 'SELECT id, is_helpful FROM review_helpfulness WHERE review_id = ? AND user_id = ?';
      existingVoteParams.push(user.userId);
    } else {
      existingVoteQuery = 'SELECT id, is_helpful FROM review_helpfulness WHERE review_id = ? AND session_id = ?';
      existingVoteParams.push(sessionId);
    }

    const [existingVotes] = await pool.execute<RowDataPacket[]>(existingVoteQuery, existingVoteParams);

    const connection = await pool.getConnection();
    
    try {
      // Transaction handling with pool - consider using connection from pool

      if (existingVotes.length > 0) {
        const existingVote = existingVotes[0];
        
        if (Boolean(existingVote.is_helpful) === body.isHelpful) { // Convert 0/1 to false/true for comparison
          // Same vote - remove it (toggle off)
          await pool.execute(
            'DELETE FROM review_helpfulness WHERE id = ?',
            [existingVote.id]
          );
        } else {
          // Different vote - update it
          await pool.execute(
            'UPDATE review_helpfulness SET is_helpful = ? WHERE id = ?',
            [body.isHelpful ? 1 : 0, existingVote.id] // Convert boolean to 0/1
          );
        }
      } else {
        // New vote - insert it
        await pool.execute(
          `INSERT INTO review_helpfulness (review_id, user_id, session_id, is_helpful)
           VALUES (?, ?, ?, ?)`,
          [reviewId, user?.userId || null, sessionId, body.isHelpful ? 1 : 0] // Convert boolean to 0/1
        );
      }

      // Update helpful count on the review
      const [helpfulCount] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM review_helpfulness WHERE review_id = ? AND is_helpful = 1',
        [reviewId]
      );

      await pool.execute(
        'UPDATE product_reviews SET helpful_count = ? WHERE review_id = ?',
        [helpfulCount[0].count, reviewId]
      );

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        helpfulCount: helpfulCount[0].count,
        userVote: existingVotes.length > 0 && existingVotes[0].is_helpful === body.isHelpful ? null : body.isHelpful
      });

    } catch (error) {
      // Rollback handling needs review with pool
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating review helpfulness:', error);
    return NextResponse.json(
      { error: 'Failed to update helpfulness' },
      { status: 500 }
    );
  }
}

// GET /api/reviews/[reviewId]/helpful - Get current user's vote on this review
export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const user = await getCurrentUser();
    const reviewId = parseInt(params.reviewId);
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    if (!user) {
      // For guest users, return no vote
      return NextResponse.json({
        userVote: null,
        canVote: true
      });
    }

    // Get user's existing vote
    const [votes] = await pool.execute<RowDataPacket[]>(
      'SELECT is_helpful FROM review_helpfulness WHERE review_id = ? AND user_id = ?',
      [reviewId, user.userId]
    );

    return NextResponse.json({
      userVote: votes.length > 0 ? votes[0].is_helpful : null,
      canVote: true
    });

  } catch (error) {
    console.error('Error fetching review vote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote status' },
      { status: 500 }
    );
  }
}