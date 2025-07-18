import { z } from 'zod';

// Input sanitization utilities
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/'/g, "''") // Escape single quotes for SQL
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9@._-]/g, '') // Allow only valid email characters
    .substring(0, 255);
};

export const sanitizeNumeric = (input: any): number | null => {
  const num = Number(input);
  return isNaN(num) ? null : num;
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .transform(sanitizeEmail),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character')
});

export const registrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .transform(sanitizeEmail),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
    .transform(sanitizeString),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
    .transform(sanitizeString),
  phone: z.string()
    .optional()
    .refine((phone) => !phone || /^\+?[\d\s()-]{10,15}$/.test(phone), 
            'Invalid phone number format')
});

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().positive('Invalid product ID'),
    quantity: z.number().positive('Quantity must be positive').max(100, 'Quantity too large'),
    price: z.number().positive('Price must be positive').max(10000, 'Price too large'),
    options: z.record(z.any()).optional()
  })).min(1, 'Order must contain at least one item'),
  totalAmount: z.number().positive('Total amount must be positive').max(100000, 'Total amount too large'),
  shippingAddress: z.string().max(500, 'Address too long').transform(sanitizeString),
  billingAddress: z.string().max(500, 'Address too long').transform(sanitizeString),
  paymentMethod: z.string().max(50, 'Payment method too long').transform(sanitizeString),
  notes: z.string().max(1000, 'Notes too long').transform(sanitizeString).optional()
});

export const productSearchSchema = z.object({
  query: z.string()
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_.,]+$/, 'Search query contains invalid characters')
    .transform(sanitizeString),
  category: z.string().max(50, 'Category too long').transform(sanitizeString).optional(),
  minPrice: z.number().min(0, 'Price must be non-negative').max(10000, 'Price too large').optional(),
  maxPrice: z.number().min(0, 'Price must be non-negative').max(10000, 'Price too large').optional(),
  page: z.number().min(1, 'Page must be positive').max(1000, 'Page number too large').optional(),
  limit: z.number().min(1, 'Limit must be positive').max(100, 'Limit too large').optional()
});

// File upload validation
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB for images
  const maxPdfSize = 10 * 1024 * 1024; // 10MB for PDFs
  
  // Validate MIME type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed. Only JPEG, PNG, WebP, and PDF are supported.' };
  }
  
  // Validate file size based on type
  const sizeLimit = file.type === 'application/pdf' ? maxPdfSize : maxSize;
  if (file.size > sizeLimit) {
    return { isValid: false, error: `File size too large. Maximum size is ${sizeLimit / (1024 * 1024)}MB.` };
  }
  
  // Extract actual file extension
  const fileName = file.name.toLowerCase();
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { isValid: false, error: 'File must have an extension.' };
  }
  
  const fileExtension = fileName.substring(lastDotIndex);
  
  // Map allowed MIME types to expected extensions
  const allowedExtensions: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf']
  };
  
  // Validate that extension matches MIME type
  const expectedExtensions = allowedExtensions[file.type];
  if (!expectedExtensions || !expectedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'File extension does not match file type.' };
  }
  
  // Check for double extensions or dangerous patterns
  const dangerousPatterns = [
    /\.(php|js|html|htm|exe|bat|cmd|sh|asp|aspx|jsp|cgi)/i,
    /\.(jpg|jpeg|png|webp|pdf)\.(php|js|html|htm|exe|bat|cmd|sh)/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      return { isValid: false, error: 'File contains dangerous pattern.' };
    }
  }
  
  // Additional security: check for null bytes
  if (fileName.includes('\0')) {
    return { isValid: false, error: 'File name contains invalid characters.' };
  }
  
  return { isValid: true };
};

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }
    
    if (userAttempts.count >= this.maxAttempts) {
      return true;
    }
    
    userAttempts.count++;
    return false;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of Array.from(this.attempts.entries())) {
      if (now > value.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global rate limiters
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const registrationRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Cleanup rate limiters every hour
setInterval(() => {
  loginRateLimiter.cleanup();
  registrationRateLimiter.cleanup();
  apiRateLimiter.cleanup();
}, 60 * 60 * 1000);

// Vendor access validation
export interface VendorValidation {
  isValid: boolean;
  vendorId?: number;
  error?: string;
}

export const validateVendorAccess = async (userId: number): Promise<VendorValidation> => {
  try {
    // Use V2 API to validate vendor access
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/v2/vendors/validate/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: 'Failed to validate vendor access'
      };
    }

    const result = await response.json();
    const data = result.data || result;

    return {
      isValid: data.isValid,
      vendorId: data.vendorId,
      error: data.error
    };
  } catch (error) {
    console.error('Error validating vendor access:', error);
    return {
      isValid: false,
      error: 'Failed to validate vendor access'
    };
  }
};