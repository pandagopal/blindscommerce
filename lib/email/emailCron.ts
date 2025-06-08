import cron from 'node-cron';
import { emailService } from './emailService';
import { getPool } from '@/lib/db';

// Process email queue every minute
cron.schedule('* * * * *', async () => {
  console.log('Processing email queue...');
  await emailService.processEmailQueue();
});

// Send reminders for tomorrow's installations and consultations
cron.schedule('0 9 * * *', async () => {
  console.log('Sending reminders for tomorrow...');
  const pool = await getPool();

  try {
    // Get tomorrow's installations
    const installations = await pool.query(
      `SELECT 
        ib.booking_id,
        u.email as customer_email,
        u.first_name || ' ' || u.last_name as customer_name,
        i.first_name || ' ' || i.last_name as installer_name,
        ib.date,
        ib.time_slot,
        ib.address_line1 || 
        COALESCE(', ' || ib.address_line2, '') || 
        ', ' || ib.city || 
        ', ' || ib.state || 
        ' ' || ib.postal_code as installation_address
      FROM installation_bookings ib
      JOIN users u ON ib.user_id = u.user_id
      JOIN installers i ON ib.installer_id = i.installer_id
      WHERE ib.date = CURRENT_DATE + INTERVAL '1 day'
      AND ib.status = 'scheduled'`
    );

    // Send installation reminders
    for (const installation of installations.rows) {
      await emailService.sendInstallationReminder(
        installation.customer_email,
        installation.customer_name,
        installation.date,
        installation.time_slot,
        installation.installer_name,
        installation.installation_address
      );
    }

    // Get tomorrow's consultations
    const consultations = await pool.query(
      `SELECT 
        cb.booking_id,
        u.email as customer_email,
        u.first_name || ' ' || u.last_name as customer_name,
        e.first_name || ' ' || e.last_name as expert_name,
        cb.date,
        cb.time_slot,
        cb.consultation_type,
        cb.meeting_link
      FROM consultation_bookings cb
      JOIN users u ON cb.user_id = u.user_id
      JOIN experts e ON cb.expert_id = e.expert_id
      WHERE cb.date = CURRENT_DATE + INTERVAL '1 day'
      AND cb.status = 'scheduled'`
    );

    // Send consultation reminders
    for (const consultation of consultations.rows) {
      await emailService.sendConsultationReminder(
        consultation.customer_email,
        consultation.customer_name,
        consultation.expert_name,
        consultation.date,
        consultation.time_slot,
        consultation.consultation_type,
        consultation.meeting_link
      );
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}); 