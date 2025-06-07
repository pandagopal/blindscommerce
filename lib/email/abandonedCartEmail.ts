import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface CartItem {
  id: number;
  name: string;
  slug: string;
  quantity: number;
  price: number;
  image?: string;
  configuration?: any;
}

interface AbandonedCart {
  id: number;
  cartId: string;
  email: string;
  customerName: string;
  totalValue: number;
  itemCount: number;
  cartData: {
    items: CartItem[];
  };
  recoveryToken: string;
}

interface EmailTemplate {
  id: number;
  subjectLine: string;
  emailContent: string;
  templateVariant: string;
}

export class AbandonedCartEmailService {
  private pool: any;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  private async getPool() {
    if (!this.pool) {
      this.pool = await getPool();
    }
    return this.pool;
  }

  // Send first reminder email (24 hours after abandonment)
  async sendFirstReminderEmails() {
    const pool = await this.getPool();

    // Find carts eligible for first reminder
    const [carts] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM abandoned_cart_recovery 
       WHERE recovery_status = 'pending'
         AND first_email_sent_at IS NULL
         AND created_at <= DATE_SUB(NOW(), INTERVAL send_first_email_after MINUTE)
         AND expires_at > NOW()`
    );

    console.log(`Found ${carts.length} carts for first reminder email`);

    for (const cart of carts) {
      try {
        await this.sendEmail(cart, 'first_email');
        
        // Update cart status
        await pool.execute(
          'UPDATE abandoned_cart_recovery SET recovery_status = ?, first_email_sent_at = NOW(), last_email_sent_at = NOW() WHERE id = ?',
          ['email_sent', cart.id]
        );

        console.log(`First reminder sent for cart ${cart.id}`);
      } catch (error) {
        console.error(`Failed to send first reminder for cart ${cart.id}:`, error);
      }
    }

    return carts.length;
  }

  // Send reminder email (72 hours after first email)
  async sendReminderEmails() {
    const pool = await this.getPool();

    // Find carts eligible for reminder
    const [carts] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM abandoned_cart_recovery 
       WHERE recovery_status = 'email_sent'
         AND reminder_email_sent_at IS NULL
         AND first_email_sent_at <= DATE_SUB(NOW(), INTERVAL send_reminder_after MINUTE)
         AND expires_at > NOW()`
    );

    console.log(`Found ${carts.length} carts for reminder email`);

    for (const cart of carts) {
      try {
        await this.sendEmail(cart, 'reminder_email');
        
        // Update cart status
        await pool.execute(
          'UPDATE abandoned_cart_recovery SET recovery_status = ?, reminder_email_sent_at = NOW(), last_email_sent_at = NOW() WHERE id = ?',
          ['reminder_sent', cart.id]
        );

        console.log(`Reminder sent for cart ${cart.id}`);
      } catch (error) {
        console.error(`Failed to send reminder for cart ${cart.id}:`, error);
      }
    }

    return carts.length;
  }

  // Send final reminder email (24 hours before expiration)
  async sendFinalReminderEmails() {
    const pool = await this.getPool();

    // Find carts eligible for final reminder
    const [carts] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM abandoned_cart_recovery 
       WHERE recovery_status = 'reminder_sent'
         AND expires_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
         AND expires_at > NOW()
         AND last_email_sent_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    console.log(`Found ${carts.length} carts for final reminder email`);

    for (const cart of carts) {
      try {
        await this.sendEmail(cart, 'final_reminder');
        
        // Update last email sent time
        await pool.execute(
          'UPDATE abandoned_cart_recovery SET last_email_sent_at = NOW() WHERE id = ?',
          [cart.id]
        );

        console.log(`Final reminder sent for cart ${cart.id}`);
      } catch (error) {
        console.error(`Failed to send final reminder for cart ${cart.id}:`, error);
      }
    }

    return carts.length;
  }

  // Mark expired carts
  async markExpiredCarts() {
    const pool = await this.getPool();

    const [result] = await pool.execute(
      `UPDATE abandoned_cart_recovery 
       SET recovery_status = 'expired' 
       WHERE recovery_status NOT IN ('recovered', 'expired', 'opted_out')
         AND expires_at <= NOW()`
    );

    const expiredCount = (result as any).affectedRows;
    console.log(`Marked ${expiredCount} carts as expired`);

    return expiredCount;
  }

  // Send individual email
  private async sendEmail(cart: any, templateType: 'first_email' | 'reminder_email' | 'final_reminder') {
    const pool = await this.getPool();

    // Get email template
    const [templates] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM abandoned_cart_email_templates WHERE template_type = ? AND is_active = 1 ORDER BY RAND() LIMIT 1',
      [templateType]
    );

    if (templates.length === 0) {
      throw new Error(`No active template found for ${templateType}`);
    }

    const template = templates[0];

    // Parse cart data
    const cartData = JSON.parse(cart.cart_data);
    
    // Generate email content
    const emailContent = await this.generateEmailContent(cart, cartData, template);
    
    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log the email content
    console.log('Email Content Generated:', {
      to: cart.email,
      subject: template.subject_line,
      content: emailContent
    });

    // In a real implementation, you would send the email here:
    /*
    await emailService.send({
      to: cart.email,
      subject: template.subject_line,
      html: emailContent,
      trackingPixel: `${this.baseUrl}/api/cart/email-tracking/${cart.recovery_token}/opened`,
      unsubscribeLink: `${this.baseUrl}/api/cart/unsubscribe/${cart.recovery_token}`
    });
    */

    // Update template stats
    await pool.execute(
      'UPDATE abandoned_cart_email_templates SET sent_count = sent_count + 1 WHERE id = ?',
      [template.id]
    );

    // Log the interaction
    await pool.execute(
      `INSERT INTO cart_recovery_interactions (
        recovery_id,
        interaction_type,
        interaction_data
      ) VALUES (?, 'email_sent', ?)`,
      [
        cart.id,
        JSON.stringify({
          templateType,
          templateId: template.id,
          templateVariant: template.template_variant
        })
      ]
    );
  }

  // Generate email content with template variables
  private async generateEmailContent(cart: any, cartData: any, template: any): Promise<string> {
    const recoveryLink = `${this.baseUrl}/cart/recover/${cart.recovery_token}`;
    const unsubscribeLink = `${this.baseUrl}/api/cart/unsubscribe/${cart.recovery_token}`;
    
    // Generate cart items HTML
    const cartItemsHtml = cartData.items.map((item: CartItem) => `
      <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 4px;">` : ''}
        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0; font-size: 16px;">${item.name}</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">Quantity: ${item.quantity}</p>
          <p style="margin: 0; color: #333; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    `).join('');

    // Replace template variables
    let emailContent = template.email_content
      .replace(/\{\{customer_name\}\}/g, cart.customer_name || 'Valued Customer')
      .replace(/\{\{item_count\}\}/g, cart.item_count.toString())
      .replace(/\{\{total_value\}\}/g, cart.total_value.toFixed(2))
      .replace(/\{\{cart_items\}\}/g, cartItemsHtml)
      .replace(/\{\{recovery_link\}\}/g, recoveryLink)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeLink);

    return emailContent;
  }

  // Track email opens
  async trackEmailOpen(recoveryToken: string) {
    const pool = await this.getPool();

    await pool.execute(
      'UPDATE abandoned_cart_recovery SET email_open_count = email_open_count + 1 WHERE recovery_token = ?',
      [recoveryToken]
    );

    // Log interaction
    const [carts] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM abandoned_cart_recovery WHERE recovery_token = ?',
      [recoveryToken]
    );

    if (carts.length > 0) {
      await pool.execute(
        `INSERT INTO cart_recovery_interactions (
          recovery_id,
          interaction_type,
          interaction_data
        ) VALUES (?, 'email_opened', ?)`,
        [carts[0].id, JSON.stringify({ action: 'email_opened' })]
      );
    }
  }

  // Handle unsubscribe
  async handleUnsubscribe(recoveryToken: string) {
    const pool = await this.getPool();

    await pool.execute(
      'UPDATE abandoned_cart_recovery SET recovery_status = ? WHERE recovery_token = ?',
      ['opted_out', recoveryToken]
    );

    return true;
  }
}

// Export singleton instance
export const abandonedCartEmailService = new AbandonedCartEmailService();