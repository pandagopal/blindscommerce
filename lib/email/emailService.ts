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
}

// Export a singleton instance
export const emailService = new EmailService(); 