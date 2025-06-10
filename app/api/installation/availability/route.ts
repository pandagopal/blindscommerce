import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface TimeSlotRow extends RowDataPacket {
  slot_id: number;
  slot_name: string;
  slot_code: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  available_days: string;
  is_premium: boolean;
  premium_fee: number;
  max_concurrent_jobs: number;
}

interface TechnicianRow extends RowDataPacket {
  technician_id: number;
  first_name: string;
  last_name: string;
  skill_level: string;
  average_rating: number;
  primary_service_area_id: number;
  secondary_service_areas: string | null;
  max_jobs_per_day: number;
}

interface AvailabilityRow extends RowDataPacket {
  technician_id: number;
  availability_date: string;
  time_slot_id: number;
  is_available: boolean;
  unavailable_reason: string | null;
  custom_start_time: string | null;
  custom_end_time: string | null;
  max_jobs_override: number | null;
}

interface AppointmentCountRow extends RowDataPacket {
  appointment_date: string;
  time_slot_id: number;
  technician_id: number;
  appointment_count: number;
}

// GET /api/installation/availability - Check installation availability
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const postalCode = searchParams.get('postal_code');
    const state = searchParams.get('state');
    const installationType = searchParams.get('installation_type') || 'installation';
    const estimatedDuration = parseFloat(searchParams.get('estimated_duration') || '2.0');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Limit date range
    const maxDays = 60;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxDays} days` },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Find service area based on location
    let serviceAreaId = null;
    if (state) {
      const [serviceAreas] = await pool.execute<RowDataPacket[]>(
        `SELECT area_id FROM installation_service_areas 
         WHERE JSON_CONTAINS(states_provinces, ?) AND is_active = TRUE 
         ORDER BY area_id LIMIT 1`,
        [JSON.stringify(state)]
      );

      if (serviceAreas.length > 0) {
        serviceAreaId = serviceAreas[0].area_id;
      }
    }

    if (!serviceAreaId) {
      return NextResponse.json(
        { error: 'Installation service not available in your area' },
        { status: 400 }
      );
    }

    // Get active time slots
    const [timeSlots] = await pool.execute<TimeSlotRow[]>(
      `SELECT slot_id, slot_name, slot_code, start_time, end_time, duration_hours,
              available_days, is_premium, premium_fee, max_concurrent_jobs
       FROM installation_time_slots 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC, start_time ASC`
    );

    // Get available technicians in the service area
    const [technicians] = await pool.execute<TechnicianRow[]>(
      `SELECT technician_id, first_name, last_name, skill_level, average_rating,
              primary_service_area_id, secondary_service_areas, max_jobs_per_day
       FROM installation_technicians 
       WHERE (primary_service_area_id = ? 
              OR JSON_CONTAINS(COALESCE(secondary_service_areas, '[]'), ?))
       AND is_active = TRUE AND availability_status = 'available'`,
      [serviceAreaId, JSON.stringify(serviceAreaId)]
    );

    if (technicians.length === 0) {
      return NextResponse.json(
        { error: 'No technicians available in your area' },
        { status: 400 }
      );
    }

    // Get technician availability for the date range
    const technicianIds = technicians.map(t => t.technician_id);
    const [availabilityData] = await pool.execute<AvailabilityRow[]>(
      `SELECT technician_id, availability_date, time_slot_id, is_available,
              unavailable_reason, custom_start_time, custom_end_time, max_jobs_override
       FROM technician_availability 
       WHERE technician_id IN (${technicianIds.map(() => '?').join(',')})
       AND availability_date BETWEEN ? AND ?`,
      [...technicianIds, startDate, endDate]
    );

    // Get existing appointments for capacity calculation
    const [appointmentCounts] = await pool.execute<AppointmentCountRow[]>(
      `SELECT appointment_date, time_slot_id, assigned_technician_id as technician_id, 
              COUNT(*) as appointment_count
       FROM installation_appointments 
       WHERE assigned_technician_id IN (${technicianIds.map(() => '?').join(',')})
       AND appointment_date BETWEEN ? AND ?
       AND status IN ('scheduled', 'confirmed', 'in_progress')
       GROUP BY appointment_date, time_slot_id, assigned_technician_id`,
      [...technicianIds, startDate, endDate]
    );

    // Create lookup maps
    const availabilityMap = new Map<string, AvailabilityRow>();
    availabilityData.forEach(avail => {
      const key = `${avail.technician_id}-${avail.availability_date}-${avail.time_slot_id}`;
      availabilityMap.set(key, avail);
    });

    const appointmentCountMap = new Map<string, number>();
    appointmentCounts.forEach(count => {
      const key = `${count.technician_id}-${count.appointment_date}-${count.time_slot_id}`;
      appointmentCountMap.set(key, count.appointment_count);
    });

    // Generate availability for each date
    const availableSlots: any[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const daysFromToday = Math.ceil((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check minimum lead time (default 3 days)
      if (daysFromToday < 3) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      for (const slot of timeSlots) {
        const availableDays = JSON.parse(slot.available_days);
        
        // Check if slot is available on this day of week
        if (!availableDays.includes(dayOfWeek)) {
          continue;
        }

        // Check if slot duration can accommodate estimated duration
        if (slot.duration_hours < estimatedDuration) {
          continue;
        }

        // Find available technicians for this date/slot
        const availableTechnicians = [];
        
        for (const technician of technicians) {
          const availKey = `${technician.technician_id}-${dateStr}-${slot.slot_id}`;
          const countKey = `${technician.technician_id}-${dateStr}-${slot.slot_id}`;
          
          // Check explicit availability record
          const availRecord = availabilityMap.get(availKey);
          if (availRecord && !availRecord.is_available) {
            continue; // Technician explicitly unavailable
          }

          // Check current appointment count vs capacity
          const currentAppointments = appointmentCountMap.get(countKey) || 0;
          const maxJobs = availRecord?.max_jobs_override || technician.max_jobs_per_day;
          
          if (currentAppointments >= maxJobs) {
            continue; // Technician at capacity
          }

          // Check slot capacity
          if (currentAppointments >= slot.max_concurrent_jobs) {
            continue; // Slot at capacity
          }

          availableTechnicians.push({
            technicianId: technician.technician_id,
            name: `${technician.first_name} ${technician.last_name}`,
            skillLevel: technician.skill_level,
            rating: parseFloat(technician.average_rating.toString()),
            currentLoad: currentAppointments,
            maxCapacity: maxJobs
          });
        }

        if (availableTechnicians.length > 0) {
          availableSlots.push({
            date: dateStr,
            dayOfWeek,
            daysFromToday,
            slotId: slot.slot_id,
            slotName: slot.slot_name,
            slotCode: slot.slot_code,
            timeWindow: {
              start: slot.start_time,
              end: slot.end_time,
              duration: slot.duration_hours
            },
            isPremium: slot.is_premium,
            premiumFee: parseFloat(slot.premium_fee.toString()),
            availableTechnicians,
            totalCapacity: slot.max_concurrent_jobs,
            remainingCapacity: slot.max_concurrent_jobs - (appointmentCounts.find(c => 
              c.appointment_date === dateStr && c.time_slot_id === slot.slot_id
            )?.appointment_count || 0)
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = {
          date: slot.date,
          dayOfWeek: slot.dayOfWeek,
          daysFromToday: slot.daysFromToday,
          slots: []
        };
      }
      acc[slot.date].slots.push(slot);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      serviceArea: {
        id: serviceAreaId,
        installationType,
        estimatedDuration
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      availability: Object.values(slotsByDate),
      totalAvailableSlots: availableSlots.length,
      totalTechnicians: technicians.length
    });

  } catch (error) {
    console.error('Error checking installation availability:', error);
    return NextResponse.json(
      { error: 'Failed to check installation availability' },
      { status: 500 }
    );
  }
}