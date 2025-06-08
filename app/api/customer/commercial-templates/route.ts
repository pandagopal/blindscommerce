import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CommercialTemplateManager } from '@/lib/security/commercialTemplateManager';
import { apiRateLimiter } from '@/lib/security/validation';

// GET - Download commercial templates
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if customer is eligible for commercial templates
    const eligibility = await CommercialTemplateManager.isCustomerEligibleForCommercial(user.userId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: 'Commercial template access denied',
          reason: eligibility.reason,
          requirements: eligibility.requirements
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const format = searchParams.get('format') || 'json';

    if (templateId) {
      // Download specific template
      const template = CommercialTemplateManager.getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      if (format === 'csv') {
        // Generate CSV template
        const csvContent = CommercialTemplateManager.generateCSVTemplate(templateId);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${template.templateName.replace(/[^a-zA-Z0-9]/g, '_')}_template.csv"`
          }
        });
      } else {
        // Return template as JSON
        return NextResponse.json({
          success: true,
          template
        });
      }
    } else {
      // List all available templates
      const templates = CommercialTemplateManager.getAvailableTemplates();
      
      return NextResponse.json({
        success: true,
        templates: templates.map(template => ({
          templateId: template.templateId,
          templateName: template.templateName,
          description: template.description,
          minQuantity: template.minQuantity,
          maxQuantity: template.maxQuantity,
          requiredColumns: template.requiredColumns,
          optionalColumns: template.optionalColumns
        })),
        eligibility: {
          eligible: true,
          requirements: eligibility.requirements
        }
      });
    }

  } catch (error) {
    console.error('Commercial template access error:', error);
    return NextResponse.json(
      { error: 'Failed to access commercial templates' },
      { status: 500 }
    );
  }
}