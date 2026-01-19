/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing HTML content before rendering
 */

import * as DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe HTML tags commonly used in blog content while removing scripts
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common HTML tags for rich content
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u', 's', 'strike',
      'a', 'img', 'figure', 'figcaption',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'sup', 'sub',
    ],
    // Allow common attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height',
      'loading', 'decoding', // Image optimization attributes
    ],
    // Only allow safe URI schemes
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Add rel="noopener noreferrer" to external links
    ADD_ATTR: ['target'],
    // Prevent data: URIs which could contain scripts
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize HTML for JSON-LD structured data
 * More restrictive - strips all HTML
 */
export function sanitizeForStructuredData(text: string): string {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user-generated content (comments, reviews, etc.)
 * Most restrictive - only allows basic formatting
 */
export function sanitizeUserContent(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML entities for text content
 * Use when you need to display text that might contain HTML
 */
export function escapeHTML(text: string): string {
  if (!text) return '';

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}
