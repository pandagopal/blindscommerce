import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const CSV_TEMPLATE_HEADERS = [
  'name',
  'sku',
  'description',
  'short_description',
  'category_name',
  'brand_name',
  'base_price',
  'sale_price',
  'cost_price',
  'weight',
  'width',
  'height',
  'depth',
  'material',
  'color',
  'finish',
  'is_active',
  'is_featured',
  'stock_quantity',
  'low_stock_threshold',
  'allow_backorder',
  'meta_title',
  'meta_description',
  'tags',
  'image_urls',
  'room_types',
  'mount_types',
  'control_types',
  'light_filtering',
  'energy_efficiency',
  'child_safety_certified',
  'warranty_years',
  'custom_width_min',
  'custom_width_max',
  'custom_height_min',
  'custom_height_max',
  'notes'
];

const SAMPLE_DATA = [
  [
    'Premium Wood Horizontal Blinds',
    'PWB-001',
    'Beautiful premium wood horizontal blinds perfect for living rooms and bedrooms. Made from sustainably sourced hardwood with multiple finish options.',
    'Premium wood horizontal blinds with multiple finish options',
    'Wood Blinds',
    'Premium Blinds Co',
    '129.99',
    '109.99',
    '65.00',
    '5.2',
    '48',
    '36',
    '2',
    'Oak Wood',
    'Natural',
    'Satin',
    'TRUE',
    'TRUE',
    '50',
    '10',
    'FALSE',
    'Premium Wood Horizontal Blinds - Natural Oak Finish',
    'Beautiful premium wood horizontal blinds perfect for any room. Sustainably sourced hardwood.',
    'wood,horizontal,premium,oak,natural',
    'https://example.com/images/pwb-001-1.jpg,https://example.com/images/pwb-001-2.jpg',
    'living-room,bedroom,dining-room',
    'inside,outside',
    'cordless,motorized',
    'light-filtering',
    'medium',
    'TRUE',
    '5',
    '12',
    '96',
    '12',
    '108',
    'Available in custom sizes. Professional installation recommended.'
  ],
  [
    'Cellular Honeycomb Shades',
    'CHS-002',
    'Energy-efficient cellular honeycomb shades that provide excellent insulation and light control. Perfect for any window.',
    'Energy-efficient cellular shades with superior insulation',
    'Cellular Shades',
    'EcoShade',
    '89.99',
    '',
    '45.00',
    '2.1',
    '36',
    '48',
    '1.5',
    'Polyester',
    'White',
    'Matte',
    'TRUE',
    'FALSE',
    '75',
    '15',
    'TRUE',
    'Cellular Honeycomb Shades - Energy Efficient Window Treatment',
    'Energy-efficient cellular honeycomb shades for superior insulation and light control.',
    'cellular,honeycomb,energy-efficient,insulation',
    'https://example.com/images/chs-002-1.jpg',
    'bedroom,kitchen,bathroom',
    'inside',
    'cordless,top-down-bottom-up',
    'blackout,light-filtering',
    'high',
    'TRUE',
    '3',
    '10',
    '72',
    '10',
    '84',
    'Single and double cell options available.'
  ]
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Create CSV content
    const csvContent = [
      CSV_TEMPLATE_HEADERS.join(','),
      ...SAMPLE_DATA.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    const response = new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="product-import-template.csv"',
      },
    });

    return response;

  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}