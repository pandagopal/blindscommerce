import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock security alerts data
    // In a real system, this would come from a security monitoring system
    const alerts = [
      {
        id: 1,
        type: 'login_attempt',
        message: 'Multiple failed login attempts from IP 192.168.1.100',
        timestamp: '2 hours ago',
        severity: 'medium',
        resolved: false
      },
      {
        id: 2,
        type: 'suspicious_activity',
        message: 'Unusual API usage pattern detected for user ID 1847',
        timestamp: '4 hours ago',
        severity: 'low',
        resolved: false
      },
      {
        id: 3,
        type: 'system_error',
        message: 'Database connection timeout in payment processing',
        timestamp: '6 hours ago',
        severity: 'high',
        resolved: true
      },
      {
        id: 4,
        type: 'permission_violation',
        message: 'User attempted to access admin panel without permissions',
        timestamp: '8 hours ago',
        severity: 'medium',
        resolved: true
      },
      {
        id: 5,
        type: 'login_attempt',
        message: 'Successful login from new device for admin user',
        timestamp: '1 day ago',
        severity: 'low',
        resolved: true
      }
    ];

    return NextResponse.json({ alerts });

  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    );
  }
}