import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Validation schema for shipping information
const ShippingInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code is required')
});

// Validation schema for swatch order
const SwatchOrderSchema = z.object({
  selectedSwatches: z.array(z.string()).min(1, 'Select at least one swatch'),
  shippingInfo: ShippingInfoSchema
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = SwatchOrderSchema.parse(body);

    // Create swatch order in database
    const order = await db.swatchOrder.create({
      data: {
        status: 'PENDING',
        ...validatedData.shippingInfo,
        swatches: {
          connect: validatedData.selectedSwatches.map(id => ({ id }))
        }
      }
    });

    // Send confirmation email
    // TODO: Implement email sending
    
    return NextResponse.json({
      success: true,
      message: 'Swatch order placed successfully',
      orderId: order.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing swatch order:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch available swatches
    const swatches = await db.swatch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
        material: true,
        image: true
      }
    });

    return NextResponse.json({
      success: true,
      swatches
    });
  } catch (error) {
    console.error('Error fetching swatches:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 