import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  processRoomImage,
  processProductImage,
  compositeImages,
  detectWindows,
  optimizeImageForWeb
} from '@/lib/utils/imageProcessing';

const VisualizationRequestSchema = z.object({
  roomImage: z.string(), // Base64 encoded image
  productId: z.string(),
  userId: z.string(),
  placement: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number().optional(),
    rotation: z.number().optional()
  }).optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = VisualizationRequestSchema.parse(body);

    // Decode base64 room image
    const roomImageBuffer = Buffer.from(
      validatedData.roomImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    // Get product image
    const product = await db.product.findUnique({
      where: { id: validatedData.productId },
      select: { primaryImage: true }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Process images
    const processedRoomImage = await processRoomImage(roomImageBuffer);
    
    // Fetch product image (assuming it's stored as a URL)
    const productImageResponse = await fetch(product.primaryImage);
    const productImageBuffer = Buffer.from(await productImageResponse.arrayBuffer());
    const processedProductImage = await processProductImage(
      productImageBuffer,
      Math.round(processedRoomImage.width * 0.3) // Product takes up ~30% of room width
    );

    let placement = validatedData.placement;
    if (!placement) {
      // If no placement provided, detect windows and use first one
      const windows = await detectWindows(processedRoomImage.buffer);
      if (windows.length > 0) {
        placement = {
          x: windows[0].x,
          y: windows[0].y,
          scale: 1,
          rotation: 0
        };
      } else {
        // Default to center if no windows detected
        placement = {
          x: (processedRoomImage.width - processedProductImage.width) / 2,
          y: (processedRoomImage.height - processedProductImage.height) / 2,
          scale: 1,
          rotation: 0
        };
      }
    }

    // Composite images
    const compositeResult = await compositeImages(
      processedRoomImage,
      processedProductImage,
      placement.x,
      placement.y,
      placement.scale,
      placement.rotation
    );

    // Optimize for web
    const optimizedResult = await optimizeImageForWeb(compositeResult);

    // Save visualization to database
    const visualization = await db.roomVisualization.create({
      data: {
        userId: validatedData.userId,
        productId: validatedData.productId,
        roomImage: validatedData.roomImage,
        resultImage: `data:image/jpeg;base64,${optimizedResult.toString('base64')}`
      }
    });

    return NextResponse.json({
      success: true,
      visualization: {
        id: visualization.id,
        resultImage: visualization.resultImage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing room visualization:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get saved visualizations for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const visualizations = await db.roomVisualization.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        resultImage: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      visualizations
    });
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 