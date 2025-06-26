/**
 * Unified Error Handling System for Consolidated APIs
 * Extends the base error handling with API-specific functionality
 */

import { NextResponse } from 'next/server';
import { logError, logWarning } from '@/lib/errorHandling';

// Error types specific to API operations
export enum APIErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Request Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',

  // Database Operations
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Business Logic
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  INVALID_PRICE = 'INVALID_PRICE',
  ORDER_ALREADY_PROCESSED = 'ORDER_ALREADY_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SHIPPING_UNAVAILABLE = 'SHIPPING_UNAVAILABLE',

  // External Services
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  PAYMENT_PROVIDER_ERROR = 'PAYMENT_PROVIDER_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',

  // Rate Limiting & Security
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  IP_BLOCKED = 'IP_BLOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',

  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND'
}

// Structured error response format
export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
  requestId?: string;
  endpoint?: string;
  userRole?: string;
  userId?: number;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// HTTP status code mapping
const ERROR_STATUS_MAP: Record<APIErrorCode, number> = {
  [APIErrorCode.UNAUTHORIZED]: 401,
  [APIErrorCode.FORBIDDEN]: 403,
  [APIErrorCode.INVALID_TOKEN]: 401,
  [APIErrorCode.TOKEN_EXPIRED]: 401,
  [APIErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  [APIErrorCode.VALIDATION_ERROR]: 400,
  [APIErrorCode.MISSING_REQUIRED_FIELDS]: 400,
  [APIErrorCode.INVALID_FORMAT]: 400,
  [APIErrorCode.INVALID_PARAMETERS]: 400,
  [APIErrorCode.REQUEST_TOO_LARGE]: 413,

  [APIErrorCode.DATABASE_CONNECTION_FAILED]: 503,
  [APIErrorCode.DATABASE_QUERY_FAILED]: 500,
  [APIErrorCode.DATABASE_TRANSACTION_FAILED]: 500,
  [APIErrorCode.RECORD_NOT_FOUND]: 404,
  [APIErrorCode.DUPLICATE_ENTRY]: 409,
  [APIErrorCode.CONSTRAINT_VIOLATION]: 409,

  [APIErrorCode.INSUFFICIENT_INVENTORY]: 409,
  [APIErrorCode.INVALID_PRICE]: 400,
  [APIErrorCode.ORDER_ALREADY_PROCESSED]: 409,
  [APIErrorCode.PAYMENT_FAILED]: 402,
  [APIErrorCode.SHIPPING_UNAVAILABLE]: 503,

  [APIErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  [APIErrorCode.PAYMENT_PROVIDER_ERROR]: 502,
  [APIErrorCode.EMAIL_SERVICE_ERROR]: 502,
  [APIErrorCode.SMS_SERVICE_ERROR]: 502,

  [APIErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [APIErrorCode.IP_BLOCKED]: 403,
  [APIErrorCode.SUSPICIOUS_ACTIVITY]: 403,

  [APIErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [APIErrorCode.SERVICE_UNAVAILABLE]: 503,
  [APIErrorCode.METHOD_NOT_ALLOWED]: 405,
  [APIErrorCode.RESOURCE_NOT_FOUND]: 404
};

// Error severity mapping
const ERROR_SEVERITY_MAP: Record<APIErrorCode, ErrorSeverity> = {
  [APIErrorCode.UNAUTHORIZED]: ErrorSeverity.MEDIUM,
  [APIErrorCode.FORBIDDEN]: ErrorSeverity.MEDIUM,
  [APIErrorCode.INVALID_TOKEN]: ErrorSeverity.LOW,
  [APIErrorCode.TOKEN_EXPIRED]: ErrorSeverity.LOW,
  [APIErrorCode.INSUFFICIENT_PERMISSIONS]: ErrorSeverity.MEDIUM,

  [APIErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [APIErrorCode.MISSING_REQUIRED_FIELDS]: ErrorSeverity.LOW,
  [APIErrorCode.INVALID_FORMAT]: ErrorSeverity.LOW,
  [APIErrorCode.INVALID_PARAMETERS]: ErrorSeverity.LOW,
  [APIErrorCode.REQUEST_TOO_LARGE]: ErrorSeverity.MEDIUM,

  [APIErrorCode.DATABASE_CONNECTION_FAILED]: ErrorSeverity.CRITICAL,
  [APIErrorCode.DATABASE_QUERY_FAILED]: ErrorSeverity.HIGH,
  [APIErrorCode.DATABASE_TRANSACTION_FAILED]: ErrorSeverity.HIGH,
  [APIErrorCode.RECORD_NOT_FOUND]: ErrorSeverity.LOW,
  [APIErrorCode.DUPLICATE_ENTRY]: ErrorSeverity.MEDIUM,
  [APIErrorCode.CONSTRAINT_VIOLATION]: ErrorSeverity.MEDIUM,

  [APIErrorCode.INSUFFICIENT_INVENTORY]: ErrorSeverity.MEDIUM,
  [APIErrorCode.INVALID_PRICE]: ErrorSeverity.MEDIUM,
  [APIErrorCode.ORDER_ALREADY_PROCESSED]: ErrorSeverity.MEDIUM,
  [APIErrorCode.PAYMENT_FAILED]: ErrorSeverity.HIGH,
  [APIErrorCode.SHIPPING_UNAVAILABLE]: ErrorSeverity.MEDIUM,

  [APIErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
  [APIErrorCode.PAYMENT_PROVIDER_ERROR]: ErrorSeverity.HIGH,
  [APIErrorCode.EMAIL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [APIErrorCode.SMS_SERVICE_ERROR]: ErrorSeverity.MEDIUM,

  [APIErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
  [APIErrorCode.IP_BLOCKED]: ErrorSeverity.HIGH,
  [APIErrorCode.SUSPICIOUS_ACTIVITY]: ErrorSeverity.HIGH,

  [APIErrorCode.INTERNAL_SERVER_ERROR]: ErrorSeverity.CRITICAL,
  [APIErrorCode.SERVICE_UNAVAILABLE]: ErrorSeverity.CRITICAL,
  [APIErrorCode.METHOD_NOT_ALLOWED]: ErrorSeverity.LOW,
  [APIErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.LOW
};

// Main error handler class
export class APIErrorHandler {
  private static requestId = 0;

  static generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  static createError(
    code: APIErrorCode,
    message?: string,
    details?: any,
    field?: string,
    context?: {
      endpoint?: string;
      userRole?: string;
      userId?: number;
      requestId?: string;
    }
  ): APIError {
    return {
      code,
      message: message || this.getDefaultMessage(code),
      details,
      field,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId(),
      endpoint: context?.endpoint,
      userRole: context?.userRole,
      userId: context?.userId
    };
  }

  static createResponse(error: APIError): NextResponse {
    const status = ERROR_STATUS_MAP[error.code] || 500;
    const severity = ERROR_SEVERITY_MAP[error.code] || ErrorSeverity.MEDIUM;

    // Log error based on severity
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      logError(new Error(error.message), {
        errorCode: error.code,
        details: error.details,
        endpoint: error.endpoint,
        userRole: error.userRole,
        userId: error.userId,
        requestId: error.requestId,
        severity
      });
    } else if (severity === ErrorSeverity.MEDIUM) {
      logWarning(error.message, {
        errorCode: error.code,
        details: error.details,
        endpoint: error.endpoint,
        requestId: error.requestId
      });
    }

    // Response format
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.field && { field: error.field }),
        ...(process.env.NODE_ENV === 'development' && error.details && { details: error.details }),
        timestamp: error.timestamp,
        requestId: error.requestId
      }
    };

    return NextResponse.json(response, { status });
  }

  static createValidationError(field: string, message: string, context?: any): APIError {
    return this.createError(
      APIErrorCode.VALIDATION_ERROR,
      message,
      context,
      field
    );
  }

  static createDatabaseError(originalError: Error, context?: any): APIError {
    // Categorize database errors
    const errorMessage = originalError.message.toLowerCase();
    
    if (errorMessage.includes('connection')) {
      return this.createError(
        APIErrorCode.DATABASE_CONNECTION_FAILED,
        'Database connection failed',
        context
      );
    }
    
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return this.createError(
        APIErrorCode.DUPLICATE_ENTRY,
        'Record already exists',
        context
      );
    }
    
    if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      return this.createError(
        APIErrorCode.CONSTRAINT_VIOLATION,
        'Data integrity constraint violation',
        context
      );
    }

    return this.createError(
      APIErrorCode.DATABASE_QUERY_FAILED,
      'Database operation failed',
      context
    );
  }

  static createAuthenticationError(type: 'unauthorized' | 'forbidden' | 'token_expired' = 'unauthorized'): APIError {
    switch (type) {
      case 'forbidden':
        return this.createError(APIErrorCode.FORBIDDEN, 'Access denied');
      case 'token_expired':
        return this.createError(APIErrorCode.TOKEN_EXPIRED, 'Authentication token has expired');
      default:
        return this.createError(APIErrorCode.UNAUTHORIZED, 'Authentication required');
    }
  }

  static createBusinessLogicError(
    type: 'inventory' | 'price' | 'order' | 'payment' | 'shipping',
    message?: string,
    details?: any
  ): APIError {
    const errorMap = {
      inventory: APIErrorCode.INSUFFICIENT_INVENTORY,
      price: APIErrorCode.INVALID_PRICE,
      order: APIErrorCode.ORDER_ALREADY_PROCESSED,
      payment: APIErrorCode.PAYMENT_FAILED,
      shipping: APIErrorCode.SHIPPING_UNAVAILABLE
    };

    return this.createError(errorMap[type], message, details);
  }

  private static getDefaultMessage(code: APIErrorCode): string {
    const messages: Record<APIErrorCode, string> = {
      [APIErrorCode.UNAUTHORIZED]: 'Authentication required',
      [APIErrorCode.FORBIDDEN]: 'Access denied',
      [APIErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
      [APIErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',
      [APIErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',

      [APIErrorCode.VALIDATION_ERROR]: 'Validation failed',
      [APIErrorCode.MISSING_REQUIRED_FIELDS]: 'Required fields are missing',
      [APIErrorCode.INVALID_FORMAT]: 'Invalid data format',
      [APIErrorCode.INVALID_PARAMETERS]: 'Invalid request parameters',
      [APIErrorCode.REQUEST_TOO_LARGE]: 'Request payload too large',

      [APIErrorCode.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
      [APIErrorCode.DATABASE_QUERY_FAILED]: 'Database operation failed',
      [APIErrorCode.DATABASE_TRANSACTION_FAILED]: 'Database transaction failed',
      [APIErrorCode.RECORD_NOT_FOUND]: 'Record not found',
      [APIErrorCode.DUPLICATE_ENTRY]: 'Record already exists',
      [APIErrorCode.CONSTRAINT_VIOLATION]: 'Data integrity constraint violation',

      [APIErrorCode.INSUFFICIENT_INVENTORY]: 'Insufficient inventory',
      [APIErrorCode.INVALID_PRICE]: 'Invalid price',
      [APIErrorCode.ORDER_ALREADY_PROCESSED]: 'Order already processed',
      [APIErrorCode.PAYMENT_FAILED]: 'Payment processing failed',
      [APIErrorCode.SHIPPING_UNAVAILABLE]: 'Shipping not available',

      [APIErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
      [APIErrorCode.PAYMENT_PROVIDER_ERROR]: 'Payment provider error',
      [APIErrorCode.EMAIL_SERVICE_ERROR]: 'Email service error',
      [APIErrorCode.SMS_SERVICE_ERROR]: 'SMS service error',

      [APIErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [APIErrorCode.IP_BLOCKED]: 'IP address blocked',
      [APIErrorCode.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',

      [APIErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [APIErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
      [APIErrorCode.METHOD_NOT_ALLOWED]: 'Method not allowed',
      [APIErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found'
    };

    return messages[code] || 'Unknown error';
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  // Handle async operations with error conversion
  async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    context?: any
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, context);
    }
  },

  // Validate required fields
  validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw APIErrorHandler.createError(
        APIErrorCode.MISSING_REQUIRED_FIELDS,
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields }
      );
    }
  },

  // Validate field format
  validateField(
    value: any,
    field: string,
    validator: (value: any) => boolean,
    message?: string
  ): void {
    if (!validator(value)) {
      throw APIErrorHandler.createValidationError(
        field,
        message || `Invalid format for field: ${field}`
      );
    }
  },

  // Check user permissions
  checkPermissions(userRole: string, requiredPermissionLevel: number): void {
    const rolePermissions: Record<string, number> = {
      SUPER_ADMIN: 100,
      ADMIN: 90,
      VENDOR: 70,
      INSTALLER: 60,
      SALES_REPRESENTATIVE: 50,
      TRADE_PROFESSIONAL: 40,
      CUSTOMER: 10,
      GUEST: 0
    };

    const userLevel = rolePermissions[userRole] || 0;
    
    if (userLevel < requiredPermissionLevel) {
      throw APIErrorHandler.createError(
        APIErrorCode.INSUFFICIENT_PERMISSIONS,
        `Insufficient permissions. Required level: ${requiredPermissionLevel}, User level: ${userLevel}`
      );
    }
  }
};

// Error monitoring and metrics
export class ErrorMetrics {
  private static errorCounts = new Map<APIErrorCode, number>();
  private static errorsByEndpoint = new Map<string, Map<APIErrorCode, number>>();

  static recordError(error: APIError): void {
    // Record by error code
    const currentCount = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, currentCount + 1);

    // Record by endpoint
    if (error.endpoint) {
      if (!this.errorsByEndpoint.has(error.endpoint)) {
        this.errorsByEndpoint.set(error.endpoint, new Map());
      }
      
      const endpointErrors = this.errorsByEndpoint.get(error.endpoint)!;
      const endpointCount = endpointErrors.get(error.code) || 0;
      endpointErrors.set(error.code, endpointCount + 1);
    }
  }

  static getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByEndpoint: Record<string, Record<string, number>>;
    topErrors: Array<{ code: APIErrorCode; count: number }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByCode = Object.fromEntries(this.errorCounts.entries());
    
    const errorsByEndpoint: Record<string, Record<string, number>> = {};
    for (const [endpoint, errors] of this.errorsByEndpoint.entries()) {
      errorsByEndpoint[endpoint] = Object.fromEntries(errors.entries());
    }

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      errorsByCode,
      errorsByEndpoint,
      topErrors
    };
  }

  static resetStats(): void {
    this.errorCounts.clear();
    this.errorsByEndpoint.clear();
  }
}