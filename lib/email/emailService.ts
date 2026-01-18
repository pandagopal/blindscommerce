import nodemailer from 'nodemailer';

interface EmailTemplate {
  template_id: number;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, string>;
}

interface QueuedEmail {
  email_id: number;
  template_id: number;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  variables: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  private async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/v2/content/email-templates/${encodeURIComponent(templateName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (result.success && result.template) {
        return result.template;
      }
      return null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async queueEmail(
    templateName: string,
    recipientEmail: string,
    recipientName: string | null,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/v2/content/email-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName,
          recipientEmail,
          recipientName,
          variables
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to queue email: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error queueing email:', error);
      return false;
    }
  }

  async processEmailQueue(): Promise<void> {
    // NOTE: This method needs direct DB access as it's called from a cron job
    // and actually sends emails. It should remain with DB access or be moved
    // to a separate service that runs with proper authentication.
    // For now, importing getPool only for this method
    const { getPool } = require('@/lib/db');
    
    try {
      const pool = await getPool();
      
      // Get pending emails that are ready to be sent
      const [emails] = await pool.execute<QueuedEmail[]>(
        `SELECT * FROM email_queue 
         WHERE status = 'pending' 
         AND next_retry_at <= NOW() 
         AND retry_count < 3 
         ORDER BY created_at ASC 
         LIMIT 10`
      );

      for (const email of emails) {
        try {
          // Send the email
          await this.transporter.sendMail({
            from: process.env.SMTP_FROM_ADDRESS,
            to: email.recipient_email,
            subject: email.subject,
            text: email.body,
            html: email.body.replace(/\n/g, '<br>'),
          });

          // Update email status to sent
          await pool.execute(
            `UPDATE email_queue 
             SET status = 'sent', 
                 sent_at = NOW(), 
                 updated_at = NOW() 
             WHERE email_id = ?`,
            [email.email_id]
          );
        } catch (error) {
          console.error(`Error sending email ${email.email_id}:`, error);

          // Update retry count and next retry time
          await pool.execute(
            `UPDATE email_queue 
             SET status = 'failed', 
                 retry_count = retry_count + 1,
                 next_retry_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
                 error_message = ?,
                 updated_at = NOW()
             WHERE email_id = ?`,
            [(error as Error).message, email.email_id]
          );
        }
      }

    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  // Helper methods for specific notifications
  async sendInstallationConfirmation(
    customerEmail: string,
    customerName: string,
    installationDate: Date,
    installationTime: string,
    installerName: string,
    installationAddress: string,
    specialInstructions: string
  ): Promise<boolean> {
    return this.queueEmail('installation_confirmation', customerEmail, customerName, {
      customer_name: customerName,
      installation_date: installationDate.toLocaleDateString(),
      installation_time: installationTime,
      installer_name: installerName,
      installation_address: installationAddress,
      special_instructions: specialInstructions,
    });
  }

  async sendConsultationConfirmation(
    customerEmail: string,
    customerName: string,
    expertName: string,
    consultationDate: Date,
    consultationTime: string,
    consultationType: string,
    meetingLink: string
  ): Promise<boolean> {
    return this.queueEmail('consultation_confirmation', customerEmail, customerName, {
      customer_name: customerName,
      expert_name: expertName,
      consultation_date: consultationDate.toLocaleDateString(),
      consultation_time: consultationTime,
      consultation_type: consultationType,
      meeting_link: meetingLink,
    });
  }

  async sendInstallationReminder(
    customerEmail: string,
    customerName: string,
    installationDate: Date,
    installationTime: string,
    installerName: string,
    installationAddress: string
  ): Promise<boolean> {
    return this.queueEmail('installation_reminder', customerEmail, customerName, {
      customer_name: customerName,
      installation_date: installationDate.toLocaleDateString(),
      installation_time: installationTime,
      installer_name: installerName,
      installation_address: installationAddress,
    });
  }

  async sendConsultationReminder(
    customerEmail: string,
    customerName: string,
    expertName: string,
    consultationDate: Date,
    consultationTime: string,
    consultationType: string,
    meetingLink: string
  ): Promise<boolean> {
    return this.queueEmail('consultation_reminder', customerEmail, customerName, {
      customer_name: customerName,
      expert_name: expertName,
      consultation_date: consultationDate.toLocaleDateString(),
      consultation_time: consultationTime,
      consultation_type: consultationType,
      meeting_link: meetingLink,
    });
  }

  // Send verification email when admin verifies a user
  async sendVerificationEmail(
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<boolean> {
    const { getPool } = require('@/lib/db');

    try {
      const pool = await getPool();

      // Get SMTP settings from database
      const [settings] = await pool.execute(
        `SELECT setting_key, setting_value FROM company_settings WHERE setting_key IN (
          'smtp_server', 'smtp_port', 'smtp_username', 'smtp_password',
          'contact_email', 'site_name'
        )`
      );

      const smtpConfig: any = {};
      (settings as any[]).forEach((row: any) => {
        smtpConfig[row.setting_key] = row.setting_value;
      });

      // Create transporter with database settings
      const transporter = nodemailer.createTransport({
        host: smtpConfig.smtp_server || 'localhost',
        port: parseInt(smtpConfig.smtp_port || '587'),
        secure: smtpConfig.smtp_port === '465',
        auth: smtpConfig.smtp_username && smtpConfig.smtp_password ? {
          user: smtpConfig.smtp_username,
          pass: smtpConfig.smtp_password,
        } : undefined,
      });

      const siteName = smtpConfig.site_name || 'Smart Blinds Hub';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartblindshub.com';

      // Create email HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${siteName}</h1>
            </div>
            <div class="content">
              <h2>Account Verified! 🎉</h2>
              <p>Hello ${userName},</p>
              <p>Great news! Your account has been verified and you now have full access to our platform.</p>
              <p><strong>Your Account Details:</strong></p>
              <ul>
                <li>Email: ${userEmail}</li>
                <li>Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</li>
                <li>Status: Verified ✓</li>
              </ul>
              <p>You can now log in and start using all features available to your account.</p>
              <a href="${siteUrl}/login" class="button">Log In Now</a>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The ${siteName} Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      await transporter.sendMail({
        from: `"${siteName}" <${smtpConfig.contact_email || 'noreply@smartblindshub.com'}>`,
        to: userEmail,
        subject: `Account Verified - Welcome to ${siteName}!`,
        html: html,
      });

      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  // Direct email sending method that uses database SMTP configuration
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<boolean> {
    const { getPool } = require('@/lib/db');

    try {
      const pool = await getPool();

      // Get SMTP settings from database
      const [settings] = await pool.execute(
        `SELECT setting_key, setting_value FROM company_settings WHERE setting_key IN (
          'smtp_server', 'smtp_port', 'smtp_username', 'smtp_password',
          'contact_email', 'site_name'
        )`
      );

      const smtpConfig: any = {};
      (settings as any[]).forEach((row: any) => {
        smtpConfig[row.setting_key] = row.setting_value;
      });

      // Create transporter with database settings
      const transporter = nodemailer.createTransport({
        host: smtpConfig.smtp_server || 'localhost',
        port: parseInt(smtpConfig.smtp_port || '587'),
        secure: smtpConfig.smtp_port === '465', // true for 465, false for other ports
        auth: smtpConfig.smtp_username && smtpConfig.smtp_password ? {
          user: smtpConfig.smtp_username,
          pass: smtpConfig.smtp_password,
        } : undefined,
      });

      // Send email
      const info = await transporter.sendMail({
        from: options.from || `"${smtpConfig.site_name || 'Smart Blinds Hub'}" <${smtpConfig.contact_email || 'sales@smartblindshub.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send order confirmation email
  async sendOrderConfirmation(orderData: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    totalAmount: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    shippingAddress: string;
  }): Promise<boolean> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${item.price}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 30px 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; }
          .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Order Confirmation</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your order!</p>
          </div>
          <div class="content">
            <p>Hi ${orderData.customerName},</p>
            <p>We've received your order and we're getting it ready! You'll receive regular email updates as your order progresses.</p>

            <div class="order-details">
              <h2 style="margin-top: 0; color: #DC2626;">Order #${orderData.orderNumber}</h2>
              <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
              <p><strong>Total Amount:</strong> ${orderData.totalAmount}</p>

              <h3 style="margin-top: 20px;">Items Ordered:</h3>
              <table>
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px; text-align: left;">Product</th>
                    <th style="padding: 12px; text-align: center;">Quantity</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <h3 style="margin-top: 20px;">Shipping Address:</h3>
              <p style="white-space: pre-line;">${orderData.shippingAddress}</p>
            </div>

            <div class="info-box">
              <p style="margin: 0;"><strong>📧 Regular Updates:</strong> You'll receive email notifications at every stage - from processing to shipping and delivery.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/account/orders" class="button">View Order Status</a>
            </div>

            <h3>What Happens Next?</h3>
            <ul>
              <li><strong>Processing:</strong> We're preparing your custom window treatments (typically 5-7 business days)</li>
              <li><strong>Shipping:</strong> You'll receive tracking information as soon as your order ships</li>
              <li><strong>Delivery:</strong> Your beautiful new blinds will arrive at your doorstep!</li>
            </ul>

            <h3>Need Help?</h3>
            <p>Contact us anytime:</p>
            <ul>
              <li><strong>Email:</strong> sales@smartblindshub.com</li>
              <li><strong>Phone:</strong> (316) 530-2635</li>
              <li><strong>Hours:</strong> Monday-Friday, 9AM-5PM EST</li>
            </ul>

            <p style="margin-top: 30px;">Thank you for choosing Smart Blinds Hub!</p>
            <p>Best regards,<br><strong>The Smart Blinds Hub Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Smart Blinds Hub. All rights reserved.</p>
            <p>This email was sent to ${orderData.customerEmail}</p>
            <p style="margin-top: 10px;">
              <a href="${siteUrl}/warranty" style="color: #DC2626; text-decoration: none;">Warranty Info</a> |
              <a href="${siteUrl}/account/returns" style="color: #DC2626; text-decoration: none;">Return Policy</a> |
              <a href="${siteUrl}/contact" style="color: #DC2626; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderNumber} - Smart Blinds Hub`,
      html: html
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService(); 