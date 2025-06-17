# Vendor System Documentation

## Overview
The blindscommerce application includes a comprehensive vendor management system that allows vendors to manage their products, orders, commissions, and analytics.

## Database Schema

### Core Vendor Tables

#### 1. `vendor_info`
Main vendor profile table that stores business information.

```sql
CREATE TABLE `vendor_info` (
  `vendor_info_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `business_name` varchar(255) NOT NULL,
  `business_email` varchar(255) NOT NULL,
  `business_phone` varchar(50) DEFAULT NULL,
  `business_description` text,
  `logo_url` varchar(255) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `year_established` int DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_date` timestamp NULL DEFAULT NULL,
  `approval_status` varchar(50) DEFAULT 'pending',
  `tax_id` varchar(100) DEFAULT NULL,
  `business_address_line1` varchar(255) DEFAULT NULL,
  `business_address_line2` varchar(255) DEFAULT NULL,
  `business_city` varchar(100) DEFAULT NULL,
  `business_state` varchar(100) DEFAULT NULL,
  `business_postal_code` varchar(20) DEFAULT NULL,
  `business_country` varchar(100) DEFAULT 'United States',
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `rating` decimal(3,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `commission_rate` decimal(5,2) DEFAULT '15.00',
  `payment_terms` enum('weekly','bi_weekly','monthly','quarterly') DEFAULT 'monthly',
  `minimum_payout` decimal(8,2) DEFAULT '50.00',
  `payment_method` enum('bank_transfer','paypal','check','stripe') DEFAULT 'bank_transfer',
  `bank_account_info` json DEFAULT NULL,
  `paypal_email` varchar(255) DEFAULT NULL,
  `tax_form_submitted` tinyint(1) DEFAULT '0',
  `auto_payout_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`vendor_info_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
)
```

#### 2. `vendor_products`
Links vendors to products they sell.

```sql
CREATE TABLE `vendor_products` (
  `vendor_product_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `product_id` int NOT NULL,
  `vendor_sku` varchar(100) DEFAULT NULL,
  `vendor_price` decimal(10,2) DEFAULT NULL,
  `quantity_available` int DEFAULT '0',
  `minimum_order_qty` int DEFAULT '1',
  `lead_time_days` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `vendor_description` text,
  `vendor_notes` text,
  PRIMARY KEY (`vendor_product_id`),
  UNIQUE KEY `vendor_product` (`vendor_id`,`product_id`),
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
)
```

#### 3. `vendor_commissions`
Tracks commission calculations for vendor sales.

```sql
CREATE TABLE `vendor_commissions` (
  `commission_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `order_id` int NOT NULL,
  `order_item_id` int DEFAULT NULL,
  `product_id` int NOT NULL,
  `sale_amount` decimal(10,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `commission_status` enum('pending','approved','paid','cancelled') DEFAULT 'pending',
  `commission_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `payment_date` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`commission_id`),
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`order_item_id`) ON DELETE CASCADE
)
```

#### 4. `vendor_files`
Manages vendor file uploads with security.

```sql
CREATE TABLE `vendor_files` (
  `file_id` varchar(100) NOT NULL,
  `vendor_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `upload_type` enum('productImages','productVideos','csvFiles','documents') NOT NULL,
  `file_size` bigint NOT NULL,
  `file_format` varchar(50) NOT NULL,
  `file_hash` varchar(64) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`file_id`),
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
)
```

#### 5. `vendor_discounts`
Vendor-specific discount management.

```sql
CREATE TABLE `vendor_discounts` (
  `discount_id` int AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` int NOT NULL,
  `discount_name` varchar(200) NOT NULL,
  `discount_type` enum('percentage', 'fixed_amount', 'tiered', 'bulk_pricing') NOT NULL,
  `discount_value` decimal(8,2) NOT NULL,
  `minimum_order_value` decimal(10,2) DEFAULT 0.00,
  `applies_to` enum('all_vendor_products', 'specific_products', 'specific_categories') DEFAULT 'all_vendor_products',
  `admin_approved` boolean DEFAULT FALSE,
  `is_active` boolean DEFAULT TRUE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
)
```

## API Endpoints

### Vendor Portal APIs (`/api/vendor/*`)

1. **Products Management**
   - `GET /api/vendor/products` - Get vendor's products
   - `POST /api/vendor/products` - Create new product

2. **Orders Management**
   - `GET /api/vendor/orders` - Get vendor's orders
   - `GET /api/vendor/orders/[orderId]` - Get specific order details

3. **Analytics**
   - `GET /api/vendor/analytics` - Get vendor analytics and metrics

4. **Commissions**
   - `GET /api/vendor/commissions` - Get commission details and earnings
   - `POST /api/vendor/commissions` - Generate commission records

5. **File Management**
   - `POST /api/vendor/upload` - Upload vendor files
   - `GET /api/vendor/files` - Get vendor's uploaded files

6. **Profile**
   - `GET /api/vendor/profile` - Get vendor profile
   - `PUT /api/vendor/profile` - Update vendor profile

7. **Catalog**
   - `GET /api/vendor/catalog` - Get vendor's product catalog

### Admin Vendor Management APIs (`/api/admin/vendors/*`)

1. **Vendor CRUD**
   - `GET /api/admin/vendors` - List all vendors with search/filter
   - `POST /api/admin/vendors` - Create new vendor
   - `GET /api/admin/vendors/[id]` - Get vendor details
   - `PUT /api/admin/vendors/[id]` - Update vendor
   - `DELETE /api/admin/vendors/[id]` - Delete vendor

2. **Pricing & Commissions**
   - `GET /api/admin/pricing/commissions` - Manage commission rules
   - `GET /api/admin/pricing/vendor-discounts` - Manage vendor discounts

## Frontend Components

### Vendor Portal Pages (`/app/vendor/*`)

1. **Layout** (`/app/vendor/layout.tsx`)
   - Vendor portal navigation
   - Authentication check
   - Role-based access control

2. **Dashboard** (`/app/vendor/page.tsx`)
   - Overview statistics
   - Recent orders
   - Quick actions

3. **Products** (`/app/vendor/products/*`)
   - Product listing
   - Add/Edit product forms
   - Product configuration

4. **Orders** (`/app/vendor/orders/*`)
   - Order listing
   - Order details
   - Order status management

5. **Analytics** (`/app/vendor/analytics/page.tsx`)
   - Sales metrics
   - Performance charts
   - Revenue trends

6. **Payments** (`/app/vendor/payments/page.tsx`)
   - Commission tracking
   - Payment history
   - Payout settings

### Admin Vendor Management (`/app/admin/vendors/*`)

1. **Vendor List** (`/app/admin/vendors/page.tsx`)
   - Vendor table with search
   - Status management
   - Quick actions

2. **Vendor Form** (`/app/admin/vendors/VendorForm.tsx`)
   - Create/Edit vendor form
   - Business information
   - Contact details

## Security Features

### File Upload Security (`/lib/security/vendorUploadSecurity.ts`)

1. **Upload Limits**
   - Product images: Max 10 files, 2MB each
   - Product videos: Max 3 files, 50MB each
   - CSV files: Max 5 files, 10MB each
   - Business documents: Max 10 files, 10MB each

2. **File Validation**
   - MIME type checking
   - Magic byte validation
   - Content scanning for malicious code
   - Image dimension validation

3. **Storage Structure**
   - Organized by vendor: `/uploads/vendor_{id}_{name}/category/`
   - Secure file naming with unique IDs
   - Hash-based duplicate detection

### Vendor File Manager (`/lib/security/vendorFileManager.ts`)

1. **Features**
   - Organized folder structure per vendor
   - Category-based file organization
   - Duplicate file prevention
   - Secure file deletion
   - Upload quota management

2. **File Categories**
   - window_blinds
   - roller_shades
   - cellular_shades
   - wood_blinds
   - vertical_blinds
   - shutters
   - curtains
   - videos
   - documents
   - csv_data

## Authentication & Authorization

### Middleware (`/middleware.ts`)
- Protects vendor routes requiring authentication
- Verifies JWT tokens
- Role-based access control

### Role Checks
- Vendor role required for `/vendor/*` routes
- Admin role can access vendor management
- Vendors can only access their own data

## Commission System

### Commission Calculation
- Default rate: 15%
- Configurable per vendor
- Automatic calculation on order completion
- Monthly/quarterly payout options

### Commission Tracking
- Pending commissions
- Paid commissions
- Commission history
- Monthly earnings trends

## Key Features

1. **Multi-vendor Support**
   - Independent vendor accounts
   - Separate product catalogs
   - Individual commission rates

2. **Product Management**
   - Vendor-specific SKUs
   - Custom pricing
   - Inventory tracking
   - Lead time management

3. **Order Processing**
   - Vendor order visibility
   - Status updates
   - Shipment tracking

4. **Analytics & Reporting**
   - Sales metrics
   - Revenue tracking
   - Performance analytics
   - Top product reports

5. **File Management**
   - Secure file uploads
   - Organized storage
   - Duplicate prevention
   - Quota management

6. **Commission Management**
   - Automatic calculation
   - Payment tracking
   - Payout scheduling
   - Earnings reports

## Integration Points

1. **User System**
   - Vendors are users with 'vendor' role
   - Linked via user_id in vendor_info table

2. **Product System**
   - Products linked to vendors via vendor_products
   - Vendor-specific pricing and inventory

3. **Order System**
   - Orders tracked by vendor
   - Commission calculation on completion

4. **Payment System**
   - Commission payouts
   - Multiple payment methods
   - Automated payment scheduling

## Future Enhancements

1. **Advanced Analytics**
   - Predictive sales forecasting
   - Customer behavior analysis
   - Product performance insights

2. **Marketing Tools**
   - Vendor promotions
   - Featured products
   - Email campaigns

3. **API Integration**
   - External marketplace sync
   - Inventory management systems
   - Shipping integrations

4. **Mobile App**
   - Vendor mobile dashboard
   - Order notifications
   - Quick product updates

So We Have Two Different Pricing Systems:

    1. Main Pricing Matrix Tab → product_pricing_matrix (width x height grid)
    2. Fabric Pricing Matrix → product_fabric_pricing (width ranges per fabric type)

⏺ Exactly! You've identified the key distinction. There are indeed two separate pricing systems:

  1. Main Pricing Matrix Tab

  - Table: product_pricing_matrix
  - Structure: Width × Height grid pricing
  - Columns: width_min, width_max, height_min, height_max, base_price, price_per_sqft
  - Purpose: Overall product pricing based on dimensions
  - Component: PricingMatrix.tsx

  2. Fabric Pricing Matrix

  - Table: product_fabric_pricing
  - Structure: Width ranges per fabric type (no height consideration)
  - Columns: min_width, max_width, price_per_sqft (linked to fabric_option_id)
  - Purpose: Additional fabric-specific pricing per square foot
  - Component: Fabric price matrix within Fabric.tsx

  Key Differences:
  - Main pricing considers both width AND height ranges
  - Fabric pricing only considers width ranges (height is handled differently)
  - Main pricing sets base product price
  - Fabric pricing adds fabric-specific costs on top

  Database Verification:
  - product_pricing_matrix: Contains the main dimensional pricing grid
  - product_fabric_pricing: Contains fabric-specific width-based pricing (where we found the 10, 11, 20, 23 values)

  This dual pricing system allows for:
  1. Base product pricing by dimensions (main matrix)
  2. Additional fabric upgrade costs by width ranges (fabric matrix)

  The final customer price would be: Base Price + Fabric Price + Any other options