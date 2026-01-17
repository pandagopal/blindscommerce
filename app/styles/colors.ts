/**
 * Color system using CSS variables
 * Single source of truth is in app/globals.css
 * This file provides type-safe references for use in JavaScript/TypeScript
 */
export const colors = {
  // Primary Colors - Reference CSS variables
  primary: {
    red: 'var(--primary-red)',
    dark: 'var(--primary-dark)',
  },

  // Accent Colors - Yellow (for CTAs and highlights)
  accent: {
    yellow: 'var(--accent-yellow)',
    yellowHover: 'var(--accent-yellow-hover)',
    gold: 'var(--accent-gold)',
  },

  // Text Colors
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
  },

  // Background Colors
  background: {
    main: 'var(--bg-main)',
    white: 'var(--bg-white)',
    default: 'var(--bg-default)',
    footer: 'var(--bg-footer)',
    header: 'var(--bg-header)',
  },

  // Border Colors
  border: {
    light: 'var(--border-light)',
    main: 'var(--border-main)',
  },

  // Status Colors
  status: {
    success: 'var(--status-success)',
    error: 'var(--status-error)',
    warning: 'var(--status-warning)',
    info: 'var(--status-info)',
  },

  // Hover States
  hover: {
    primary: 'var(--hover-primary)',
    gray: 'var(--hover-gray)',
  }
}; 