import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

interface Measurement {
  id: number;
  name: string;
  room: string;
  window_type: string;
  width: number;
  height: number;
  notes: string;
  created_at: string;
}

// Mock data for now - in a real app, this would come from the database
const mockMeasurements: Measurement[] = [
  {
    id: 1,
    name: 'Living Room Main Window',
    room: 'Living Room',
    window_type: 'Double-Hung',
    width: 36.5,
    height: 72.25,
    notes: 'Inside mount, old trim needs replacing',
    created_at: '2023-09-15T14:32:00Z'
  },
  {
    id: 2,
    name: 'Master Bedroom - North',
    room: 'Master Bedroom',
    window_type: 'Casement',
    width: 24.0,
    height: 48.0,
    notes: 'Outside mount preferred',
    created_at: '2023-09-10T10:15:00Z'
  },
  {
    id: 3,
    name: 'Kitchen Sink Window',
    room: 'Kitchen',
    window_type: 'Single-Hung',
    width: 30.25,
    height: 36.0,
    notes: 'Moisture concern, consider faux wood',
    created_at: '2023-09-05T16:45:00Z'
  },
  {
    id: 4,
    name: 'Home Office Window',
    room: 'Office',
    window_type: 'Picture Window',
    width: 60.0,
    height: 48.5,
    notes: 'Need blackout option for video meetings',
    created_at: '2023-09-02T09:30:00Z'
  },
  {
    id: 5,
    name: 'Guest Bathroom',
    room: 'Bathroom',
    window_type: 'Awning',
    width: 24.75,
    height: 18.5,
    notes: 'Privacy film needed',
    created_at: '2023-08-25T11:20:00Z'
  }
];

export async function GET(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('search') || '';
    const room = searchParams.get('room') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Filter measurements based on query parameters
    let filteredMeasurements = [...mockMeasurements];

    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredMeasurements = filteredMeasurements.filter(m =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.notes.toLowerCase().includes(lowerQuery) ||
        m.window_type.toLowerCase().includes(lowerQuery)
      );
    }

    if (room) {
      filteredMeasurements = filteredMeasurements.filter(m =>
        m.room.toLowerCase() === room.toLowerCase()
      );
    }

    // Sort measurements
    filteredMeasurements.sort((a, b) => {
      if (sort === 'name') {
        return order === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sort === 'room') {
        return order === 'asc'
          ? a.room.localeCompare(b.room)
          : b.room.localeCompare(a.room);
      } else if (sort === 'width') {
        return order === 'asc'
          ? a.width - b.width
          : b.width - a.width;
      } else if (sort === 'height') {
        return order === 'asc'
          ? a.height - b.height
          : b.height - a.height;
      } else {
        // Default sort by created_at
        return order === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Paginate results
    const total = filteredMeasurements.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedMeasurements = filteredMeasurements.slice(start, end);

    // Get unique rooms for filtering
    const uniqueRooms = Array.from(new Set(mockMeasurements.map(m => m.room)));

    return NextResponse.json({
      measurements: paginatedMeasurements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      rooms: uniqueRooms
    });

  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.room || !body.window_type || !body.width || !body.height) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, this would save to the database
    // For now, just simulate creating a new measurement
    const newMeasurement: Measurement = {
      id: mockMeasurements.length + 1,
      name: body.name,
      room: body.room,
      window_type: body.window_type,
      width: parseFloat(body.width),
      height: parseFloat(body.height),
      notes: body.notes || '',
      created_at: new Date().toISOString()
    };

    // In a real app, we would add to the database here
    // mockMeasurements.push(newMeasurement);

    return NextResponse.json({
      message: 'Measurement created successfully',
      measurement: newMeasurement
    });

  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get measurement ID from query parameters
    const measurementId = req.nextUrl.searchParams.get('id');

    if (!measurementId) {
      return NextResponse.json({ error: 'Measurement ID is required' }, { status: 400 });
    }

    // In a real app, this would delete from the database
    // For now, just simulate deletion by confirming it would work

    return NextResponse.json({
      message: 'Measurement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
