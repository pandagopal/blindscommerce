import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { emailService } from '@/lib/services/singletons';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      serviceType,
      preferredDate,
      alternateDate,
      notes
    } = data;

    // Insert into measurement_requests table
    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO measurement_requests (
        user_id, property_address, preferred_date, contact_phone, 
        special_instructions, status, created_at
      ) VALUES (
        NULL, ?, ?, ?, ?, 'pending', NOW()
      )`,
      [
        `${address}, ${city}, ${state} ${zip}`,
        preferredDate || null,
        phone,
        `Service Type: ${serviceType}\nAlternate Date: ${alternateDate || 'None'}\nNotes: ${notes || 'None'}\nName: ${firstName} ${lastName}\nEmail: ${email}`
      ]
    );

    const requestId = (result as any).insertId;

    // Try to send emails but don't fail the request if email sending fails
    try {
      // Send confirmation email to customer
      await emailService.sendEmail({
      to: email,
      subject: 'Appointment Request Received - Smart Blinds Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Appointment Request Confirmation</h2>
          
          <p>Dear ${firstName} ${lastName},</p>
          
          <p>Thank you for requesting a ${serviceType === 'measuring' ? 'measuring' : serviceType === 'installation' ? 'installation' : 'measuring and installation'} service appointment with Smart Blinds Hub.</p>
          
          <h3>Your Request Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Service Type:</strong> ${serviceType === 'measuring' ? 'Measuring Service' : serviceType === 'installation' ? 'Installation Service' : 'Both Services'}</li>
            <li><strong>Preferred Date:</strong> ${preferredDate ? new Date(preferredDate).toLocaleDateString() : 'Not specified'}</li>
            ${alternateDate ? `<li><strong>Alternate Date:</strong> ${new Date(alternateDate).toLocaleDateString()}</li>` : ''}
            <li><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            ${notes ? `<li><strong>Additional Notes:</strong> ${notes}</li>` : ''}
          </ul>
          
          <p>We will contact you within 24 hours to confirm your appointment time and provide any additional information needed.</p>
          
          <p>If you have any questions in the meantime, please don't hesitate to contact us at (316) 530-2635 or reply to this email.</p>
          
          <p>Best regards,<br>
          Smart Blinds Hub Team</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">This email was sent from Smart Blinds Hub. If you did not request this appointment, please contact us immediately.</p>
        </div>
      `
    });

    // Get sales email from settings
    const [emailSettings] = await pool.execute(
      `SELECT setting_value FROM company_settings WHERE setting_key = 'sales_email'`
    );
    const salesEmail = (emailSettings as any)[0]?.setting_value?.replace(/"/g, '') || 'sales@smartblindshub.com';

    // Send notification email to sales team
    await emailService.sendEmail({
      to: salesEmail,
      subject: `New ${serviceType} Appointment Request - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">New Appointment Request</h2>
          
          <p>A new ${serviceType} service appointment has been requested.</p>
          
          <h3>Customer Information:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${firstName} ${lastName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</li>
          </ul>
          
          <h3>Service Request:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Service Type:</strong> ${serviceType === 'measuring' ? 'Measuring Service' : serviceType === 'installation' ? 'Installation Service' : 'Both Services'}</li>
            <li><strong>Preferred Date:</strong> ${preferredDate ? new Date(preferredDate).toLocaleDateString() : 'Not specified'}</li>
            ${alternateDate ? `<li><strong>Alternate Date:</strong> ${new Date(alternateDate).toLocaleDateString()}</li>` : ''}
            ${notes ? `<li><strong>Additional Notes:</strong> ${notes}</li>` : ''}
          </ul>
          
          <h3>Action Required:</h3>
          <p>Please contact the customer within 24 hours to confirm the appointment.</p>
          
          <p><strong>Request ID:</strong> #${requestId}</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated notification from the Smart Blinds Hub system.</p>
        </div>
      `
    });
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Continue - the appointment was still saved successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        message: 'Appointment request received successfully'
      }
    });

  } catch (error) {
    console.error('Error processing appointment request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process appointment request'
      },
      { status: 500 }
    );
  }
}