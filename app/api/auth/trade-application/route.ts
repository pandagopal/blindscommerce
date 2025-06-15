import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const applicationData = {
      businessName: formData.get('businessName') as string,
      businessType: formData.get('businessType') as string,
      businessAddress: formData.get('businessAddress') as string,
      businessCity: formData.get('businessCity') as string,
      businessState: formData.get('businessState') as string,
      businessZip: formData.get('businessZip') as string,
      businessPhone: formData.get('businessPhone') as string,
      businessEmail: formData.get('businessEmail') as string,
      website: formData.get('website') as string,
      licenseNumber: formData.get('licenseNumber') as string,
      yearsInBusiness: parseInt(formData.get('yearsInBusiness') as string),
      portfolioLinks: formData.get('portfolioLinks') as string,
      references: formData.get('references') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      title: formData.get('title') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      requestedDiscountLevel: formData.get('requestedDiscountLevel') as string,
      paymentTerms: formData.get('paymentTerms') as string,
      creditLimit: parseInt(formData.get('creditLimit') as string),
    };

    // Handle file uploads (in a real implementation, you'd upload to cloud storage)
    const businessLicense = formData.get('businessLicense') as File;
    const insuranceCertificate = formData.get('insuranceCertificate') as File;
    const portfolioSamples = formData.get('portfolioSamples') as File;

    // Basic validation
    if (!applicationData.businessName || !applicationData.firstName || !applicationData.lastName || !applicationData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if application already exists for this email
    const [existingApplications] = await pool.execute(
      'SELECT application_id FROM trade_applications WHERE email = ? OR business_email = ?',
      [applicationData.email, applicationData.businessEmail]
    );

    if (Array.isArray(existingApplications) && existingApplications.length > 0) {
      return NextResponse.json(
        { error: 'An application already exists for this email address' },
        { status: 409 }
      );
    }

    // Insert trade application
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO trade_applications (
        business_name, business_type, business_address, business_city, business_state, 
        business_zip, business_phone, business_email, website, license_number, 
        years_in_business, portfolio_links, references, first_name, last_name, 
        title, email, phone, requested_discount_level, payment_terms, credit_limit,
        status, application_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        applicationData.businessName,
        applicationData.businessType,
        applicationData.businessAddress,
        applicationData.businessCity,
        applicationData.businessState,
        applicationData.businessZip,
        applicationData.businessPhone,
        applicationData.businessEmail,
        applicationData.website || null,
        applicationData.licenseNumber || null,
        applicationData.yearsInBusiness,
        applicationData.portfolioLinks || null,
        applicationData.references || null,
        applicationData.firstName,
        applicationData.lastName,
        applicationData.title,
        applicationData.email,
        applicationData.phone,
        applicationData.requestedDiscountLevel,
        applicationData.paymentTerms,
        applicationData.creditLimit,
      ]
    );

    const applicationId = result.insertId;

    // Store file information (in a real app, you'd upload files to cloud storage first)
    if (businessLicense) {
      await pool.execute(
        `INSERT INTO trade_application_documents (application_id, document_type, file_name, file_size) 
         VALUES (?, 'business_license', ?, ?)`,
        [applicationId, businessLicense.name, businessLicense.size]
      );
    }

    if (insuranceCertificate) {
      await pool.execute(
        `INSERT INTO trade_application_documents (application_id, document_type, file_name, file_size) 
         VALUES (?, 'insurance_certificate', ?, ?)`,
        [applicationId, insuranceCertificate.name, insuranceCertificate.size]
      );
    }

    if (portfolioSamples) {
      await pool.execute(
        `INSERT INTO trade_application_documents (application_id, document_type, file_name, file_size) 
         VALUES (?, 'portfolio_samples', ?, ?)`,
        [applicationId, portfolioSamples.name, portfolioSamples.size]
      );
    }

    // Send notification email (implement email service)
    // await sendTradeApplicationNotification(applicationData);

    return NextResponse.json({
      message: 'Trade application submitted successfully',
      applicationId: applicationId,
    });

  } catch (error) {
    console.error('Trade application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit trade application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();

    let query = `
      SELECT 
        application_id,
        business_name,
        business_type,
        first_name,
        last_name,
        email,
        phone,
        status,
        requested_discount_level,
        payment_terms,
        credit_limit,
        application_date,
        reviewed_date,
        reviewed_by
      FROM trade_applications
    `;

    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY application_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [applications] = await pool.execute(query, params);

    return NextResponse.json({
      applications,
      total: Array.isArray(applications) ? applications.length : 0,
    });

  } catch (error) {
    console.error('Get trade applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade applications' },
      { status: 500 }
    );
  }
}