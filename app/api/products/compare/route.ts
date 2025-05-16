import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const ProductIdsSchema = z.object({
  productIds: z.array(z.string()).min(2, 'Compare at least 2 products').max(4, 'Cannot compare more than 4 products')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productIds } = ProductIdsSchema.parse(body);

    // Fetch detailed product information for comparison
    const products = await db.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        rating: true,
        primaryImage: true,
        features: {
          select: {
            name: true,
            description: true
          }
        },
        specifications: {
          select: {
            name: true,
            value: true
          }
        },
        materials: {
          select: {
            name: true,
            description: true
          }
        },
        dimensions: true,
        warranty: true,
        energyEfficiency: true
      }
    });

    // Transform specifications into a more comparison-friendly format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      rating: product.rating,
      image: product.primaryImage,
      features: product.features,
      specifications: product.specifications.reduce((acc, spec) => ({
        ...acc,
        [spec.name]: spec.value
      }), {}),
      materials: product.materials,
      dimensions: product.dimensions,
      warranty: product.warranty,
      energyEfficiency: product.energyEfficiency
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error comparing products:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get frequently compared products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Find products that are frequently compared with the given product
    const frequentlyCompared = await db.productComparison.findMany({
      where: {
        OR: [
          { productId1: productId },
          { productId2: productId }
        ]
      },
      orderBy: {
        count: 'desc'
      },
      take: 3,
      select: {
        product1: {
          select: {
            id: true,
            name: true,
            price: true,
            primaryImage: true
          }
        },
        product2: {
          select: {
            id: true,
            name: true,
            price: true,
            primaryImage: true
          }
        }
      }
    });

    // Transform the data to return only the compared products
    const comparedProducts = frequentlyCompared.map(comparison => {
      const comparedProduct = comparison.product1.id === productId
        ? comparison.product2
        : comparison.product1;
      return comparedProduct;
    });

    return NextResponse.json({
      success: true,
      comparedProducts
    });
  } catch (error) {
    console.error('Error fetching frequently compared products:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 