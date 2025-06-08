# Database Migrations

## Current Schema

The main database schema is maintained in a single file for easier management:

- **`complete_blinds_schema.sql`** - Complete database schema including all tables, indexes, views, and default data

## Usage

To set up the complete database from scratch:

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE blindscommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run the complete schema
mysql -u root -p blindscommerce < migrations/complete_blinds_schema.sql
```

## Schema Overview

### Core Tables
- `users` - User accounts and authentication
- `categories` - Product categories
- `orders` - Order management
- `vendor_info` - Vendor business information

### Commercial Bulk Order System
- `customer_bulk_uploads` - CSV upload tracking
- `bulk_order_items` - Parsed CSV line items
- `bulk_order_processing` - Workflow management
- `bulk_order_communications` - Order communications
- `bulk_order_pricing_history` - Pricing versions and history

### File Management & Security
- `vendor_files` - Vendor file uploads with security scanning
- `customer_files` - Customer file uploads
- `vendor_upload_logs` - Upload activity audit trail
- `customer_upload_logs` - Customer upload audit trail
- `upload_security_incidents` - Security incident tracking
- `upload_security_config` - Dynamic security configuration

### Views
- `bulk_order_summary` - Summary view for bulk orders
- `active_vendor_files` - Non-deleted vendor files
- `active_customer_files` - Non-deleted customer files  
- `security_dashboard` - Security incident overview

## Archived Files

Previous migration files have been moved to `migrations/archived/` for reference:
- `blindsschema.sql` - Original comprehensive schema
- `create_secure_upload_tables.sql` - Security-focused file upload tables
- `create_bulk_order_tables.sql` - Bulk order system tables
- `minimal_schema.sql` - Minimal schema for testing
- `add_missing_bulk_order_tables.sql` - Additional bulk order tables

## Key Features

### Security
- SHA256 file hash integrity checking
- Malicious content scanning and quarantine
- Upload quota management
- Comprehensive audit trails
- Dynamic security configuration

### Commercial Bulk Orders
- CSV template system for 5+ blind orders
- Automated validation and pricing
- Bulk discount calculation
- Workflow management with approval process
- Customer eligibility verification

### File Management
- Organized vendor folder structure: `vendor_{id}_{name}/category/`
- Duplicate file prevention
- File type and size validation
- Secure file storage with access controls