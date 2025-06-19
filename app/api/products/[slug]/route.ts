import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug, getProductsBySlugPattern, getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    
    // Check if this is a configure request
    const isConfigureRequest = url.searchParams.get('configure') === 'true';
    
    if (isConfigureRequest) {
      // Get single product with all configuration data for configurator
      const product = await getProductBySlug(slug);
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Get additional configuration data
      const pool = await getPool();
      
      // Get fabric options
      const [fabricRows] = await pool.execute(
        `SELECT fabric_option_id, fabric_type, fabric_name, description, is_enabled
         FROM product_fabric_options 
         WHERE product_id = ? AND is_enabled = 1
         ORDER BY fabric_type, fabric_name`,
        [product.product_id]
      );
      
      // Get pricing matrix
      const [pricingRows] = await pool.execute(
        `SELECT width_min, width_max, height_min, height_max, base_price, price_per_sqft
         FROM product_pricing_matrix 
         WHERE product_id = ?
         ORDER BY width_min, height_min`,
        [product.product_id]
      );

      // Get fabric pricing
      const [fabricPricingRows] = await pool.execute(
        `SELECT fabric_option_id, min_width, max_width, price_per_sqft
         FROM product_fabric_pricing 
         WHERE product_id = ? AND is_active = 1
         ORDER BY fabric_option_id, min_width`,
        [product.product_id]
      );

      // Dimensions are already in the product object from getProductBySlug
      // No need for additional query since custom_width_min, custom_width_max, etc. are already fetched
      
      // Parse control types
      const controlTypes = product.control_types ? parseControlTypes(product.control_types) : {};
      
      // Parse mount types
      const mountTypes = product.mount_types ? product.mount_types.split(',').map((mt: string) => mt.trim()) : [];
      
      const configuredProduct = {
        ...product,
        fabricOptions: fabricRows,
        pricingMatrix: pricingRows,
        fabricPricing: fabricPricingRows,
        mountTypes: mountTypes,
        controlTypes: controlTypes,
        dimensions: {
          minWidth: product.custom_width_min ? parseFloat(product.custom_width_min) : null,
          maxWidth: product.custom_width_max ? parseFloat(product.custom_width_max) : null,
          minHeight: product.custom_height_min ? parseFloat(product.custom_height_min) : null,
          maxHeight: product.custom_height_max ? parseFloat(product.custom_height_max) : null,
        }
      };
      
      return NextResponse.json({ 
        product: configuredProduct
      }, { status: 200 });
    }
    
    // For all other requests, use the existing logic
    const products = await getProductsBySlugPattern(slug);
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }
    
    // Check if we should show single product view or multiple products view
    // Only show single product if there's exactly one product and it's an exact slug match
    const exactMatch = products.find(p => p.slug === slug);
    const shouldShowSingle = products.length === 1 || (exactMatch && products.length === 1);
    
    // For category-like slugs (roller-blinds, vertical-blinds), always show multiple if more than 1 exists
    const isCategorySlug = slug.includes('-') && (slug.includes('blind') || slug.includes('shade') || slug.includes('shutter'));
    
    return NextResponse.json({ 
      products,
      count: products.length,
      isMultiple: isCategorySlug ? products.length > 1 : !shouldShowSingle,
      searchTerm: slug,
      exactMatch: exactMatch ? exactMatch.slug : null
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Helper function to parse control types string
function parseControlTypes(controlTypesStr: string) {
  const controlTypes = {
    liftSystems: [] as Array<{name: string, price_adjustment: number, enabled: boolean}>,
    wandSystem: [] as Array<{name: string, price_adjustment: number, enabled: boolean}>,
    stringSystem: [] as Array<{name: string, price_adjustment: number, enabled: boolean}>,
    remoteControl: [] as Array<{name: string, price_adjustment: number, enabled: boolean}>
  };
  
  if (!controlTypesStr) return controlTypes;
  
  // Default pricing for control options (these should ideally come from database)
  const defaultPrices = {
    'Cordless': 0,
    'Continuous Loop': 25,
    'Standard Wand': 15,
    'Extended Wand': 30,
    'String Lift': 10,
    'Chain System': 20,
    'Basic Remote': 150,
    'Smart Home Compatible': 250
  };
  
  // Split by semicolon for different categories
  const categories = controlTypesStr.split(';');
  
  categories.forEach(category => {
    const types = category.split(',').map(t => t.trim());
    types.forEach(type => {
      const [system, value] = type.split(':');
      if (system && value && controlTypes[system as keyof typeof controlTypes]) {
        controlTypes[system as keyof typeof controlTypes].push({
          name: value,
          price_adjustment: defaultPrices[value as keyof typeof defaultPrices] || 0,
          enabled: true
        });
      }
    });
  });
  
  return controlTypes;
}
