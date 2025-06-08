import { NextResponse } from 'next/server';
import { getPool, createRoomVisualization, getRoomVisualizations } from '@/lib/db';
import {
  processRoomImage,
  processProductImage,
  compositeImages,
  detectWindows,
  optimizeImageForWeb
} from '@/lib/utils/imageProcessing';
import { VisualizationRequestSchema, VisualizationResponseSchema } from './models';
import { getServerSession } from 'next-auth';

interface User {
  id: number;
  name: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as User;

    const body = await request.json();
    const validatedData = VisualizationRequestSchema.parse({
      ...body,
      userId: user.id
    });

    // Decode base64 room image
    const roomImageBuffer = Buffer.from(
      validatedData.roomImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    // Get product image
    const pool = await getPool();
    const [products] = await pool.execute(
      'SELECT primary_image, width, height FROM products WHERE product_id = ?',
      [validatedData.productId]
    );
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const product = products[0] as { primary_image: string; width: number; height: number };

    // Process images
    const processedRoomImage = await processRoomImage(roomImageBuffer);
    
    // Fetch and process product image
    const productImageResponse = await fetch(product.primary_image);
    const productImageBuffer = Buffer.from(await productImageResponse.arrayBuffer());
    const processedProductImage = await processProductImage(
      productImageBuffer,
      Math.round(processedRoomImage.width * 0.3)
    );

    let placement = validatedData.placement;
    if (!placement) {
      // If no placement provided, detect windows and use first one
      const windows = await detectWindows(processedRoomImage.buffer);
      if (windows.length > 0) {
        placement = {
          x: windows[0].x,
          y: windows[0].y,
          width: product.width,
          height: product.height,
          scale: 1,
          rotation: 0
        };
      } else {
        // Default to center if no windows detected
        placement = {
          x: (processedRoomImage.width - processedProductImage.width) / 2,
          y: (processedRoomImage.height - processedProductImage.height) / 2,
          width: product.width,
          height: product.height,
          scale: 1,
          rotation: 0
        };
      }
    }

    // Composite images with accurate product dimensions
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
    const resultImageBase64 = `data:image/jpeg;base64,${optimizedResult.toString('base64')}`;

    // Save visualization to database
    const visualization = await createRoomVisualization(
      validatedData.userId,
      validatedData.productId,
      validatedData.roomImage,
      resultImageBase64
    );

    // Format response according to schema
    const response = VisualizationResponseSchema.parse({
      id: visualization.id,
      roomImage: visualization.roomImage,
      resultImage: visualization.resultImage,
      productId: visualization.productId,
      userId: visualization.userId,
      placement: visualization.placement,
      createdAt: visualization.created_at.toISOString(),
      updatedAt: visualization.updated_at.toISOString()
    });

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error processing room visualization:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

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

    const visualizations = await getRoomVisualizations(parseInt(userId, 10));

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