import { NextRequest, NextResponse } from 'next/server';
import { abandonedCartEmailService } from '@/lib/email/abandonedCartEmail';

// POST /api/cron/abandoned-cart - Process abandoned cart emails (cron job)
export async function POST(req: NextRequest) {
  try {
    // Verify this is a valid cron request (you might want to add authentication)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting abandoned cart email processing...');

    const results = {
      firstReminders: 0,
      reminderEmails: 0,
      finalReminders: 0,
      expiredCarts: 0,
      errors: []
    };

    try {
      // Send first reminder emails (24 hours after abandonment)
      results.firstReminders = await abandonedCartEmailService.sendFirstReminderEmails();
    } catch (error) {
      console.error('Error sending first reminders:', error);
      results.errors.push(`First reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Send reminder emails (72 hours after first email)
      results.reminderEmails = await abandonedCartEmailService.sendReminderEmails();
    } catch (error) {
      console.error('Error sending reminder emails:', error);
      results.errors.push(`Reminder emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Send final reminder emails (24 hours before expiration)
      results.finalReminders = await abandonedCartEmailService.sendFinalReminderEmails();
    } catch (error) {
      console.error('Error sending final reminders:', error);
      results.errors.push(`Final reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Mark expired carts
      results.expiredCarts = await abandonedCartEmailService.markExpiredCarts();
    } catch (error) {
      console.error('Error marking expired carts:', error);
      results.errors.push(`Expired carts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('Abandoned cart email processing completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart processing completed',
      results: {
        firstRemindersSent: results.firstReminders,
        reminderEmailsSent: results.reminderEmails,
        finalRemindersSent: results.finalReminders,
        cartsExpired: results.expiredCarts,
        totalProcessed: results.firstReminders + results.reminderEmails + results.finalReminders + results.expiredCarts,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Error in abandoned cart cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process abandoned carts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/abandoned-cart - Get abandoned cart processing status
export async function GET(req: NextRequest) {
  try {
    // This could return statistics about the last processing run
    return NextResponse.json({
      success: true,
      message: 'Abandoned cart cron job endpoint is active',
      info: {
        endpoint: '/api/cron/abandoned-cart',
        method: 'POST',
        description: 'Processes abandoned cart recovery emails',
        schedule: 'Should be run every 4-6 hours',
        authentication: 'Requires CRON_SECRET in Authorization header'
      }
    });

  } catch (error) {
    console.error('Error getting cron status:', error);
    return NextResponse.json(
      { error: 'Failed to get cron status' },
      { status: 500 }
    );
  }
}