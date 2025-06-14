/**
 * Vendor Discount Helper Utilities
 * Provides safe data handling for vendor discount operations
 */

/**
 * Safely parse JSON string with fallback
 */
export function parseJsonSafely<T = any>(
  jsonString: string | null | undefined, 
  defaultValue: T | null = null
): T | null {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Invalid JSON string:', jsonString, error);
    return defaultValue;
  }
}

/**
 * Safely stringify JSON with error handling
 */
export function stringifyJsonSafely(data: any): string | null {
  if (data === null || data === undefined) return null;
  
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify data:', data, error);
    return null;
  }
}

/**
 * Parse vendor discount from database
 */
export function parseVendorDiscount(discount: any) {
  if (!discount) return null;

  return {
    ...discount,
    volume_tiers: parseJsonSafely(discount.volume_tiers, []),
    target_ids: parseJsonSafely(discount.target_ids, []),
    customer_types: parseJsonSafely(discount.customer_types, []),
    customer_groups: parseJsonSafely(discount.customer_groups, []),
    allowed_regions: parseJsonSafely(discount.allowed_regions, []),
    excluded_regions: parseJsonSafely(discount.excluded_regions, []),
  };
}

/**
 * Parse vendor coupon from database
 */
export function parseVendorCoupon(coupon: any) {
  if (!coupon) return null;

  return {
    ...coupon,
    target_ids: parseJsonSafely(coupon.target_ids, []),
    excluded_ids: parseJsonSafely(coupon.excluded_ids, []),
    customer_types: parseJsonSafely(coupon.customer_types, []),
    customer_groups: parseJsonSafely(coupon.customer_groups, []),
    allowed_regions: parseJsonSafely(coupon.allowed_regions, []),
    excluded_regions: parseJsonSafely(coupon.excluded_regions, []),
  };
}

/**
 * Validate required discount fields
 */
export function validateDiscountData(discount: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!discount) {
    errors.push('Discount data is required');
    return { isValid: false, errors };
  }

  if (!discount.discount_name?.trim()) {
    errors.push('Discount name is required');
  }

  if (!discount.discount_type) {
    errors.push('Discount type is required');
  }

  if (!discount.valid_from) {
    errors.push('Valid from date is required');
  }

  if (discount.discount_type !== 'tiered' && 
      (discount.discount_value === null || discount.discount_value === undefined)) {
    errors.push('Discount value is required for non-tiered discounts');
  }

  if (discount.discount_type === 'tiered' && 
      (!discount.volume_tiers || !Array.isArray(discount.volume_tiers) || discount.volume_tiers.length === 0)) {
    errors.push('Volume tiers are required for tiered discounts');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required coupon fields
 */
export function validateCouponData(coupon: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!coupon) {
    errors.push('Coupon data is required');
    return { isValid: false, errors };
  }

  if (!coupon.coupon_code?.trim()) {
    errors.push('Coupon code is required');
  }

  if (!coupon.coupon_name?.trim()) {
    errors.push('Coupon name is required');
  }

  if (!coupon.discount_type) {
    errors.push('Discount type is required');
  }

  if (coupon.discount_value === null || coupon.discount_value === undefined) {
    errors.push('Discount value is required');
  }

  if (!coupon.valid_from) {
    errors.push('Valid from date is required');
  }

  // Validate coupon code format
  if (coupon.coupon_code && !/^[A-Za-z0-9_-]+$/.test(coupon.coupon_code)) {
    errors.push('Coupon code can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Safe array access with default
 */
export function safeArrayAccess<T>(arr: T[] | null | undefined, index: number, defaultValue: T | null = null): T | null {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index] ?? defaultValue;
}

/**
 * Get vendor name safely from items
 */
export function getVendorNameFromItems(items: any[]): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  
  const firstItem = items[0];
  return firstItem?.vendor_name ?? null;
}

/**
 * Calculate safe percentage
 */
export function calculatePercentage(value: number, percentage: number, maxDecimals: number = 2): number {
  if (!isFinite(value) || !isFinite(percentage)) {
    return 0;
  }
  
  const result = value * (percentage / 100);
  return Math.round(result * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
}

/**
 * Ensure number is within bounds
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (!isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Format discount value for display
 */
export function formatDiscountValue(discount: any): string {
  if (!discount) return 'N/A';

  try {
    if (discount.volume_tiers && Array.isArray(discount.volume_tiers) && discount.volume_tiers.length > 0) {
      return 'Tiered';
    }
    
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value ?? 0}%`;
    } else if (discount.discount_type === 'fixed_amount') {
      return `$${discount.discount_value ?? 0}`;
    } else if (discount.discount_type === 'free_shipping') {
      return 'Free Shipping';
    } else if (discount.discount_type === 'upgrade') {
      return 'Upgrade';
    }
    
    return String(discount.discount_value ?? 0);
  } catch (error) {
    console.error('Error formatting discount value:', error);
    return 'N/A';
  }
}