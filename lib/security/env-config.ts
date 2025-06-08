/**
 * Secure Environment Configuration
 * 
 * This file provides utilities for securely managing environment variables
 * and sensitive configuration data.
 */

import * as crypto from 'crypto';

// Required environment variables for production
export const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT', 
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY'
] as const;

// Optional environment variables with secure defaults
export const OPTIONAL_ENV_VARS = {
  'NODE_ENV': 'development',
  'PORT': '3000',
  'RATE_LIMIT_MAX': '100',
  'RATE_LIMIT_WINDOW': '900000', // 15 minutes
  'SESSION_TIMEOUT': '86400', // 24 hours
  'MAX_LOGIN_ATTEMPTS': '5',
  'LOCKOUT_DURATION': '900000', // 15 minutes
  'BCRYPT_ROUNDS': '12',
  'CORS_ORIGIN': 'http://localhost:3000',
  'ALLOWED_ORIGINS': 'http://localhost:3000,https://yourdomain.com'
} as const;

// Sensitive environment variables that should never be logged
export const SENSITIVE_ENV_VARS = [
  'DB_PASSWORD',
  'JWT_SECRET', 
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'PUSHER_SECRET',
  'EMAIL_PASSWORD',
  'TUYA_CLIENT_SECRET'
] as const;

/**
 * Validate all required environment variables are present
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * Get environment variable with validation and optional default
 */
export function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key];
  
  if (!value) {
    if (required) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  
  return value;
}

/**
 * Get environment variable as number
 */
export function getEnvNumber(key: string, defaultValue?: number, required = false): number {
  const value = getEnvVar(key, defaultValue?.toString(), required);
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  
  return parsed;
}

/**
 * Get environment variable as boolean
 */
export function getEnvBoolean(key: string, defaultValue?: boolean, required = false): boolean {
  const value = getEnvVar(key, defaultValue?.toString(), required);
  return value.toLowerCase() === 'true';
}

/**
 * Generate secure random secret
 */
export function generateSecureSecret(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate JWT secret strength
 */
export function validateJWTSecret(secret: string): { isValid: boolean; reason?: string } {
  if (!secret) {
    return { isValid: false, reason: 'JWT secret is required' };
  }
  
  if (secret.length < 32) {
    return { isValid: false, reason: 'JWT secret must be at least 32 characters' };
  }
  
  if (secret === 'your-secret-key' || secret === 'change-me') {
    return { isValid: false, reason: 'JWT secret must not be a default value' };
  }
  
  // Check for sufficient entropy
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 10) {
    return { isValid: false, reason: 'JWT secret has insufficient entropy' };
  }
  
  return { isValid: true };
}

/**
 * Sanitize environment variables for logging
 */
export function sanitizeEnvForLogging(env: Record<string, string | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    
    if (SENSITIVE_ENV_VARS.includes(key as any)) {
      sanitized[key] = '***REDACTED***';
    } else if (key.toLowerCase().includes('password') || 
               key.toLowerCase().includes('secret') ||
               key.toLowerCase().includes('key')) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Configuration object with secure defaults
 */
export const secureConfig = {
  // Database configuration
  database: {
    host: getEnvVar('DB_HOST', 'localhost', true),
    port: getEnvNumber('DB_PORT', 3306, true),
    user: getEnvVar('DB_USER', undefined, true),
    password: getEnvVar('DB_PASSWORD', undefined, true),
    name: getEnvVar('DB_NAME', undefined, true),
    ssl: getEnvBoolean('DB_SSL', process.env.NODE_ENV === 'production'),
    connectionLimit: getEnvNumber('DB_CONNECTION_LIMIT', 10),
    acquireTimeout: getEnvNumber('DB_ACQUIRE_TIMEOUT', 60000),
    timeout: getEnvNumber('DB_TIMEOUT', 60000)
  },
  
  // Security configuration
  security: {
    jwtSecret: getEnvVar('JWT_SECRET', undefined, true),
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
    sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 86400),
    maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getEnvNumber('LOCKOUT_DURATION', 900000),
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100),
    rateLimitWindow: getEnvNumber('RATE_LIMIT_WINDOW', 900000)
  },
  
  // CORS configuration
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    allowedOrigins: getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
  },
  
  // File upload configuration
  upload: {
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', 5 * 1024 * 1024), // 5MB
    maxFiles: getEnvNumber('MAX_FILES_PER_UPLOAD', 10),
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: getEnvVar('UPLOAD_PATH', '/public/uploads')
  }
};

/**
 * Initialize and validate configuration on startup
 */
export function initializeSecureConfig(): void {
  // Validate required environment variables
  const validation = validateEnvironment();
  if (!validation.isValid) {
    throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`);
  }
  
  // Validate JWT secret
  const jwtValidation = validateJWTSecret(process.env.JWT_SECRET!);
  if (!jwtValidation.isValid) {
    throw new Error(`JWT Secret validation failed: ${jwtValidation.reason}`);
  }
  
  // Log sanitized configuration in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Secure configuration initialized:', {
      database: { ...secureConfig.database, password: '***REDACTED***' },
      security: { ...secureConfig.security, jwtSecret: '***REDACTED***' },
      cors: secureConfig.cors,
      upload: secureConfig.upload
    });
  }
}