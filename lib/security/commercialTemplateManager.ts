import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getPool } from '@/lib/db';
import { validateCSV } from './fileValidators';

export interface BulkOrderTemplate {
  templateId: string;
  templateName: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  sampleData: any[];
  validationRules: TemplateValidationRules;
  minQuantity: number;
  maxQuantity: number;
}

export interface TemplateValidationRules {
  requiredFields: string[];
  fieldValidations: { [field: string]: FieldValidation };
  businessRules: BusinessRule[];
}

export interface FieldValidation {
  type: 'string' | 'number' | 'email' | 'phone' | 'enum' | 'date';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: string[];
}

export interface BusinessRule {
  rule: string;
  description: string;
  severity: 'error' | 'warning';
}

export interface BulkOrderUpload {
  uploadId: string;
  customerId: number;
  templateId: string;
  fileName: string;
  fileHash: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  totalAmount?: number;
  status: 'uploaded' | 'validating' | 'valid' | 'invalid' | 'processed' | 'rejected';
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  processedAt?: Date;
  createdAt: Date;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

/**
 * Commercial Template Manager for bulk blind orders
 */
export class CommercialTemplateManager {
  private static templates: Map<string, BulkOrderTemplate> = new Map();

  static {
    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default commercial templates
   */
  private static initializeDefaultTemplates(): void {
    // Commercial Blinds Template
    const commercialBlindsTemplate: BulkOrderTemplate = {
      templateId: 'commercial_blinds_v1',
      templateName: 'Commercial Blinds Bulk Order',
      description: 'Template for ordering 5+ commercial blinds with standardized specifications',
      requiredColumns: [
        'room_name',
        'blind_type',
        'width_inches',
        'height_inches',
        'color',
        'mount_type',
        'quantity',
        'installation_address',
        'preferred_install_date'
      ],
      optionalColumns: [
        'room_description',
        'special_instructions',
        'contact_person',
        'contact_phone',
        'urgency_level',
        'budget_code',
        'building_floor',
        'window_orientation'
      ],
      sampleData: [
        {
          room_name: 'Conference Room A',
          blind_type: 'Vertical Blinds',
          width_inches: 72,
          height_inches: 84,
          color: 'Neutral Gray',
          mount_type: 'Inside Mount',
          quantity: 3,
          installation_address: '123 Business Plaza, Suite 100, City, State 12345',
          preferred_install_date: '2024-02-15',
          room_description: 'Main conference room with east-facing windows',
          special_instructions: 'Install during business hours only',
          contact_person: 'John Smith',
          contact_phone: '555-123-4567',
          urgency_level: 'Standard',
          budget_code: 'DEPT-001',
          building_floor: '1st Floor',
          window_orientation: 'East'
        }
      ],
      validationRules: {
        requiredFields: [
          'room_name', 'blind_type', 'width_inches', 'height_inches', 
          'color', 'mount_type', 'quantity', 'installation_address', 'preferred_install_date'
        ],
        fieldValidations: {
          room_name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
          blind_type: { 
            type: 'enum', 
            required: true, 
            allowedValues: ['Vertical Blinds', 'Horizontal Blinds', 'Roller Shades', 'Cellular Shades', 'Wood Blinds', 'Aluminum Blinds']
          },
          width_inches: { type: 'number', required: true, min: 12, max: 120 },
          height_inches: { type: 'number', required: true, min: 12, max: 120 },
          color: { type: 'string', required: true, minLength: 2, maxLength: 50 },
          mount_type: { 
            type: 'enum', 
            required: true, 
            allowedValues: ['Inside Mount', 'Outside Mount', 'Ceiling Mount']
          },
          quantity: { type: 'number', required: true, min: 1, max: 50 },
          installation_address: { type: 'string', required: true, minLength: 10, maxLength: 200 },
          preferred_install_date: { type: 'date', required: true },
          contact_phone: { type: 'phone', required: false, pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,15}$' },
          urgency_level: { 
            type: 'enum', 
            required: false, 
            allowedValues: ['Low', 'Standard', 'High', 'Urgent']
          }
        },
        businessRules: [
          {
            rule: 'total_quantity_minimum',
            description: 'Total quantity across all rows must be at least 5 blinds',
            severity: 'error'
          },
          {
            rule: 'installation_date_future',
            description: 'Installation date must be at least 7 days in the future',
            severity: 'warning'
          },
          {
            rule: 'standard_sizes_preferred',
            description: 'Custom sizes (width > 96" or height > 96") may incur additional costs',
            severity: 'warning'
          }
        ]
      },
      minQuantity: 5,
      maxQuantity: 500
    };

    // Office Renovation Template
    const officeRenovationTemplate: BulkOrderTemplate = {
      templateId: 'office_renovation_v1',
      templateName: 'Office Renovation Blinds Package',
      description: 'Comprehensive template for office renovation projects with multiple room types',
      requiredColumns: [
        'project_name',
        'room_type',
        'room_identifier',
        'blind_type',
        'width_inches',
        'height_inches',
        'color_scheme',
        'mount_type',
        'quantity',
        'building_address',
        'target_completion_date'
      ],
      optionalColumns: [
        'room_function',
        'privacy_level',
        'light_control_preference',
        'energy_efficiency_rating',
        'maintenance_requirements',
        'warranty_period',
        'installation_priority',
        'budget_allocation'
      ],
      sampleData: [
        {
          project_name: 'ABC Corp Office Renovation',
          room_type: 'Conference Room',
          room_identifier: 'CR-001',
          blind_type: 'Cellular Shades',
          width_inches: 60,
          height_inches: 72,
          color_scheme: 'Corporate Blue',
          mount_type: 'Inside Mount',
          quantity: 4,
          building_address: '456 Corporate Center, Floor 5, Business City, State 12345',
          target_completion_date: '2024-03-01',
          room_function: 'Executive meetings and presentations',
          privacy_level: 'High',
          light_control_preference: 'Blackout',
          energy_efficiency_rating: 'Energy Star',
          maintenance_requirements: 'Low maintenance preferred',
          warranty_period: '5 years',
          installation_priority: 'High',
          budget_allocation: 'CAPEX-2024'
        }
      ],
      validationRules: {
        requiredFields: [
          'project_name', 'room_type', 'room_identifier', 'blind_type', 
          'width_inches', 'height_inches', 'color_scheme', 'mount_type', 
          'quantity', 'building_address', 'target_completion_date'
        ],
        fieldValidations: {
          project_name: { type: 'string', required: true, minLength: 5, maxLength: 100 },
          room_type: { 
            type: 'enum', 
            required: true, 
            allowedValues: ['Office', 'Conference Room', 'Reception', 'Lobby', 'Break Room', 'Executive Office', 'Open Workspace', 'Meeting Room']
          },
          room_identifier: { type: 'string', required: true, minLength: 2, maxLength: 20 },
          blind_type: { 
            type: 'enum', 
            required: true, 
            allowedValues: ['Vertical Blinds', 'Horizontal Blinds', 'Roller Shades', 'Cellular Shades', 'Wood Blinds', 'Aluminum Blinds', 'Solar Screens']
          },
          width_inches: { type: 'number', required: true, min: 12, max: 144 },
          height_inches: { type: 'number', required: true, min: 12, max: 144 },
          color_scheme: { type: 'string', required: true, minLength: 3, maxLength: 50 },
          mount_type: { 
            type: 'enum', 
            required: true, 
            allowedValues: ['Inside Mount', 'Outside Mount', 'Ceiling Mount', 'Wall Mount']
          },
          quantity: { type: 'number', required: true, min: 1, max: 100 },
          building_address: { type: 'string', required: true, minLength: 15, maxLength: 300 },
          target_completion_date: { type: 'date', required: true },
          privacy_level: { 
            type: 'enum', 
            required: false, 
            allowedValues: ['Low', 'Medium', 'High', 'Maximum']
          },
          light_control_preference: { 
            type: 'enum', 
            required: false, 
            allowedValues: ['Light Filtering', 'Room Darkening', 'Blackout', 'Sheer']
          },
          installation_priority: { 
            type: 'enum', 
            required: false, 
            allowedValues: ['Low', 'Medium', 'High', 'Critical']
          }
        },
        businessRules: [
          {
            rule: 'minimum_project_size',
            description: 'Office renovation projects must include at least 10 blinds total',
            severity: 'error'
          },
          {
            rule: 'completion_date_realistic',
            description: 'Target completion date should allow at least 14 days for manufacturing and installation',
            severity: 'warning'
          },
          {
            rule: 'room_identifier_unique',
            description: 'Each room identifier should be unique within the project',
            severity: 'error'
          }
        ]
      },
      minQuantity: 10,
      maxQuantity: 1000
    };

    this.templates.set(commercialBlindsTemplate.templateId, commercialBlindsTemplate);
    this.templates.set(officeRenovationTemplate.templateId, officeRenovationTemplate);
  }

  /**
   * Get all available templates
   */
  static getAvailableTemplates(): BulkOrderTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get specific template by ID
   */
  static getTemplate(templateId: string): BulkOrderTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Generate CSV template file
   */
  static generateCSVTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create CSV header
    const allColumns = [...template.requiredColumns, ...template.optionalColumns];
    const csvHeader = allColumns.join(',');

    // Create sample row
    const sampleRow = template.sampleData[0];
    const csvSampleRow = allColumns.map(col => {
      const value = sampleRow[col] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');

    // Create validation comments
    const validationComments = [
      '# Commercial Blinds Bulk Order Template',
      `# Template: ${template.templateName}`,
      `# Description: ${template.description}`,
      `# Minimum Quantity: ${template.minQuantity} blinds`,
      `# Maximum Quantity: ${template.maxQuantity} blinds`,
      '# ',
      '# Required Fields: ' + template.requiredColumns.join(', '),
      '# Optional Fields: ' + template.optionalColumns.join(', '),
      '# ',
      '# Instructions:',
      '# 1. Fill in all required fields',
      '# 2. Delete this comment section before uploading',
      '# 3. Ensure total quantity is at least ' + template.minQuantity + ' blinds',
      '# 4. Use exact values for enum fields as specified',
      '# ',
      '# Sample Data Row (replace with your data):',
      ''
    ].join('\n');

    return validationComments + csvHeader + '\n' + csvSampleRow;
  }

  /**
   * Validate uploaded CSV against template
   */
  static async validateUploadedCSV(
    customerId: number,
    templateId: string,
    csvContent: string,
    fileName: string
  ): Promise<BulkOrderUpload> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Invalid template ID');
    }

    const uploadId = this.generateUploadId(customerId);
    const fileHash = createHash('sha256').update(csvContent).digest('hex');

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    if (lines.length < 2) {
      throw new Error('CSV must contain header and at least one data row');
    }

    const headers = this.parseCSVRow(lines[0]);
    const dataRows = lines.slice(1).map((line, index) => ({
      rowNumber: index + 2, // +2 because of header and 0-based index
      data: this.parseCSVRow(line)
    }));

    // Validate headers
    const missingRequired = template.requiredColumns.filter(col => !headers.includes(col));
    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    // Validate each row
    const validationErrors: ValidationError[] = [];
    const validationWarnings: ValidationWarning[] = [];
    let validRows = 0;
    let totalQuantity = 0;

    for (const row of dataRows) {
      const rowData = this.mapRowToObject(headers, row.data);
      const rowErrors = this.validateRow(rowData, template, row.rowNumber);
      
      if (rowErrors.errors.length === 0) {
        validRows++;
        totalQuantity += parseInt(rowData.quantity) || 0;
      }

      validationErrors.push(...rowErrors.errors);
      validationWarnings.push(...rowErrors.warnings);
    }

    // Business rule validations
    const businessRuleErrors = this.validateBusinessRules(dataRows, template, totalQuantity);
    validationErrors.push(...businessRuleErrors);

    const upload: BulkOrderUpload = {
      uploadId,
      customerId,
      templateId,
      fileName,
      fileHash,
      rowCount: dataRows.length,
      validRows,
      invalidRows: dataRows.length - validRows,
      totalAmount: undefined, // Calculate after price lookup
      status: validationErrors.length === 0 ? 'valid' : 'invalid',
      validationErrors,
      validationWarnings,
      createdAt: new Date()
    };

    // Store upload record
    await this.storeUploadRecord(upload);

    return upload;
  }

  /**
   * Check if customer is eligible for commercial templates
   */
  static async isCustomerEligibleForCommercial(customerId: number): Promise<{
    eligible: boolean;
    reason?: string;
    requirements?: string[];
  }> {
    const pool = await getPool();
    
    // Check customer order history
    const [orders] = await pool.execute(`
      SELECT COUNT(*) as order_count, SUM(total_amount) as total_spent
      FROM orders 
      WHERE user_id = ? AND order_status IN ('completed', 'delivered')
    `, [customerId]);

    const orderHistory = (orders as any)[0];

    // Check if customer has business account
    const [userInfo] = await pool.execute(`
      SELECT role, email, first_name, last_name 
      FROM users 
      WHERE user_id = ?
    `, [customerId]);

    const user = (userInfo as any)[0];

    const requirements: string[] = [];
    let eligible = true;
    let reason = '';

    // Business email check
    if (!user.email.match(/\.(com|org|net|edu|gov)$/)) {
      requirements.push('Business email address');
    }

    // Order history check
    if (orderHistory.order_count < 2) {
      eligible = false;
      reason = 'Minimum 2 completed orders required for commercial templates';
      requirements.push('At least 2 completed orders');
    }

    // Spending threshold check
    if (orderHistory.total_spent < 500) {
      eligible = false;
      reason = 'Minimum $500 in completed orders required';
      requirements.push('At least $500 in completed orders');
    }

    return {
      eligible,
      reason: eligible ? undefined : reason,
      requirements: requirements.length > 0 ? requirements : undefined
    };
  }

  // Private helper methods

  private static parseCSVRow(csvRow: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvRow.length; i++) {
      const char = csvRow[i];
      
      if (char === '"') {
        if (inQuotes && csvRow[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static mapRowToObject(headers: string[], values: string[]): any {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  }

  private static validateRow(
    rowData: any, 
    template: BulkOrderTemplate, 
    rowNumber: number
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [field, validation] of Object.entries(template.validationRules.fieldValidations)) {
      const value = rowData[field];
      
      // Required field check
      if (validation.required && (!value || value.toString().trim() === '')) {
        errors.push({
          row: rowNumber,
          field,
          value,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error'
        });
        continue;
      }

      if (!value || value.toString().trim() === '') continue;

      // Type-specific validations
      switch (validation.type) {
        case 'number':
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must be a number`,
              severity: 'error'
            });
          } else {
            if (validation.min !== undefined && numValue < validation.min) {
              errors.push({
                row: rowNumber,
                field,
                value,
                message: `Field '${field}' must be at least ${validation.min}`,
                severity: 'error'
              });
            }
            if (validation.max !== undefined && numValue > validation.max) {
              errors.push({
                row: rowNumber,
                field,
                value,
                message: `Field '${field}' must not exceed ${validation.max}`,
                severity: 'error'
              });
            }
          }
          break;

        case 'enum':
          if (validation.allowedValues && !validation.allowedValues.includes(value)) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must be one of: ${validation.allowedValues.join(', ')}`,
              severity: 'error'
            });
          }
          break;

        case 'string':
          if (validation.minLength && value.length < validation.minLength) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must be at least ${validation.minLength} characters`,
              severity: 'error'
            });
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must not exceed ${validation.maxLength} characters`,
              severity: 'error'
            });
          }
          break;

        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must be a valid date (YYYY-MM-DD format)`,
              severity: 'error'
            });
          }
          break;

        case 'phone':
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            errors.push({
              row: rowNumber,
              field,
              value,
              message: `Field '${field}' must be a valid phone number`,
              severity: 'error'
            });
          }
          break;
      }
    }

    return { errors, warnings };
  }

  private static validateBusinessRules(
    dataRows: any[],
    template: BulkOrderTemplate,
    totalQuantity: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of template.validationRules.businessRules) {
      switch (rule.rule) {
        case 'total_quantity_minimum':
        case 'minimum_project_size':
          if (totalQuantity < template.minQuantity) {
            errors.push({
              row: 0,
              field: 'quantity',
              value: totalQuantity,
              message: `Total quantity (${totalQuantity}) is below minimum requirement (${template.minQuantity})`,
              severity: rule.severity as 'error' | 'warning'
            });
          }
          break;

        case 'room_identifier_unique':
          const roomIds = dataRows.map(row => row.data[2]); // Assuming room_identifier is 3rd column
          const duplicates = roomIds.filter((id, index) => roomIds.indexOf(id) !== index);
          if (duplicates.length > 0) {
            errors.push({
              row: 0,
              field: 'room_identifier',
              value: duplicates.join(', '),
              message: `Duplicate room identifiers found: ${duplicates.join(', ')}`,
              severity: 'error'
            });
          }
          break;
      }
    }

    return errors;
  }

  private static generateUploadId(customerId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `bulk_${customerId}_${timestamp}_${random}`;
  }

  private static async storeUploadRecord(upload: BulkOrderUpload): Promise<void> {
    const pool = await getPool();
    
    await pool.execute(`
      INSERT INTO customer_bulk_uploads (
        upload_id, customer_id, template_id, file_name, file_hash,
        row_count, valid_rows, invalid_rows, status,
        validation_errors, validation_warnings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      upload.uploadId,
      upload.customerId,
      upload.templateId,
      upload.fileName,
      upload.fileHash,
      upload.rowCount,
      upload.validRows,
      upload.invalidRows,
      upload.status,
      JSON.stringify(upload.validationErrors),
      JSON.stringify(upload.validationWarnings)
    ]);
  }
}