import { Twilio } from 'twilio';

// SMS service configuration
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient && twilioAccountSid && twilioAuthToken) {
    twilioClient = new Twilio(twilioAccountSid, twilioAuthToken);
  }
  return twilioClient;
}

export interface SMSMessage {
  to: string;
  message: string;
  type?: 'marketing' | 'transactional' | 'notification';
}

export interface SMSTemplate {
  cart_abandonment: (customerName: string, cartTotal: number) => string;
  order_confirmation: (orderNumber: string, total: number) => string;
  order_shipped: (orderNumber: string, trackingNumber?: string) => string;
  order_delivered: (orderNumber: string) => string;
  installation_reminder: (customerName: string, appointmentDate: string) => string;
  installation_confirmed: (customerName: string, appointmentDate: string, installerName: string) => string;
  price_drop_alert: (productName: string, oldPrice: number, newPrice: number) => string;
  back_in_stock: (productName: string) => string;
  promotion_alert: (discountPercentage: number, expiryHours: number) => string;
  measurement_reminder: (customerName: string) => string;
  review_request: (customerName: string, orderNumber: string) => string;
}

export const smsTemplates: SMSTemplate = {
  cart_abandonment: (customerName: string, cartTotal: number) =>
    `Hi ${customerName}! You left $${cartTotal.toFixed(2)} worth of window treatments in your cart. Complete your order now and get FREE shipping! Reply STOP to opt out.`,

  order_confirmation: (orderNumber: string, total: number) =>
    `Order confirmed! #${orderNumber} - $${total.toFixed(2)}. You'll receive shipping updates via SMS. Track your order at smartblindshub.com/orders`,

  order_shipped: (orderNumber: string, trackingNumber?: string) =>
    `Great news! Your order #${orderNumber} has shipped. ${trackingNumber ? `Track: ${trackingNumber}` : 'Tracking info coming soon.'}`,

  order_delivered: (orderNumber: string) =>
    `Your order #${orderNumber} has been delivered! Enjoy your new window treatments. Rate your experience: smartblindshub.com/review`,

  installation_reminder: (customerName: string, appointmentDate: string) =>
    `Hi ${customerName}, reminder: Your blind installation is scheduled for ${appointmentDate}. Our installer will contact you 30 minutes before arrival.`,

  installation_confirmed: (customerName: string, appointmentDate: string, installerName: string) =>
    `Hi ${customerName}, your installation appointment is confirmed for ${appointmentDate} with ${installerName}. They'll call 30 minutes before arrival.`,

  price_drop_alert: (productName: string, oldPrice: number, newPrice: number) =>
    `Price Alert! ${productName} dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}. Limited time offer - order now!`,

  back_in_stock: (productName: string) =>
    `Good news! ${productName} is back in stock. Get yours before they sell out again: smartblindshub.com`,

  promotion_alert: (discountPercentage: number, expiryHours: number) =>
    `Flash Sale! Get ${discountPercentage}% off all blinds for the next ${expiryHours} hours. Use code FLASH${discountPercentage}. Shop now!`,

  measurement_reminder: (customerName: string) =>
    `Hi ${customerName}, don't forget to measure your windows! Use our measurement guide: smartblindshub.com/measure or book a free consultation.`,

  review_request: (customerName: string, orderNumber: string) =>
    `Hi ${customerName}, how are your new blinds? We'd love your feedback on order #${orderNumber}: smartblindshub.com/review/${orderNumber}`
};

export class SMSService {
  private client: Twilio | null;

  constructor() {
    this.client = getTwilioClient();
  }

  async sendSMS(smsData: SMSMessage): Promise<boolean> {
    if (!this.client || !twilioPhoneNumber) {
      console.warn('SMS service not configured. Skipping SMS send.');
      return false;
    }

    try {
      // Validate phone number format
      const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
      const cleanPhone = smsData.to.replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        console.error('Invalid phone number format:', smsData.to);
        return false;
      }

      // Format phone number with country code
      const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

      const message = await this.client.messages.create({
        body: smsData.message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      });

      console.log('SMS sent successfully:', message.sid);
      
      // Log SMS for analytics (optional)
      await this.logSMS({
        sid: message.sid,
        to: formattedPhone,
        type: smsData.type || 'notification',
        status: 'sent',
        message: smsData.message
      });

      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  async sendCartAbandonmentSMS(customerName: string, phone: string, cartTotal: number): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.cart_abandonment(customerName, cartTotal),
      type: 'marketing'
    });
  }

  async sendOrderConfirmationSMS(phone: string, orderNumber: string, total: number): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.order_confirmation(orderNumber, total),
      type: 'transactional'
    });
  }

  async sendOrderShippedSMS(phone: string, orderNumber: string, trackingNumber?: string): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.order_shipped(orderNumber, trackingNumber),
      type: 'transactional'
    });
  }

  async sendInstallationReminderSMS(customerName: string, phone: string, appointmentDate: string): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.installation_reminder(customerName, appointmentDate),
      type: 'notification'
    });
  }

  async sendPriceDropAlertSMS(phone: string, productName: string, oldPrice: number, newPrice: number): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.price_drop_alert(productName, oldPrice, newPrice),
      type: 'marketing'
    });
  }

  async sendPromotionAlertSMS(phone: string, discountPercentage: number, expiryHours: number): Promise<boolean> {
    return this.sendSMS({
      to: phone,
      message: smsTemplates.promotion_alert(discountPercentage, expiryHours),
      type: 'marketing'
    });
  }

  private async logSMS(smsLog: {
    sid: string;
    to: string;
    type: string;
    status: string;
    message: string;
  }): Promise<void> {
    try {
      // Log to database for analytics and compliance
      // This would typically insert into an sms_logs table
      console.log('SMS Log:', smsLog);
    } catch (error) {
      console.error('Error logging SMS:', error);
    }
  }

  // Bulk SMS functionality for marketing campaigns
  async sendBulkSMS(recipients: string[], message: string, type: 'marketing' | 'notification' = 'marketing'): Promise<number> {
    let successCount = 0;
    
    for (const phone of recipients) {
      const success = await this.sendSMS({
        to: phone,
        message,
        type
      });
      
      if (success) successCount++;
      
      // Rate limiting: delay between messages to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return successCount;
  }

  // Check SMS delivery status
  async checkSMSStatus(messageSid: string): Promise<string | null> {
    if (!this.client) return null;

    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      console.error('Error checking SMS status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Helper function for opt-out management
export async function handleSMSOptOut(phone: string): Promise<void> {
  try {
    // Update user preferences to opt out of SMS
    // This would typically update a database record
    console.log(`Phone ${phone} opted out of SMS notifications`);
  } catch (error) {
    console.error('Error handling SMS opt-out:', error);
  }
}