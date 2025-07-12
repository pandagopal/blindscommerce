/**
 * V2 API Dynamic Route Handler
 * Consolidates all API endpoints into a service-based architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logError } from '@/lib/errorHandling';

// Import service handlers
import { CommerceHandler } from '@/lib/api/v2/handlers/CommerceHandler';
import { UsersHandler } from '@/lib/api/v2/handlers/UsersHandler';
import { VendorsHandler } from '@/lib/api/v2/handlers/VendorsHandler';
import { AdminHandler } from '@/lib/api/v2/handlers/AdminHandler';
import { AnalyticsHandler } from '@/lib/api/v2/handlers/AnalyticsHandler';
import { AuthHandler } from '@/lib/api/v2/handlers/AuthHandler';
import { ContentHandler } from '@/lib/api/v2/handlers/ContentHandler';
import { SettingsHandler } from '@/lib/api/v2/handlers/SettingsHandler';

// Service handler mapping
const serviceHandlers: Record<string, any> = {
  commerce: new CommerceHandler(),
  users: new UsersHandler(),
  vendors: new VendorsHandler(),
  admin: new AdminHandler(),
  analytics: new AnalyticsHandler(),
  auth: new AuthHandler(),
  content: new ContentHandler(),
  settings: new SettingsHandler(),
};

// Standard API response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
    service: string;
    action: string;
    executionTime: number;
  };
}

// Create standard error response
function errorResponse(
  message: string,
  status: number,
  service: string,
  action: string,
  startTime: number
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.0',
      service,
      action,
      executionTime: Date.now() - startTime,
    },
  };

  return NextResponse.json(response, { status });
}

// Create standard success response
function successResponse<T>(
  data: T,
  service: string,
  action: string,
  startTime: number
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '2.0',
      service,
      action,
      executionTime: Date.now() - startTime,
    },
  };

  return NextResponse.json(response);
}

// Main route handler
async function handleRequest(
  req: NextRequest,
  params: Promise<{ service: string; action: string[] }>,
  method: string
): Promise<NextResponse> {
  const startTime = Date.now();
  const { service, action } = await params;
  const actionPath = action.join('/');
  

  try {
    // Validate service exists
    const handler = serviceHandlers[service];
    if (!handler) {
      return errorResponse(
        `Service '${service}' not found`,
        404,
        service,
        actionPath,
        startTime
      );
    }

    // Get current user (may be null for public endpoints)
    const user = await getCurrentUser();

    // Check if handler supports the method
    const methodHandler = handler[`handle${method}`];
    if (!methodHandler) {
      return errorResponse(
        `Method ${method} not supported for service '${service}'`,
        405,
        service,
        actionPath,
        startTime
      );
    }

    // Call the handler
    const result = await methodHandler.call(handler, req, action, user);

    // Check if the result is already a Response object (for file downloads, etc.)
    if (result instanceof Response) {
      return result;
    }

    // Check if the result indicates a failure
    if (result && typeof result === 'object' && 'success' in result && result.success === false) {
      // This is a business logic failure, not a system error
      // Return it with appropriate status code
      const status = result.status || 400;
      return NextResponse.json({
        success: false,
        error: result.error || 'Operation failed',
        code: result.code,
        details: result.details,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          service,
          action: actionPath,
          executionTime: Date.now() - startTime,
        },
      }, { status });
    }

    // Return success response
    return successResponse(result, service, actionPath, startTime);

  } catch (error) {
    // Get status code
    const status = error instanceof Error && 'status' in error ? (error as any).status : 500;
    
    // Only log errors that are not 401 (authentication errors are expected for non-authenticated users)
    if (status !== 401) {
      logError(error as Error, {
        service,
        action: actionPath,
        method,
        url: req.url,
      });
    }

    // Return error response
    const message = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : String(error))
      : 'Internal server error';

    return errorResponse(
      message,
      status,
      service,
      actionPath,
      startTime
    );
  }
}

// Export route handlers
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ service: string; action: string[] }> }
) {
  return handleRequest(req, params, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ service: string; action: string[] }> }
) {
  return handleRequest(req, params, 'POST');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ service: string; action: string[] }> }
) {
  return handleRequest(req, params, 'PUT');
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ service: string; action: string[] }> }
) {
  return handleRequest(req, params, 'PATCH');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ service: string; action: string[] }> }
) {
  return handleRequest(req, params, 'DELETE');
}