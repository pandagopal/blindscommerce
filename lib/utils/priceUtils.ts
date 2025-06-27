/**
 * Utility functions for handling price data from MySQL
 * MySQL returns DECIMAL values as strings, so we need to convert them to numbers
 */

/**
 * Parse a MySQL decimal value to a number
 * @param value - The value from MySQL (could be string, number, null, or undefined)
 * @returns A number or 0 if invalid
 */
export function parseDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse all price-related fields in an object
 * @param obj - The object containing price fields
 * @param fields - Array of field names to parse
 * @returns The object with parsed price fields
 */
export function parsePriceFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  if (!obj) return obj;
  
  const result = { ...obj };
  fields.forEach(field => {
    if (field in result) {
      result[field] = parseDecimal(result[field]);
    }
  });
  
  return result;
}

/**
 * Parse all common price fields in a product object
 */
export function parseProductPrices<T extends Record<string, any>>(product: T): T {
  return parsePriceFields(product, [
    'base_price',
    'vendor_price',
    'effective_price',
    'sale_price',
    'cost_price',
    'discount_value',
    'avg_rating',
    'rating',
    'price_per_sqft',
    'customer_price',
    'final_price',
    'price_adjustment',
    'shipping_cost',
    'tax_amount',
    'total_amount',
    'subtotal',
    'discount_amount',
    'minimum_price',
    'maximum_price'
  ]);
}

/**
 * Parse all price fields in an array of objects
 */
export function parseArrayPrices<T extends Record<string, any>>(
  items: T[],
  fields?: (keyof T)[]
): T[] {
  if (!items || !Array.isArray(items)) return items || [];
  
  return items.map(item => 
    fields ? parsePriceFields(item, fields) : parseProductPrices(item)
  );
}

/**
 * Format a price for display
 * @param price - The price to format
 * @param currency - Currency symbol (default: $)
 * @returns Formatted price string
 */
export function formatPrice(price: number | string, currency: string = '$'): string {
  const numPrice = parseDecimal(price);
  return `${currency}${numPrice.toFixed(2)}`;
}

/**
 * Calculate price based on dimensions and price per square foot
 */
export function calculateDimensionPrice(
  width: number,
  height: number,
  pricePerSqFt: number,
  basePrice: number = 0
): number {
  const sqft = (width * height) / 144; // Convert square inches to square feet
  return basePrice + (sqft * pricePerSqFt);
}