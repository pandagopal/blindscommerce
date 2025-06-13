// Global error handling utilities for UI components

/**
 * Safely format currency values with null checks
 */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  try {
    const safeValue = value || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(safeValue);
  } catch (error) {
    console.error('Error formatting currency:', error, { value, currency });
    return `$${(value || 0).toFixed(2)}`;
  }
}

/**
 * Safely format dates with null checks
 */
export function formatDate(date: string | Date | null | undefined, format: 'short' | 'long' | 'relative' = 'short'): string {
  try {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', date);
      return 'Invalid Date';
    }

    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'relative':
        const now = new Date();
        const diffInMs = now.getTime() - dateObj.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return dateObj.toLocaleDateString('en-US');
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.error('Error formatting date:', error, { date, format });
    return 'Error';
  }
}

/**
 * Safely access nested object properties
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch (error) {
    console.warn('Error accessing object path:', error, { path, obj });
    return defaultValue;
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') return defaultValue;
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Error parsing JSON:', error, { jsonString });
    return defaultValue;
  }
}

/**
 * Safe array mapping with null checks
 */
export function safeMap<T, R>(
  array: T[] | null | undefined, 
  mapFn: (item: T, index: number) => R,
  fallback: R[] = []
): R[] {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.map(mapFn);
  } catch (error) {
    console.error('Error in safe array mapping:', error, { array });
    return fallback;
  }
}

/**
 * Safe number formatting with fallbacks
 */
export function formatNumber(value: number | string | null | undefined, options?: {
  decimals?: number;
  fallback?: string;
}): string {
  try {
    const { decimals = 0, fallback = '0' } = options || {};
    
    if (value === null || value === undefined) return fallback;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return fallback;
    
    return numValue.toFixed(decimals);
  } catch (error) {
    console.error('Error formatting number:', error, { value, options });
    return options?.fallback || '0';
  }
}

/**
 * Log errors to console with context (can be extended to external logging)
 */
export function logError(error: Error | string, context?: any): void {
  try {
    // Skip logging for null/undefined errors
    if (!error) return;
    
    // Skip logging for empty objects or empty strings
    if ((typeof error === 'object' && Object.keys(error).length === 0) || error === '') return;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Skip logging if no meaningful error message
    if (!errorMessage || errorMessage === '[object Object]' || errorMessage === '{}') return;
    
    const errorDetails = {
      message: errorMessage,
      stack: stackTrace,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
      severity: 'error'
    };
    
    // Console logging with structured format
    console.error('UI Error:', errorDetails);
    
    // In production, you might want to send this to an external error tracking service
    // Example: Sentry.captureException(error, { extra: context });
    
    // Could also send to your own API endpoint for logging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Uncomment when ready to implement server-side error logging
      // fetch('/api/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorDetails)
      // }).catch(err => console.warn('Failed to send error to server:', err));
    }
  } catch (logError) {
    // Fallback if logging itself fails
    console.error('Failed to log error:', logError);
  }
}

/**
 * Log warnings for non-critical issues
 */
export function logWarning(message: string, context?: any): void {
  try {
    const warningDetails = {
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      severity: 'warning'
    };
    
    console.warn('UI Warning:', warningDetails);
  } catch (error) {
    console.error('Failed to log warning:', error);
  }
}

/**
 * Safe wrapper function for error-prone operations
 */
export function withErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error as Error, { context, function: fn.name, args });
      return null;
    }
  }) as T;
}

/**
 * Validates if an array has items
 */
export function hasValidItems<T>(items: T[] | null | undefined): items is T[] {
  return Array.isArray(items) && items.length > 0;
}

/**
 * Safe array length check
 */
export function getArrayLength<T>(items: T[] | null | undefined): number {
  return Array.isArray(items) ? items.length : 0;
}

/**
 * Safe percentage calculation
 */
export function calculatePercentage(value: number | null | undefined, total: number | null | undefined): number {
  try {
    if (!value || !total || total === 0) return 0;
    return Math.round((value / total) * 100);
  } catch (error) {
    console.warn('Error calculating percentage:', error, { value, total });
    return 0;
  }
}

/**
 * Safe string truncation
 */
export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  try {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  } catch (error) {
    console.warn('Error truncating text:', error, { text, maxLength });
    return '';
  }
}