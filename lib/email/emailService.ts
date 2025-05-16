import nodemailer from 'nodemailer';
import { getPool } from '@/lib/db';

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
    const pool = await getPool();
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE name = $1 AND is_active = true',
      [templateName]
    );
    return result.rows[0] || null;
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
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the email template
      const template = await this.getTemplate(templateName);
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Replace variables in subject and body
      const subject = this.replaceVariables(template.subject, variables);
      const body = this.replaceVariables(template.body, variables);

      // Queue the email
      await client.query(
        `INSERT INTO email_queue (
          template_id,
          recipient_email,
          recipient_name,
          subject,
          body,
          variables,
          status,
          next_retry_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [
          template.template_id,
          recipientEmail,
          recipientName,
          subject,
          body,
          JSON.stringify(variables),
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error queueing email:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async processEmailQueue(): Promise<void> {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get pending emails that are ready to be sent
      const result = await client.query<QueuedEmail>(
        `SELECT * FROM email_queue 
         WHERE status = 'pending' 
         AND next_retry_at <= NOW() 
         AND retry_count < 3 
         ORDER BY created_at ASC 
         LIMIT 10`
      );

      for (const email of result.rows) {
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
          await client.query(
            `UPDATE email_queue 
             SET status = 'sent', 
                 sent_at = NOW(), 
                 updated_at = NOW() 
             WHERE email_id = $1`,
            [email.email_id]
          );
        } catch (error) {
          console.error(`Error sending email ${email.email_id}:`, error);

          // Update retry count and next retry time
          await client.query(
            `UPDATE email_queue 
             SET status = 'failed', 
                 retry_count = retry_count + 1,
                 next_retry_at = NOW() + INTERVAL '1 hour',
                 error_message = $2,
                 updated_at = NOW()
             WHERE email_id = $1`,
            [email.email_id, (error as Error).message]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing email queue:', error);
    } finally {
      client.release();
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
}

// Export a singleton instance
export const emailService = new EmailService(); 