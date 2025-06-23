/**
 * Secure Encryption Utilities for Sensitive Data
 * 
 * This module provides AES-256-GCM encryption for sensitive payment credentials
 * and other confidential data stored in the database.
 */

// Only import crypto on server-side
let crypto: typeof import('crypto');
if (typeof window === 'undefined') {
  crypto = require('crypto');
}

import { getEnvVar } from './env-config';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT = 'blindscommerce-security-salt-2025'; // Static salt for key derivation

/**
 * Get encryption key from environment variable with proper derivation
 */
function getEncryptionKey(): Buffer {
  if (typeof window !== 'undefined') {
    throw new Error('Encryption operations are only available on the server side');
  }
  
  try {
    const masterKey = getEnvVar('ENCRYPTION_KEY', undefined, true);
    
    // Derive a consistent key using PBKDF2
    return crypto.pbkdf2Sync(masterKey, SALT, 100000, KEY_LENGTH, 'sha256');
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    throw new Error('Encryption key not configured. Please set ENCRYPTION_KEY environment variable.');
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns: base64(iv:tag:encryptedData)
 */
export function encryptSensitiveData(plaintext: string): string {
  if (typeof window !== 'undefined') {
    throw new Error('Encryption operations are only available on the server side');
  }
  
  if (!plaintext || plaintext === '') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv:tag:encryptedData and encode as base64
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * Input: base64(iv:tag:encryptedData)
 */
export function decryptSensitiveData(encryptedData: string): string {
  if (typeof window !== 'undefined') {
    throw new Error('Decryption operations are only available on the server side');
  }
  
  if (!encryptedData || encryptedData === '') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Check if a string appears to be encrypted (base64 format)
 */
export function isEncrypted(data: string): boolean {
  if (!data || data === '') return false;
  
  try {
    // Check if it's valid base64 and has expected minimum length
    const decoded = Buffer.from(data, 'base64');
    return decoded.length >= (IV_LENGTH + TAG_LENGTH + 16); // Minimum encrypted size
  } catch {
    return false;
  }
}

/**
 * Safely encrypt value only if it's not already encrypted
 */
export function safeEncrypt(value: string): string {
  if (!value || value === '') return value;
  if (isEncrypted(value)) return value; // Already encrypted
  return encryptSensitiveData(value);
}

/**
 * Safely decrypt value only if it appears to be encrypted
 */
export function safeDecrypt(value: string): string {
  if (!value || value === '') return value;
  if (!isEncrypted(value)) return value; // Not encrypted (plain text)
  return decryptSensitiveData(value);
}

/**
 * Generate a new encryption key for initial setup
 */
export function generateEncryptionKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Key generation is only available on the server side');
  }
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * List of sensitive setting keys that should be encrypted
 * Following the existing security patterns from env-config.ts
 */
export const SENSITIVE_PAYMENT_SETTINGS = [
  'payment_stripe_secret_key',
  'payment_stripe_webhook_secret',
  'payment_paypal_client_secret',
  'payment_braintree_merchant_id',
  'payment_braintree_public_key',
  'payment_braintree_private_key'
] as const;

export const SENSITIVE_INTEGRATION_SETTINGS = [
  'integrations_mailchimp_api_key',
  'integrations_twilio_account_sid',
  'integrations_taxjar_api_key'
] as const;

export const ALL_SENSITIVE_SETTINGS = [
  ...SENSITIVE_PAYMENT_SETTINGS,
  ...SENSITIVE_INTEGRATION_SETTINGS
] as const;

/**
 * Check if a setting key contains sensitive data that should be encrypted
 */
export function isSensitiveSetting(key: string): boolean {
  return ALL_SENSITIVE_SETTINGS.includes(key as any) || 
         key.includes('secret') || 
         key.includes('private') || 
         key.includes('api_key') ||
         key.includes('webhook');
}

/**
 * Validate encryption key strength (similar to JWT validation in env-config.ts)
 */
export function validateEncryptionKey(key: string): { isValid: boolean; reason?: string } {
  if (!key) {
    return { isValid: false, reason: 'Encryption key is required' };
  }
  
  if (key.length < 32) {
    return { isValid: false, reason: 'Encryption key must be at least 32 characters' };
  }
  
  if (key === 'your-encryption-key' || key === 'change-me') {
    return { isValid: false, reason: 'Encryption key must not be a default value' };
  }
  
  // Check for sufficient entropy
  const uniqueChars = new Set(key).size;
  if (uniqueChars < 10) {
    return { isValid: false, reason: 'Encryption key has insufficient entropy' };
  }
  
  return { isValid: true };
}