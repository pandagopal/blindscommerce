/**
 * Phone number formatting utilities for different countries
 */

export type CountryCode = 'US' | 'UK' | 'CA' | 'CN';

export interface CountryPhoneConfig {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  placeholder: string;
  maxLength: number;
  regex: RegExp;
}

export const COUNTRY_CONFIGS: Record<CountryCode, CountryPhoneConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    format: '(XXX) XXX-XXXX',
    placeholder: '(316) 530-2635',
    maxLength: 14,
    regex: /^(\+?1\s?)?(\(?\d{3}\)?\s?[\-.]?\s?\d{3}[\-.]?\s?\d{4})$/
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    format: '(XXX) XXX-XXXX',
    placeholder: '(416) 555-0123',
    maxLength: 14,
    regex: /^(\+?1\s?)?(\(?\d{3}\)?\s?[\-.]?\s?\d{3}[\-.]?\s?\d{4})$/
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    format: 'XXXX XXX XXXX',
    placeholder: '0207 123 4567',
    maxLength: 16,
    regex: /^(\+?44\s?)?(\(?0?\d{2,4}\)?\s?\d{3,4}\s?\d{3,4})$/
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    dialCode: '+86',
    format: 'XXX XXXX XXXX',
    placeholder: '138 0013 8000',
    maxLength: 15,
    regex: /^(\+?86\s?)?1[3-9]\d{9}$/
  }
};

/**
 * Format phone number based on country
 */
export function formatPhoneNumber(value: string, country: CountryCode = 'US'): string {
  const digits = value.replace(/\D/g, '');

  switch (country) {
    case 'US':
    case 'CA':
      return formatUSCanadaPhone(digits);
    case 'UK':
      return formatUKPhone(digits);
    case 'CN':
      return formatChinaPhone(digits);
    default:
      return formatUSCanadaPhone(digits);
  }
}

/**
 * Format US/Canada phone number: (XXX) XXX-XXXX
 */
function formatUSCanadaPhone(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  // Handle country code
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

/**
 * Format UK phone number: 0XXX XXX XXXX or +44 XXX XXX XXXX
 */
function formatUKPhone(digits: string): string {
  if (digits.length === 0) return '';
  
  // Handle international format
  if (digits.startsWith('44')) {
    const withoutCountry = digits.slice(2);
    if (withoutCountry.length <= 2) return `+44 ${withoutCountry}`;
    if (withoutCountry.length <= 5) return `+44 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2)}`;
    if (withoutCountry.length <= 8) return `+44 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5)}`;
    return `+44 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5, 9)}`;
  }
  
  // Handle domestic format
  if (digits.length <= 2) return `0${digits}`;
  if (digits.length <= 5) return `0${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 8) return `0${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `0${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

/**
 * Format China phone number: XXX XXXX XXXX
 */
function formatChinaPhone(digits: string): string {
  if (digits.length === 0) return '';
  
  // Handle international format
  if (digits.startsWith('86')) {
    const withoutCountry = digits.slice(2);
    if (withoutCountry.length <= 3) return `+86 ${withoutCountry}`;
    if (withoutCountry.length <= 7) return `+86 ${withoutCountry.slice(0, 3)} ${withoutCountry.slice(3)}`;
    return `+86 ${withoutCountry.slice(0, 3)} ${withoutCountry.slice(3, 7)} ${withoutCountry.slice(7)}`;
  }
  
  // Handle domestic format
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

/**
 * Validate phone number for specific country
 */
export function validatePhoneNumber(value: string, country: CountryCode = 'US'): boolean {
  if (!value) return false;
  const config = COUNTRY_CONFIGS[country];
  return config.regex.test(value);
}

/**
 * Get clean digits from formatted phone number
 */
export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Convert phone number to international format
 */
export function toInternationalFormat(value: string, country: CountryCode = 'US'): string {
  const digits = getPhoneDigits(value);
  
  if (!digits) return '';
  
  // If already has country code, return as is
  if (value.startsWith('+')) return value;
  
  // Add country code based on country
  switch (country) {
    case 'US':
    case 'CA':
      return `+1 ${formatUSCanadaPhone(digits)}`;
    case 'UK':
      return `+44 ${formatUKPhone(digits)}`;
    case 'CN':
      return `+86 ${formatChinaPhone(digits)}`;
    default:
      return `+1 ${formatUSCanadaPhone(digits)}`;
  }
}

/**
 * Get validation error message for country
 */
export function getPhoneValidationError(country: CountryCode = 'US'): string {
  const config = COUNTRY_CONFIGS[country];
  return `Please enter a valid ${config.name} phone number (e.g., ${config.placeholder})`;
}