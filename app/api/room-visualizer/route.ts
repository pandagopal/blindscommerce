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
import { validateBase64Image, secureImageProcessing, IMAGE_LIMITS } from '@/lib/security/imageValidation';
import { apiRateLimiter } from '@/lib/security/validation';

interface User {
  id: number;
  name: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

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

    // Validate base64 image data first
    const base64Validation = validateBase64Image(validatedData.roomImage);
    if (!base64Validation.isValid) {
      return NextResponse.json(
        { success: false, message: `Invalid image data: ${base64Validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Decode base64 room image securely
    const roomImageBuffer = Buffer.from(base64Validation.cleanedData!, 'base64');
    
    // Comprehensive image validation
    const processedRoomData = await secureImageProcessing(roomImageBuffer);

    // Get product image with validation
    const pool = await getPool();
    const [products] = await pool.execute(
      'SELECT primary_image, width, height FROM products WHERE product_id = ? AND is_active = 1',
      [validatedData.productId]
    );
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const product = products[0] as { primary_image: string; width: number; height: number };

    // Validate product image URL to prevent SSRF
    const productImageUrl = new URL(product.primary_image);
    const allowedHosts = ['localhost', '127.0.0.1', process.env.NEXT_PUBLIC_APP_URL];
    const isLocalhost = productImageUrl.hostname === 'localhost' || productImageUrl.hostname === '127.0.0.1';
    const isAllowedHost = allowedHosts.some(host => host && productImageUrl.hostname.includes(host));
    
    if (!isLocalhost && !isAllowedHost && !productImageUrl.protocol.startsWith('https:')) {
      return NextResponse.json(
        { success: false, message: 'Invalid product image URL' },
        { status: 400 }
      );
    }

    // Process room image with validated data
    const processedRoomImage = await processRoomImage(processedRoomData.buffer);
    
    // Fetch and validate product image
    const productImageResponse = await fetch(product.primary_image, {
      headers: {
        'User-Agent': 'BlindCommerce/1.0',
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!productImageResponse.ok) {
      throw new Error(`Failed to fetch product image: ${productImageResponse.status}`);
    }
    
    const productImageBuffer = Buffer.from(await productImageResponse.arrayBuffer());
    
    // Validate product image
    const processedProductData = await secureImageProcessing(productImageBuffer);
    const processedProductImage = await processProductImage(
      processedProductData.buffer,
      Math.round(processedRoomImage.width * 0.3)
    );

    let placement = validatedData.placement;
    if (!placement) {
      // If no placement provided, detect windows and use first one
      // Limit window detection to prevent DoS
      const windows = await detectWindows(processedRoomImage.buffer, { maxWindows: 5 });
      if (windows.length > 0) {
        // Validate detected window coordinates
        const window = windows[0];
        placement = {
          x: Math.max(0, Math.min(window.x, processedRoomImage.width - 100)),
          y: Math.max(0, Math.min(window.y, processedRoomImage.height - 100)),
          width: Math.max(50, Math.min(product.width, 500)),
          height: Math.max(50, Math.min(product.height, 500)),
          scale: Math.max(0.1, Math.min(window.scale || 1, 3)),
          rotation: Math.max(-180, Math.min(window.rotation || 0, 180))
        };
      } else {
        // Default to center if no windows detected
        placement = {
          x: Math.max(0, (processedRoomImage.width - processedProductImage.width) / 2),
          y: Math.max(0, (processedRoomImage.height - processedProductImage.height) / 2),
          width: Math.max(50, Math.min(product.width, 500)),
          height: Math.max(50, Math.min(product.height, 500)),
          scale: 1,
          rotation: 0
        };
      }
    } else {
      // Validate user-provided placement to prevent malicious values
      placement = {
        x: Math.max(0, Math.min(placement.x, processedRoomImage.width)),
        y: Math.max(0, Math.min(placement.y, processedRoomImage.height)),
        width: Math.max(50, Math.min(placement.width, 1000)),
        height: Math.max(50, Math.min(placement.height, 1000)),
        scale: Math.max(0.1, Math.min(placement.scale, 5)),
        rotation: Math.max(-360, Math.min(placement.rotation, 360))
      };
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
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error processing room visualization:', error);
    } else {
      console.error('Room visualization processing failed');
    }
    
    if (error instanceof Error) {
      // Don't expose internal error details in production
      const publicMessage = process.env.NODE_ENV === 'production' 
        ? 'Image processing failed' 
        : error.message;
      
      return NextResponse.json(
        { success: false, message: publicMessage },
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