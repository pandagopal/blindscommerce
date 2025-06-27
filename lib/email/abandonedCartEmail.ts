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

// Internal function to call V2 API endpoints
async function callV2Api(endpoint: string, method: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${baseUrl}/v2/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-cron': 'abandoned-cart', // Internal cron job identifier
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'V2 API request failed');
  }
  return result.data;
}

export class AbandonedCartEmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // Send first reminder email (24 hours after abandonment)
  async sendFirstReminderEmails() {
    try {
      // Get carts eligible for first reminder via V2 API
      const carts = await callV2Api('cart/abandoned/eligible-first-reminder', 'GET');

      for (const cart of carts) {
        try {
          await this.sendEmail(cart, 'first_email');
          
          // Update cart status via V2 API
          await callV2Api('cart/abandoned/update-status', 'POST', {
            cartId: cart.id,
            status: 'email_sent',
            firstEmailSentAt: new Date().toISOString(),
            lastEmailSentAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Failed to send first reminder for cart ${cart.id}:`, error);
        }
      }

      return carts.length;
    } catch (error) {
      console.error('Error getting eligible carts for first reminder:', error);
      return 0;
    }
  }

  // Send reminder email (72 hours after first email)
  async sendReminderEmails() {
    try {
      // Get carts eligible for reminder via V2 API
      const carts = await callV2Api('cart/abandoned/eligible-reminder', 'GET');

      for (const cart of carts) {
        try {
          await this.sendEmail(cart, 'reminder_email');
          
          // Update cart status via V2 API
          await callV2Api('cart/abandoned/update-status', 'POST', {
            cartId: cart.id,
            status: 'reminder_sent',
            reminderEmailSentAt: new Date().toISOString(),
            lastEmailSentAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Failed to send reminder for cart ${cart.id}:`, error);
        }
      }

      return carts.length;
    } catch (error) {
      console.error('Error getting eligible carts for reminder:', error);
      return 0;
    }
  }

  // Send final reminder email (24 hours before expiration)
  async sendFinalReminderEmails() {
    try {
      // Get carts eligible for final reminder via V2 API
      const carts = await callV2Api('cart/abandoned/eligible-final-reminder', 'GET');

      for (const cart of carts) {
        try {
          await this.sendEmail(cart, 'final_reminder');
          
          // Update last email sent time via V2 API
          await callV2Api('cart/abandoned/update-status', 'POST', {
            cartId: cart.id,
            lastEmailSentAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Failed to send final reminder for cart ${cart.id}:`, error);
        }
      }

      return carts.length;
    } catch (error) {
      console.error('Error getting eligible carts for final reminder:', error);
      return 0;
    }
  }

  // Mark expired carts
  async markExpiredCarts() {
    try {
      // Mark expired carts via V2 API
      const result = await callV2Api('cart/abandoned/mark-expired', 'POST');
      return result.expiredCount || 0;
    } catch (error) {
      console.error('Error marking expired carts:', error);
      return 0;
    }
  }

  // Send individual email
  private async sendEmail(cart: any, templateType: 'first_email' | 'reminder_email' | 'final_reminder') {
    try {
      // Get email template via V2 API
      const template = await callV2Api('cart/abandoned/get-email-template', 'POST', {
        templateType
      });

      if (!template) {
        throw new Error(`No active template found for ${templateType}`);
      }

      // Parse cart data
      const cartData = typeof cart.cart_data === 'string' ? JSON.parse(cart.cart_data) : cart.cart_data;
      
      // Generate email content
      const emailContent = await this.generateEmailContent(cart, cartData, template);
      
      // Send email via V2 API (which will handle the actual email sending)
      await callV2Api('cart/abandoned/send-email', 'POST', {
        to: cart.email,
        subject: template.subject_line || template.subjectLine,
        html: emailContent,
        trackingPixel: `${this.baseUrl}/api/cart/email-tracking/${cart.recovery_token}/opened`,
        unsubscribeLink: `${this.baseUrl}/api/cart/unsubscribe/${cart.recovery_token}`
      });

      // Update template stats via V2 API
      await callV2Api('cart/abandoned/update-template-stats', 'POST', {
        templateId: template.id,
        sentCount: 1
      });

      // Log the interaction via V2 API
      await callV2Api('cart/abandoned/log-interaction', 'POST', {
        recoveryId: cart.id,
        interactionType: 'email_sent',
        interactionData: {
          templateType,
          templateId: template.id,
          templateVariant: template.template_variant || template.templateVariant
        }
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
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
    try {
      // Track email open via V2 API
      await callV2Api('cart/abandoned/track-email-open', 'POST', {
        recoveryToken
      });
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  // Handle unsubscribe
  async handleUnsubscribe(recoveryToken: string) {
    try {
      // Handle unsubscribe via V2 API
      await callV2Api('cart/abandoned/unsubscribe', 'POST', {
        recoveryToken
      });
      return true;
    } catch (error) {
      console.error('Error handling unsubscribe:', error);
      return false;
    }
  }
}

// Export singleton instance
export const abandonedCartEmailService = new AbandonedCartEmailService();