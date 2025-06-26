/**
 * API Deprecation System
 * Manages deprecation notices and migration paths for legacy endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

export interface DeprecationInfo {
  oldEndpoint: string;
  newEndpoint: string;
  deprecatedSince: string;
  removalDate: string;
  migrationGuide: string;
  alternativeAction?: string;
}

export class DeprecationManager {
  private static deprecatedEndpoints: Map<string, DeprecationInfo> = new Map([
    // Admin Dashboard APIs
    ['/api/admin/dashboard/overview', {
      oldEndpoint: '/api/admin/dashboard/overview',
      newEndpoint: '/api/admin/dashboard-consolidated',
      deprecatedSince: '2024-01-15',
      removalDate: '2024-04-15',
      migrationGuide: 'Use GET /api/admin/dashboard-consolidated?include=overview',
      alternativeAction: 'include=overview'
    }],
    ['/api/admin/dashboard/revenue-chart', {
      oldEndpoint: '/api/admin/dashboard/revenue-chart',
      newEndpoint: '/api/admin/dashboard-consolidated',
      deprecatedSince: '2024-01-15',
      removalDate: '2024-04-15',
      migrationGuide: 'Use GET /api/admin/dashboard-consolidated?include=charts',
      alternativeAction: 'include=charts'
    }],
    
    // Cart APIs
    ['/api/cart/add', {
      oldEndpoint: '/api/cart/add',
      newEndpoint: '/api/cart',
      deprecatedSince: '2024-01-20',
      removalDate: '2024-04-20',
      migrationGuide: 'Use POST /api/cart with action="add_item"',
      alternativeAction: 'add_item'
    }],
    ['/api/cart/items/[id]/quantity', {
      oldEndpoint: '/api/cart/items/[id]/quantity',
      newEndpoint: '/api/cart',
      deprecatedSince: '2024-01-20',
      removalDate: '2024-04-20',
      migrationGuide: 'Use POST /api/cart with action="update_quantity"',
      alternativeAction: 'update_quantity'
    }],
    ['/api/cart/coupons/apply', {
      oldEndpoint: '/api/cart/coupons/apply',
      newEndpoint: '/api/cart',
      deprecatedSince: '2024-01-20',
      removalDate: '2024-04-20',
      migrationGuide: 'Use POST /api/cart with action="apply_coupon"',
      alternativeAction: 'apply_coupon'
    }],
    
    // Vendor APIs
    ['/api/vendor/dashboard/overview', {
      oldEndpoint: '/api/vendor/dashboard/overview',
      newEndpoint: '/api/vendor/dashboard',
      deprecatedSince: '2024-01-25',
      removalDate: '2024-04-25',
      migrationGuide: 'Use GET /api/vendor/dashboard?include=overview',
      alternativeAction: 'include=overview'
    }],
    ['/api/vendor/dashboard/sales-metrics', {
      oldEndpoint: '/api/vendor/dashboard/sales-metrics',
      newEndpoint: '/api/vendor/dashboard',
      deprecatedSince: '2024-01-25',
      removalDate: '2024-04-25',
      migrationGuide: 'Use GET /api/vendor/dashboard?include=sales_metrics',
      alternativeAction: 'include=sales_metrics'
    }],
    
    // Payment APIs
    ['/api/payments/stripe/create-payment-intent', {
      oldEndpoint: '/api/payments/stripe/create-payment-intent',
      newEndpoint: '/api/payments/process',
      deprecatedSince: '2024-01-30',
      removalDate: '2024-04-30',
      migrationGuide: 'Use POST /api/payments/process with provider="stripe"',
      alternativeAction: 'provider=stripe'
    }],
    ['/api/payments/paypal/create-order', {
      oldEndpoint: '/api/payments/paypal/create-order',
      newEndpoint: '/api/payments/process',
      deprecatedSince: '2024-01-30',
      removalDate: '2024-04-30',
      migrationGuide: 'Use POST /api/payments/process with provider="paypal"',
      alternativeAction: 'provider=paypal'
    }]
  ]);

  /**
   * Check if an endpoint is deprecated
   */
  static isDeprecated(endpoint: string): boolean {
    return this.deprecatedEndpoints.has(endpoint);
  }

  /**
   * Get deprecation info for an endpoint
   */
  static getDeprecationInfo(endpoint: string): DeprecationInfo | undefined {
    return this.deprecatedEndpoints.get(endpoint);
  }

  /**
   * Add deprecation headers to response
   */
  static addDeprecationHeaders(
    response: NextResponse, 
    deprecationInfo: DeprecationInfo
  ): NextResponse {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', deprecationInfo.removalDate);
    response.headers.set('Link', `<${deprecationInfo.newEndpoint}>; rel="alternate"`);
    response.headers.set('X-Deprecation-Notice', deprecationInfo.migrationGuide);
    
    return response;
  }

  /**
   * Create a deprecation warning response
   */
  static createDeprecationResponse(
    endpoint: string,
    actualResponse?: any
  ): NextResponse {
    const info = this.getDeprecationInfo(endpoint);
    
    if (!info) {
      return NextResponse.json({
        success: false,
        error: 'Unknown deprecated endpoint'
      }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      data: actualResponse || null,
      deprecation: {
        warning: `This endpoint is deprecated and will be removed on ${info.removalDate}`,
        newEndpoint: info.newEndpoint,
        migrationGuide: info.migrationGuide,
        documentation: 'https://docs.blindscommerce.com/api/migration'
      }
    }, { status: 200 });

    return this.addDeprecationHeaders(response, info);
  }

  /**
   * Log deprecation usage for monitoring
   */
  static logDeprecationUsage(endpoint: string, req: NextRequest): void {
    const info = this.getDeprecationInfo(endpoint);
    if (!info) return;

    console.warn(`[DEPRECATION] Endpoint used: ${endpoint}`);
    console.warn(`  Client: ${req.headers.get('user-agent')}`);
    console.warn(`  IP: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
    console.warn(`  Migration: ${info.migrationGuide}`);
    console.warn(`  Removal Date: ${info.removalDate}`);
    
    // In production, this would send to monitoring service
    // monitoringService.trackDeprecation(endpoint, req);
  }

  /**
   * Middleware to handle deprecated endpoints
   */
  static deprecationMiddleware(endpoint: string) {
    return async (req: NextRequest) => {
      const info = this.getDeprecationInfo(endpoint);
      
      if (!info) {
        return NextResponse.json({
          success: false,
          error: 'Endpoint not found'
        }, { status: 404 });
      }

      // Log usage
      this.logDeprecationUsage(endpoint, req);

      // For GET requests, redirect to new endpoint
      if (req.method === 'GET' && info.alternativeAction) {
        const url = new URL(req.url);
        const newUrl = new URL(info.newEndpoint, url.origin);
        
        // Copy query parameters
        url.searchParams.forEach((value, key) => {
          newUrl.searchParams.append(key, value);
        });
        
        // Add alternative action if specified
        if (info.alternativeAction.includes('=')) {
          const [key, value] = info.alternativeAction.split('=');
          newUrl.searchParams.append(key, value);
        }

        // Return deprecation response with redirect info
        return this.createDeprecationResponse(endpoint, {
          redirect: newUrl.toString(),
          message: 'Please update your integration to use the new endpoint'
        });
      }

      // For other methods, return deprecation notice
      return this.createDeprecationResponse(endpoint, {
        message: 'This endpoint is deprecated. Please migrate to the new API.',
        method: req.method,
        migration: info.migrationGuide
      });
    };
  }

  /**
   * Get all deprecated endpoints for documentation
   */
  static getAllDeprecatedEndpoints(): Array<{
    endpoint: string;
    info: DeprecationInfo;
    daysUntilRemoval: number;
  }> {
    const now = new Date();
    const results: Array<any> = [];

    this.deprecatedEndpoints.forEach((info, endpoint) => {
      const removalDate = new Date(info.removalDate);
      const daysUntilRemoval = Math.ceil(
        (removalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      results.push({
        endpoint,
        info,
        daysUntilRemoval
      });
    });

    return results.sort((a, b) => a.daysUntilRemoval - b.daysUntilRemoval);
  }

  /**
   * Generate deprecation report
   */
  static generateDeprecationReport(): string {
    const endpoints = this.getAllDeprecatedEndpoints();
    const now = new Date().toISOString().split('T')[0];
    
    let report = `# API Deprecation Report\n\n`;
    report += `Generated: ${now}\n\n`;
    report += `## Summary\n\n`;
    report += `Total Deprecated Endpoints: ${endpoints.length}\n\n`;
    
    report += `## Deprecated Endpoints\n\n`;
    
    endpoints.forEach(({ endpoint, info, daysUntilRemoval }) => {
      report += `### ${endpoint}\n`;
      report += `- **Status**: ${daysUntilRemoval > 0 ? '⚠️ Deprecated' : '❌ Removed'}\n`;
      report += `- **Deprecated Since**: ${info.deprecatedSince}\n`;
      report += `- **Removal Date**: ${info.removalDate} (${daysUntilRemoval} days)\n`;
      report += `- **New Endpoint**: \`${info.newEndpoint}\`\n`;
      report += `- **Migration**: ${info.migrationGuide}\n\n`;
    });

    return report;
  }
}

// Export convenience function for creating deprecated endpoint handlers
export function createDeprecatedEndpointHandler(endpoint: string) {
  return DeprecationManager.deprecationMiddleware(endpoint);
}