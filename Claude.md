# Claude's BlindsCommerce Application Reference

## 🏗️ Project Overview

**BlindsCommerce** is a comprehensive e-commerce platform for custom window treatments (blinds, shades, shutters, etc.) built with Next.js 14. It features a sophisticated multi-role system supporting customers, vendors, sales representatives, installers, and administrators.

### Key Business Model
- **Multi-vendor marketplace** (like Amazon for blinds)
- **B2B/B2C hybrid** with specialized user roles
- **Custom product configuration** with real-time pricing
- **Installation services** and smart home integration
- **Advanced AI/AR features** for product visualization

---

## 🚀 Tech Stack & Dependencies

### Core Framework
- **Next.js 15.2.0** with App Router
- **React 18.3.1** with TypeScript 5.8.3
- **Tailwind CSS 3.4.17** with custom design system
- **MySQL** database with connection pooling

### Key Libraries
- **Authentication**: JWT with `jose`, bcrypt for password hashing
- **UI Components**: Radix UI primitives + Shadcn/UI
- **Database**: MySQL2 with Prisma schema
- **Forms**: React Hook Form with Zod validation
- **Payments**: Stripe, PayPal, Braintree (BNPL)
- **Real-time**: Socket.IO for live chat/notifications
- **3D/AR**: Three.js, React Three Fiber, TensorFlow.js
- **Email**: Nodemailer with cron jobs
- **File Upload**: Sharp for image processing

### Build Tools
- **Biome** for linting and formatting
- **ESLint** configuration
- **PostCSS** for CSS processing
- **Netlify** deployment configuration

---

## 📁 Project Structure

```
/app                    # Next.js App Router pages
├── /account           # Customer dashboard pages
├── /admin             # Admin portal (comprehensive management)
├── /api               # API routes (REST endpoints)
├── /components        # Page-specific components
├── /products          # Product catalog and configuration
├── /sales             # Sales representative portal
├── /installer         # Installer job management
├── /vendor            # Vendor management pages
└── /storefront        # Individual vendor storefronts

/components             # Reusable UI components
├── /ui                # Shadcn/UI component library
├── /products          # Product-related components
├── /payments          # Payment processing components
├── /admin             # Admin-specific components
└── /[domain]          # Feature-specific components

/lib                    # Utility libraries and services
├── /auth              # Authentication system
├── /db                # Database connection and utilities
├── /security          # Validation, rate limiting, file upload
├── /smart-home        # IoT device integration
└── /utils             # General utilities

/context               # React Context providers
/prisma                # Database schema
/public                # Static assets
/scripts               # Database and maintenance scripts
```

---

## 🔐 Authentication & User Roles

### Authentication System
- **JWT tokens** with 24-hour expiration
- **HTTP-only cookies** for security
- **Role-based access control** with comprehensive middleware protection
- **Password requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Role hierarchy enforcement** with permission-based access control

### Registration & User Creation Rules
- **Public Registration**: ONLY for customers via `/register` page
- **Business Accounts**: Created by admins via `/admin/users/new`
- **Sales Teams**: Created by vendors via `/vendor/sales-team`
- **Role Validation**: Enforced at API level with proper hierarchy checks

### Complete User Role Hierarchy

#### 1. **Super Admin** (Level 100)
- **Platform ownership** with complete system access
- Can create: Admin, Vendor, Installer, Customer, Trade Professional
- Can manage: All user types and roles
- Permissions: Full system control, financial access, analytics

#### 2. **Admin** (Level 90)
- **Platform administration** with broad access
- Can create: Vendor, Installer, Trade Professional
- Can manage: Vendors, installers, customers, trade professionals
- Permissions: User management, vendor approval, order management, analytics

#### 3. **Vendor** (Level 70)
- **Business partner** selling products on platform
- Can create: Sales Representatives
- Can manage: Own sales team
- Permissions: Product management, order fulfillment, storefront control, sales team management

#### 4. **Installer** (Level 60)
- **Professional installation services**
- Can create: None
- Can manage: None
- Permissions: Installation jobs, measurements, customer contact for assigned work

#### 5. **Sales Representative** (Level 50)
- **Vendor's sales team member**
- Can create: None
- Can manage: None
- Permissions: Lead management, quotes, commission tracking, assigned customer contact

#### 6. **Trade Professional** (Level 40)
- **B2B customers** (designers, architects, contractors)
- Can create: None
- Can manage: None
- Permissions: Trade pricing access, project management, client management

#### 7. **Customer** (Level 10)
- **Regular consumers** purchasing window treatments
- Can create: None (self-registration only)
- Can manage: Own account
- Permissions: Shopping, orders, account management, reviews

### Role Hierarchy Implementation Files

#### Core System Files
- **`/lib/roleHierarchy.ts`**: Complete role definitions, permissions, and hierarchy logic
- **`/lib/middleware/roleGuard.ts`**: Role-based access control middleware and utilities
- **`/app/api/auth/register/route.ts`**: Enforces customer-only public registration
- **`/app/register/page.tsx`**: Updated UI with customer-only messaging

#### Admin User Management
- **`/app/admin/users/new/page.tsx`**: Dynamic role selection based on current user permissions
- **`/app/api/admin/users/route.ts`**: Handles creation of all business role types

#### Vendor Sales Team Management
- **`/app/vendor/sales-team/page.tsx`**: Complete sales team management interface
- **`/api/vendor/sales-team/route.ts`**: API for vendor to create/manage sales staff

### E-commerce Competitive Strategy
This role system enables competition with Amazon through:
- **Marketplace functionality** via vendor ecosystem
- **B2B sales capabilities** through trade professionals and sales teams
- **Service marketplace** integration with installers
- **Scalable administration** with hierarchical management
- **Relationship-based selling** through vendor-managed sales teams

### Security & Access Control
- **Route protection** middleware enforces proper access levels
- **Permission-based** system with granular controls
- **Role creation validation** prevents unauthorized account types
- **Dynamic UI** shows only appropriate options based on user role
- **Hierarchical management** ensures proper business structure

---

## 🛍️ Core Business Features

### Product Configuration System
- **Multi-step configurator** with real-time pricing
- **Custom dimensions** with fraction precision
- **Material and color selection** with swatches
- **Room visualization** with AR capabilities
- **Mount types, controls, and accessories**
- **Volume pricing** and discounts

### Advanced Shopping Cart
- **Persistent cart** with auto-save
- **Guest and authenticated** user support
- **Save for later** functionality
- **Bulk operations** and cart templates
- **Price alerts** and notifications
- **Multiple shipping addresses**
- **Gift wrapping** and messaging
- **Installation service** booking
- **Sample ordering** with limits

### Pricing Engine
- **Dynamic pricing** with multiple discount types:
  - Volume discounts (quantity tiers)
  - Customer-specific pricing
  - Coupon codes with usage tracking
  - Promotional campaigns
  - Seasonal and time-based rules
- **Tax calculation** (8.25% default)
- **Shipping costs** (free over $100)
- **Minimum order** requirements

### Order Management
- **Complex order creation** with transaction support
- **Multi-vendor order splitting**
- **Order modifications** after placement
- **Guest order support**
- **Reorder functionality**
- **Installation scheduling**

---

## 🔌 API Architecture

### Key API Endpoints Structure

```
/api/auth/*           # Authentication (login, register, logout)
/api/products/*       # Product CRUD, search, configuration
/api/orders/*         # Order management, modifications
/api/cart/*           # Cart operations, pricing, recommendations
/api/pricing/*        # Dynamic pricing calculations
/api/account/*        # User account management
/api/admin/*          # Administrative functions
/api/vendor/*         # Vendor portal APIs
/api/sales/*          # Sales representative tools
/api/installer/*      # Installation management
/api/payments/*       # Payment processing (multiple providers)
/api/ai-designer/*    # AI-powered design features
/api/room-visualizer/* # AR/ML room analysis
/api/analytics/*      # Business intelligence
/api/iot/*           # Smart home integration
```

### Authentication Middleware
- **JWT verification** on protected routes
- **Role-based access** enforcement
- **Rate limiting** protection
- **Security headers** application

---

## 🎨 UI System & Styling

### Design System
- **Custom color palette** defined in `/app/styles/colors.ts`
- **Tailwind CSS** with custom design tokens
- **Responsive design** with mobile-first approach
- **Accessibility features** built-in

### Color Scheme
- **Primary Red**: `#CC2229` (brand color)
- **Dark Blue**: `#1A365D` (secondary)
- **Text Colors**: `#333333` (primary), `#717171` (secondary)
- **Backgrounds**: `#F5F5F5` (light gray), `#FFFFFF` (white)
- **Status Colors**: Success, Error, Warning, Info

### Component Architecture
- **Shadcn/UI** component library
- **Radix UI** primitives for accessibility
- **Class Variance Authority** for component variants
- **Tailwind Animate** for smooth transitions

---

## 🛡️ Security Measures

### Input Validation & Security
- **Zod schemas** for comprehensive validation
- **Rate limiting** with configurable windows
- **XSS prevention** through input sanitization
- **SQL injection protection** with parameterized queries
- **CSRF protection** with secure cookies

### File Upload Security
- **Strict file type** validation (JPEG, PNG, WebP, PDF)
- **Malicious content** scanning
- **File size limits** (5MB images, 10MB documents)
- **Secure filename** generation
- **Directory traversal** prevention

### Security Headers
- **Content Security Policy** (CSP)
- **HTTP Strict Transport Security** (HSTS)
- **XSS Protection** headers
- **Frame Options** for clickjacking protection

---

## 🗄️ Database Schema (Key Models)

### User Management
- **Users** with role-based access
- **Authentication** with password hashing
- **User preferences** and settings

### Product Catalog
- **Products** with features, specifications, materials
- **Categories** and subcategories
- **Vendor-specific** product options
- **Pricing matrices** and volume discounts

### E-commerce Core
- **Orders** with complex pricing calculations
- **Cart items** with configuration data
- **Shipping addresses** and payment methods
- **Order modifications** and tracking

### Business Features
- **Room visualizations** and measurements
- **Sales pipeline** (customers, appointments, leads)
- **Installation jobs** and scheduling
- **Product comparisons** and analytics
- **Swatch ordering** system

---

## 🎯 Advanced Features

### AI/ML Capabilities
- **Product recommendations** based on behavior
- **Visual search** with image upload
- **Room analysis** and product placement
- **Emotion detection** for design preferences
- **Predictive analytics** for inventory

### Smart Home Integration
- **Tuya IoT platform** for motorized blinds
- **Multi-platform bridge** (Alexa, Google, HomeKit)
- **Voice control** and automation
- **Real-time device** synchronization

### AR/VR Features
- **Room visualization** with product placement
- **Mobile AR** preview capabilities
- **3D product configurator**
- **Window detection** and measurement
- **Lighting simulation** effects

---

## 🚀 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run Biome linter and TypeScript check
npm run format           # Format code with Biome

# Database
npm run db:setup         # Initialize database
```

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# JWT
JWT_SECRET=your-secret-key

# Payment Providers
STRIPE_SECRET_KEY=sk_...
PAYPAL_CLIENT_ID=...
BRAINTREE_MERCHANT_ID=...

# Email
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# File Upload
UPLOAD_MAX_SIZE=5242880  # 5MB

# Smart Home
TUYA_API_KEY=...
TUYA_API_SECRET=...
```

---

## 📊 Key Business Metrics

### Performance Goals
- **35% increase** in sales through AI recommendations
- **40% reduction** in returns through AR visualization
- **67% improvement** in supply chain efficiency
- **76% higher** purchase likelihood with voice features

### User Experience Targets
- **Mobile-first** responsive design
- **Accessibility compliance** (WCAG 2.1)
- **Fast loading** with image optimization
- **Real-time** pricing and inventory updates

---

## 🚨 Common Issues & Solutions

### Database Connection
- **Connection pooling** configured (max 10)
- **Retry logic** for failed connections (3 retries in production)
- **Environment validation** for required credentials
- **Pool configuration** in `/lib/db/index.ts`:
  ```typescript
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000,
    multipleStatements: false
  }
  ```

### Authentication Issues
- **JWT expiration** handled with automatic refresh
- **Role-based access** enforced at middleware level
- **Secure cookie** configuration for cross-site requests

### Performance Optimization
- **Image optimization** with Next.js Image component
- **Static generation** for product pages
- **Dynamic imports** for large components
- **Database query** optimization with connection pooling

### Products Page Layout Fix (December 2024)
- **Issue**: Products appearing at bottom instead of beside filters on `/products?category=1`
- **Root Cause**: `ProductFilters` component was returning both sidebar AND sorting header in fragment
- **Solution**: 
  - Split `ProductFilters` to return only the filter sidebar
  - Created separate `ProductSortHeader` component for sorting controls
  - Updated products page layout to properly structure sidebar and products section
- **Layout Structure**:
  ```
  grid grid-cols-1 md:grid-cols-4 gap-6
  ├── md:col-span-1 (Filter Sidebar)
  └── md:col-span-3 (Products Section)
      ├── ProductSortHeader
      └── ProductGrid
  ```

### PRODUCT_MGMT_FABRIC_TAB_FIX_2025_01
ISSUE: fabric_focus_loss + img_blob_disappear + multi_tab_save_partial
ROOT: immediate_onChange + blob_urls + state_conflicts

SOLUTION_PATTERN: unified_save_all_tabs_at_once
- NO_onChange_calls_during_edit
- blob_preview_only → upload_on_save
- fabricRef.getCurrentData() pattern
- productId_in_img_names: `${productId}_${category}_${fabricIndex}_${file.name}`

SAVE_FLOW:
```
saveProduct() {
  // ALL tabs: productData.* (direct state)
  // FABRIC tab: fabricRef.current?.getCurrentData() (special)
  // IMG processing: blob:// → /api/vendor/upload → real_url
  // API: complete_snapshot_all_tabs
}
```

FILES:
- Fabric.tsx: local_state + isUserTyping + ref_pattern
- UnifiedProductPage.tsx: fabricRef + img_upload_logic
- /api/vendor/upload/route.ts: vendor_id→vendor_info_id

TAB_DATA_SOURCES:
basic|options|pricing|images|features|rooms: productData.*
fabric: fabricRef.getCurrentData() + img_upload_processing

STATE_MGMT:
- FabricNameInput/PriceInput: useState(local) + blur_commit
- NO React.memo, NO complex_commit_logic
- coloredFabric|sheerFabric|blackoutFabric: identical_component

PRICING_SYSTEMS_DISCOVERED:
```json
{
  "main_pricing_matrix": {
    "table": "product_pricing_matrix",
    "structure": "width_min, width_max, height_min, height_max, base_price, price_per_sqft", 
    "purpose": "overall_product_pricing_by_dimensions",
    "component": "PricingMatrix.tsx",
    "grid": "width_x_height_ranges"
  },
  "fabric_pricing_matrix": {
    "table": "product_fabric_pricing", 
    "structure": "fabric_option_id, min_width, max_width, price_per_sqft",
    "purpose": "fabric_specific_pricing_per_sqft",
    "component": "Fabric.tsx_price_matrix_section",
    "grid": "width_ranges_only_per_fabric_type"
  }
}
```

FABRIC_DATA_FLOW_TRACED:
database: product_fabric_options(3_records) + product_fabric_pricing(33_records) + product_fabric_images(5_records)
api: /api/vendor/products/[id]/route.ts → formatFabricData() → loads_real_data
ui: shows_real_pricing_values(10,11,20,23) not_defaults
fix: double_click_issue → onMouseDown_vs_onClick

IMAGE_NAMING_SECURITY_PROTOCOL:
```json
{
  "security_benefits": {
    "malicious_file_identification": "product_243_a1b2c3d4_timestamp_random.ext",
    "rapid_threat_response": "quarantine_all_files_matching_product_243_*",
    "bulk_security_actions": "disable_product_flag_vendor_scan_portfolio", 
    "audit_trail": "forensic_analysis_vendor_behavior_monitoring",
    "automated_scanning": "product_grouped_ml_threat_detection"
  },
  "naming_convention": {
    "fabric_images": "product_{productId}_{vendorHash}_{timestamp}_{random}.ext",
    "main_images": "product_{productId}_{timestamp}_{random}.ext",
    "local_preview": "{productId}_{category}_{fabricIndex}_{filename}"
  },
  "implementation": {
    "SecureVendorUpload.generateSecureFileId()": "includes_product_prefix_when_provided",
    "/api/vendor/upload": "accepts_productId_parameter",
    "/api/upload/images": "supports_product_prefix_naming",
    "Components": "Fabric.tsx + Images.tsx + UnifiedProductPage.tsx"
  },
  "security_scenarios": {
    "malicious_detection": "product_243_hash_time_rand.jpg → quarantine_product_243_* → disable_listing → flag_vendor",
    "forensic_investigation": "trace_vendor_by_hash → analyze_upload_patterns → compliance_reporting",
    "threat_containment": "rapid_bulk_actions_on_product_or_vendor_level"
  }
}
```

PRICING_MATRIX_CRITICAL_BUG_FIX_2025:
```json
{
  "issue_type": "data_format_key_separator_conflict",
  "severity": "critical_data_loss",
  "symptoms": {
    "user_input": "pricing_matrix_inputs_not_accepting_values",
    "save_behavior": "api_returns_200_but_no_database_entries",
    "edit_behavior": "pricing_tab_shows_all_zeros_on_reload",
    "database_state": "product_pricing_matrix_table_remains_empty"
  },
  "root_cause": {
    "problem": "key_format_separator_conflict_between_component_and_parser",
    "technical_detail": "UnifiedProductPage creates keys like '11-20-21-30' but PricingMatrix.split('-') creates wrong array",
    "data_flow_break": "wRange='11', hRange='20' → lookup fails → WIDTH_RANGES.find(label='11') → undefined → no_db_save"
  },
  "solution": {
    "key_format_change": "separator changed from '-' to '_'",
    "old_format": "11-20-21-30 (widthRange + '-' + heightRange)",
    "new_format": "11-20_21-30 (widthRange + '_' + heightRange)",
    "parsing_fix": "split('_') gives ['11-20', '21-30'] → correct_lookup_succeeds"
  },
  "files_modified": {
    "UnifiedProductPage.tsx": "line_76: key = `${widthRange}_${heightRange}`",
    "PricingMatrix.tsx": [
      "line_92: key = `${widthRange}_${heightRange}`",
      "line_108: rangeKey.split('_')",
      "line_139: key = `${widthRange}_${heightRange}`"
    ]
  },
  "data_flow_fixed": {
    "user_input": "25.00 → input_onChange",
    "component": "handlePriceChange → updatedPriceMatrix['11-20_21-30'] = '25.00'",
    "conversion": "matrixEntries with width_min=11, width_max=20, base_price=25.00",
    "api_save": "INSERT INTO product_pricing_matrix with proper values",
    "database": "actual_data_stored_successfully",
    "reload": "edit_page_shows_saved_pricing_data"
  },
  "validation_commands": {
    "test_save": "enter_pricing_data → click_update_product",
    "verify_db": "SELECT * FROM product_pricing_matrix WHERE product_id = ?",
    "test_reload": "refresh_edit_page → verify_pricing_tab_populated"
  },
  "importance": "CRITICAL - affects_all_vendor_pricing_workflows_and_revenue_calculations"
}
```

### FEATURES_TAB_SAVE_LOAD_FIX_2025:
```json
{
  "issue_type": "features_data_not_populating_after_save",
  "severity": "high_functionality_missing",
  "symptoms": {
    "save_behavior": "features_saved_successfully_to_database",
    "edit_behavior": "features_tab_empty_on_product_edit_reload",
    "data_flow": "save_works_but_load_missing",
    "user_impact": "vendors_cannot_edit_existing_product_features"
  },
  "root_cause": {
    "problem": "GET_route_missing_features_query_and_formatting",
    "missing_component": "features_data_extraction_from_database",
    "api_gap": "features_array_not_included_in_product_response"
  },
  "solution": {
    "database_query": "JOIN product_features + features tables to get product-specific features",
    "api_response": "include formatted features array in product data",
    "data_format": "match Features.tsx component expectations with id, title, description, icon",
    "filtering": "only include features with category='product_specific'"
  },
  "implementation": {
    "query_added": "SELECT f.feature_id, f.name as title, f.description, f.icon FROM product_features pf JOIN features f ON pf.feature_id = f.feature_id WHERE pf.product_id = ? AND f.category = 'product_specific'",
    "formatting": "map to {id, title, description, icon} structure",
    "api_inclusion": "features: formattedFeatures in product response",
    "component_compatibility": "matches Features.tsx interface expectations"
  },
  "data_flow_complete": {
    "save": "Features component → API → features table + product_features junction",
    "load": "Database → API → Features component → populated form",
    "round_trip": "add_feature → save_product → reload_edit → features_visible"
  },
  "storage_architecture": {
    "approach": "product_specific_features_not_global_references",
    "features_table": "stores individual feature records with category='product_specific'",
    "product_features_table": "junction table linking products to their specific features",
    "business_logic": "each product has its own unique features list"
  },
  "files_modified": {
    "api_route": "/app/api/vendor/products/[id]/route.ts - added features query and formatting in GET method",
    "line_changes": "added featureRows query + formattedFeatures mapping + features in response"
  },
  "validation_commands": {
    "test_save": "add_features → save_product → verify_database_entries",
    "test_load": "reload_edit_page → verify_features_tab_populated", 
    "verify_db": "SELECT * FROM features f JOIN product_features pf ON f.feature_id = pf.feature_id WHERE pf.product_id = ?"
  },
  "importance": "HIGH - enables_complete_product_feature_management_workflow"
}
```

### FEATURES_AND_ROOMS_POPULATION_FIX_2025:
```json
{
  "issue_type": "features_and_rooms_tabs_not_populating_on_edit",
  "severity": "high_functionality_broken",
  "symptoms": {
    "save_behavior": "both_features_and_rooms_save_successfully_with_success_message", 
    "edit_behavior": "tabs_show_empty_when_editing_existing_products",
    "api_save": "data_reaches_database_correctly",
    "api_load": "data_not_returned_in_product_response"
  },
  "root_causes": {
    "features_tab": {
      "problem": "features_query_had_incorrect_WHERE_clause",
      "issue": "AND f.category = 'product_specific' filter was too restrictive",
      "fix": "removed_category_filter_to_load_all_product_features"
    },
    "rooms_tab": {
      "problem": "complete_absence_of_room_recommendations_queries",
      "missing_get": "no_query_to_load_room_data_from_product_rooms_table",
      "missing_put": "no_logic_to_save_room_recommendations_data",
      "missing_destructure": "roomRecommendations_not_extracted_from_request_body"
    }
  },
  "complete_solution": {
    "features_loading": {
      "query_fixed": "SELECT f.feature_id, f.name as title, f.description, f.icon FROM product_features pf JOIN features f ON pf.feature_id = f.feature_id WHERE pf.product_id = ?",
      "formatting": "map to {id, title, description, icon} structure",
      "response_inclusion": "features: formattedFeatures"
    },
    "rooms_loading": {
      "query_added": "SELECT room_type, suitability_score, special_considerations FROM product_rooms WHERE product_id = ? ORDER BY suitability_score DESC",
      "formatting": "map to {id, roomType, recommendation, priority} structure", 
      "response_inclusion": "roomRecommendations: formattedRoomRecommendations"
    },
    "rooms_saving": {
      "destructure_added": "roomRecommendations extracted from request body",
      "delete_existing": "DELETE FROM product_rooms WHERE product_id = ?",
      "insert_new": "INSERT INTO product_rooms with room_type, suitability_score, special_considerations"
    }
  },
  "data_flow_complete": {
    "features": "save_to_features+product_features → load_from_product_features+features → populate_Features_component",
    "rooms": "save_to_product_rooms → load_from_product_rooms → populate_RoomRecommendations_component",
    "round_trip_test": "add_data → save_product → reload_edit → verify_both_tabs_populated"
  },
  "database_tables": {
    "features_storage": {
      "features_table": "stores_individual_feature_records",
      "product_features_table": "junction_table_linking_products_to_features"
    },
    "rooms_storage": {
      "product_rooms_table": "stores_room_recommendations_per_product",
      "fields": "product_id, room_type, suitability_score, special_considerations"
    }
  },
  "files_modified": {
    "api_route": "/app/api/vendor/products/[id]/route.ts",
    "changes": [
      "GET: added featureRows and roomRows queries",
      "GET: added formattedFeatures and formattedRoomRecommendations mapping", 
      "GET: included both in product response",
      "PUT: added roomRecommendations to destructuring",
      "PUT: added complete room recommendations save logic"
    ]
  },
  "validation_tests": {
    "features_test": "add_feature → save → reload_edit → verify_features_tab_populated",
    "rooms_test": "add_room_recommendation → save → reload_edit → verify_rooms_tab_populated",
    "database_verify": "check_features+product_features_tables AND product_rooms_table_for_saved_data"
  },
  "importance": "CRITICAL - restores_complete_product_management_functionality_for_features_and_rooms_tabs"
}
```

### ROOM_TYPES_MANAGEMENT_SYSTEM_2025:
```json
{
  "feature_name": "room_types_management_system",
  "implementation_date": "2025-06-19",
  "purpose": "manage_shop_by_room_section_and_product_recommendations",
  
  "database_structure": {
    "table": "room_types",
    "columns": [
      "room_type_id INT PRIMARY KEY AUTO_INCREMENT",
      "name VARCHAR(100) UNIQUE NOT NULL",
      "description TEXT",
      "image_url VARCHAR(500)",
      "typical_humidity VARCHAR(50)",
      "light_exposure VARCHAR(50)",
      "privacy_requirements VARCHAR(50)",
      "recommended_products TEXT",
      "is_active TINYINT(1) DEFAULT 1",
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ],
    "initial_data": [
      {"id": 1, "name": "Living Room", "is_active": 1},
      {"id": 2, "name": "Bedroom", "is_active": 1},
      {"id": 3, "name": "Kitchen", "is_active": 1},
      {"id": 4, "name": "Bathroom", "is_active": 1},
      {"id": 5, "name": "Dining Room", "is_active": 1},
      {"id": 6, "name": "Home Office", "is_active": 1},
      {"id": 7, "name": "Nursery", "is_active": 1},
      {"id": 8, "name": "Media Room", "is_active": 1}
    ]
  },
  
  "admin_interface": {
    "location": "/app/admin/rooms/page.tsx",
    "features": [
      "full_crud_operations",
      "search_and_filter_by_status",
      "toggle_active_inactive_with_toggle_icons",
      "image_upload_support",
      "room_characteristics_management"
    ],
    "ui_components": {
      "table_view": "displays_all_rooms_with_status_and_actions",
      "modal_form": "add_edit_room_with_all_attributes",
      "status_toggle": "ToggleLeft/ToggleRight_icons_for_active_state",
      "filters": "search_by_name_filter_by_status"
    }
  },
  
  "api_endpoints": {
    "admin_rooms": {
      "GET /api/admin/rooms": "fetch_all_rooms_for_admin",
      "POST /api/admin/rooms": "create_new_room_type",
      "PUT /api/admin/rooms/[id]": "update_existing_room",
      "DELETE /api/admin/rooms/[id]": "delete_room_type"
    },
    "public_rooms": {
      "GET /api/rooms": "fetch_active_rooms_for_homepage",
      "filters": "WHERE is_active = 1"
    },
    "image_upload": {
      "POST /api/upload/rooms": "upload_room_images"
    }
  },
  
  "frontend_integration": {
    "homepage_shop_by_room": {
      "component": "/app/components/home/HomeClient.tsx",
      "data_flow": "fetch_from_api_rooms → display_active_rooms → link_to_products",
      "fallback_removed": "no_hardcoded_rooms_only_database_data",
      "conditional_rendering": "only_show_section_if_rooms_exist"
    },
    "vendor_product_recommendations": {
      "component": "/components/products/shared/RoomRecommendations.tsx",
      "dynamic_loading": "fetch_room_types_from_api_instead_of_hardcoded",
      "loading_state": "shows_loading_while_fetching_rooms",
      "api_endpoint": "/api/rooms"
    }
  },
  
  "key_changes_2025_06_19": {
    "categories_api_fix": {
      "issue": "is_active_column_not_in_categories_table",
      "fix": "changed_to_featured_column_in_query",
      "file": "/app/api/homepage/data/route.ts:17"
    },
    "homepage_rooms_dynamic": {
      "removed": "hardcoded_defaultRooms_array",
      "added": "conditional_rendering_only_if_rooms_exist",
      "file": "/app/components/home/HomeClient.tsx:126-132"
    },
    "room_recommendations_dynamic": {
      "removed": "hardcoded_ROOM_TYPES_array",
      "added": "useEffect_to_fetch_from_api_rooms",
      "state": "roomTypes_useState_with_loading",
      "files": "/components/products/shared/RoomRecommendations.tsx"
    },
    "admin_toggle_icon_update": {
      "old": "Eye/EyeOff_icons",
      "new": "ToggleLeft/ToggleRight_icons",
      "purpose": "clearer_toggle_switch_metaphor",
      "file": "/app/admin/rooms/page.tsx:4,333"
    }
  },
  
  "usage_instructions": {
    "admin_workflow": [
      "navigate_to_/admin/rooms",
      "click_add_new_room_button",
      "fill_form_with_name_description_image",
      "set_humidity_light_privacy_levels",
      "toggle_active_status_as_needed",
      "save_room_type"
    ],
    "visibility_rules": {
      "active_rooms": "appear_in_homepage_and_vendor_dropdowns",
      "inactive_rooms": "hidden_from_public_but_retained_in_admin"
    }
  },
  
  "testing_commands": {
    "verify_rooms_exist": "SELECT * FROM room_types;",
    "check_active_rooms": "SELECT * FROM room_types WHERE is_active = 1;",
    "test_homepage_api": "curl http://localhost:3000/api/rooms",
    "test_admin_api": "curl http://localhost:3000/api/admin/rooms"
  }
}

### Login System & Role Hierarchy Overhaul (December 2024)
- **Challenge**: Implement secure role-based user creation system to compete with Amazon
- **Implementation**: Complete authentication and authorization system with 7-tier role hierarchy
- **Key Features**:
  - **Restricted Public Registration**: Only customers can self-register via `/register`
  - **Admin-Controlled Business Accounts**: Vendors, installers, trade professionals created by admin
  - **Vendor Sales Team Management**: Vendors can create and manage their own sales representatives
  - **Comprehensive Role Hierarchy**: 7 levels from Customer (10) to Super Admin (100)
  - **Permission-Based Access Control**: Granular permissions with middleware enforcement
  - **Dynamic UI Controls**: Role-appropriate options shown based on current user permissions

- **Security Enhancements**:
  - Role creation validation at API level
  - Route protection middleware for all dashboard areas
  - Hierarchical management permissions
  - Proper business account approval workflow

- **Files Created/Modified**:
  - `/lib/roleHierarchy.ts` - Complete role system definitions
  - `/lib/middleware/roleGuard.ts` - Access control middleware
  - `/app/api/auth/register/route.ts` - Customer-only registration enforcement
  - `/app/register/page.tsx` - Updated UI with clear messaging
  - `/app/admin/users/new/page.tsx` - Dynamic role selection for admins

---

## 🔄 Future Development Roadmap

### Phase 1 (0-6 months)
- Enhanced AI recommendations
- Advanced AR capabilities
- Mobile app development
- Performance optimizations

### Phase 2 (6-12 months)
- IoT smart home integration
- Voice commerce features
- Advanced vendor tools
- Predictive analytics

### Phase 3 (12+ months)
- Metaverse showroom
- Blockchain integration
- Advanced AI personalization
- Complete ecosystem platform

---

## 📝 Notes for Future Development

### Key Architecture Decisions
- **Monolithic Next.js** app with API routes
- **MySQL** database with Prisma schema
- **JWT authentication** with HTTP-only cookies
- **Multi-role** system with middleware protection
- **File-based** routing with App Router

### Scalability Considerations
- **Database connection** pooling for high traffic
- **API rate limiting** to prevent abuse
- **Image optimization** for performance
- **Caching strategies** for frequently accessed data

### Vendor Integration Points
- **API endpoints** for vendor data sync
- **Webhook support** for real-time updates
- **Bulk import** capabilities for large catalogs
- **Commission calculation** automation

---

## 🚨 CRITICAL: Database Connection Leak Prevention (June 2025)

### The Connection Leak Crisis
- **Problem**: Database connections reached 38 (from 5 limit), causing complete site failure
- **Root Cause**: Improper use of `pool.getConnection()` without `connection.release()`
- **Impact**: Website became unresponsive, server crashes

### Connection Management Rules

#### ✅ CORRECT Pattern (for non-transactional queries):
```typescript
const pool = await getPool();
const [results] = await pool.execute('SELECT * FROM table WHERE id = ?', [id]);
```

#### ❌ INCORRECT Pattern (causes leaks):
```typescript
const pool = await getPool();
const connection = await pool.getConnection();
const [results] = await connection.execute('SELECT * FROM table WHERE id = ?', [id]);
// Missing connection.release() - LEAK!
```

#### ✅ CORRECT Pattern (for transactions only):
```typescript
const pool = await getPool();
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.execute('INSERT INTO ...');
  await connection.execute('UPDATE ...');
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release(); // CRITICAL!
}
```

### Fixed Connection Leaks (25+ files):
1. `/lib/auth.ts` - registerUser function
2. `/app/api/account/dashboard/route.ts`
3. `/app/api/orders/create/route.ts`
4. `/app/api/products/create/route.ts`
5. `/app/api/admin/*` - Multiple admin routes
6. `/app/api/vendor/*` - Vendor management routes
7. `/lib/services/products.ts`
8. `/lib/email/emailService.ts`
9. All other API routes using improper patterns

### Transaction-Required Files (Correctly use getConnection):
- `/app/api/delivery/schedule/route.ts`
- `/app/api/orders/[id]/modifications/route.ts`
- `/app/api/account/shipping-addresses/[id]/route.ts`
- These files MUST use `getConnection()` for transaction support

### Database Configuration Updates:
- Removed invalid MySQL2 options: `acquireTimeout`, `timeout`, `reconnect`
- Use only valid options: `connectTimeout`, `connectionLimit`, etc.

### IMPORTANT RULES FOR PRODUCTION:
1. **ALWAYS CHECK DATABASE FIRST** - Never assume table/column existence
2. **Use `pool.execute()` directly** for 99% of queries
3. **Only use `getConnection()`** when you need transactions
4. **ALWAYS release connections** in finally blocks
5. **Test with `SHOW PROCESSLIST`** to monitor connection count
6. **Avoid parameterized LIMIT/OFFSET** - Use string interpolation with validated integers

### Database Credentials (.env):
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blindscommerce_test
DB_USER=root
DB_PASSWORD=Test@1234
```

---

## 🔥 CRITICAL: MySQL Parameter Binding Issues (June 2025)

### The "Incorrect arguments to mysqld_stmt_execute" Crisis
- **Problem**: APIs failing with `Error: Incorrect arguments to mysqld_stmt_execute`
- **Root Cause**: MySQL2 parameter binding has issues with `LIMIT ? OFFSET ?` syntax
- **Symptoms**: 500 Internal Server Error on pagination queries
- **Impact**: Admin tax rates page and other paginated APIs failing

### Parameter Binding Issue Analysis
```typescript
// ❌ PROBLEMATIC Pattern (causes MySQL binding errors):
const [rows] = await pool.execute(
  'SELECT * FROM table WHERE active = ? LIMIT ? OFFSET ?',
  [true, 10, 0]  // MySQL2 struggles with LIMIT/OFFSET parameters
);

// ✅ WORKING Solution (hybrid approach):
const limit = 10; // Validated integer
const offset = 0; // Validated integer
const [rows] = await pool.execute(
  `SELECT * FROM table WHERE active = ? LIMIT ${limit} OFFSET ${offset}`,
  [true]  // Only search parameters, not pagination
);
```

### Safe String Interpolation Rules
**ONLY use string interpolation for:**
1. **Validated integers** (page numbers, limits, offsets)
2. **Predefined column names** from allowlist
3. **ORDER BY directions** ('ASC'/'DESC' after validation)

**NEVER use string interpolation for:**
1. **User input strings** (search terms, names, etc.)
2. **Untrusted data** of any kind
3. **Dynamic table/column names** from user input

### Correct Pagination Pattern
```typescript
// ✅ RECOMMENDED Pattern for paginated queries:
export async function getPaginatedData(page: number, limit: number, search?: string) {
  const pool = await getPool();
  
  // Build WHERE clause with parameters for search
  let whereClause = 'WHERE is_active = TRUE';
  let params = [];
  
  if (search) {
    whereClause += ' AND (name LIKE ? OR description LIKE ?)';
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern];
  }
  
  // Get count with search parameters only
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM table ${whereClause}`,
    params
  );
  
  // Get data with safe pagination (validated integers)
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM table ${whereClause} 
     ORDER BY created_at DESC 
     LIMIT ${limit} OFFSET ${offset}`,
    params  // Same search parameters, no pagination params
  );
  
  return { rows, total: countRows[0].total };
}
```

### Real-World Fix Example (Tax Rates API)
**Problem**: `/app/api/admin/tax-rates/route.ts` failing with MySQL binding error

**Before** (Broken):
```typescript
const queryParams = [...searchParams, limit, offset];
const [rows] = await pool.execute(
  'SELECT * FROM tax_rates WHERE is_active = TRUE LIMIT ? OFFSET ?',
  queryParams  // ❌ MySQL2 can't handle LIMIT/OFFSET parameters properly
);
```

**After** (Fixed):
```typescript
const [rows] = await pool.execute(
  `SELECT * FROM tax_rates WHERE is_active = TRUE LIMIT ${limit} OFFSET ${offset}`,
  searchParams  // ✅ Only search parameters, pagination interpolated safely
);
```

### Debugging Parameter Binding Issues
1. **Check connection count**: `SHOW PROCESSLIST;` - should be ~5-10, not 100+
2. **Test without parameters**: Start with hardcoded query, add parameters incrementally
3. **Isolate LIMIT/OFFSET**: Remove pagination first, then add back with interpolation
4. **Validate parameter arrays**: Log parameter array contents and types
5. **Check for connection leaks**: If 100+ connections, restart dev server

### Files Fixed in June 2025:
- `/app/api/admin/tax-rates/route.ts` - Parameter binding issue with pagination
- Connection leak cleanup (dropped from 110+ to 5 connections)

### Production Monitoring:
- Monitor connection count with `SHOW PROCESSLIST;`
- Set up alerts for >20 database connections
- Log parameter binding errors for investigation

---

## 📊 Database Tables Reference (Actual Schema)

### 🏢 VENDOR-CENTRIC ARCHITECTURE (CRITICAL)
**IMPORTANT**: Products, discounts, coupons, and sales people all belong to vendors. Always start with vendor tables for quick information gathering!

### Vendor Core Tables:
- `vendor_info` - Main vendor profiles (vendor_info_id is key)
- `vendor_products` - Links vendors to products with vendor-specific pricing
- `vendor_discounts` - Vendor-specific discount rules (percentage, fixed, tiered)
- `vendor_coupons` - Vendor-managed coupon codes
- `vendor_inventory` - Stock levels per vendor
- `sales_staff` - Sales representatives belonging to vendors

### Key Vendor Relationships:
```sql
-- vendor_info (main vendor table)
vendor_info_id INT PRIMARY KEY
user_id INT -- Links to users table
business_name VARCHAR(255)
commission_rate DECIMAL(5,2) DEFAULT 15.00

-- vendor_products (vendor-specific product data)
vendor_id INT -- Links to vendor_info.vendor_info_id
product_id INT -- Links to products.product_id
vendor_price DECIMAL(10,2) -- Vendor's selling price
quantity_available INT

-- vendor_discounts (sale pricing)
vendor_id INT
discount_type ENUM('percentage','fixed_amount','tiered','bulk_pricing')
discount_value DECIMAL(8,2)
applies_to ENUM('all_vendor_products','specific_products','specific_categories')
```

### Product-Related Tables:
- `products` - Base product catalog (no sale_price column!)
- `product_categories` - Product to category mapping
- `product_features` - Product feature assignments
- `product_rooms` - Product room recommendations (NOT product_room_types)
- `product_pricing_matrix` - Dimension-based pricing
- `product_fabric_options` - Fabric configurations
- `product_fabric_pricing` - Fabric-specific pricing
- `product_images` - Product image gallery
- `categories` - Product categories
- `room_types` - Available room types for recommendations

### Important Notes:
- **NO sale_price in products table** - Use vendor_discounts instead
- **Prices**: base_price (MSRP), cost_price (vendor cost), vendor_price (selling price)
- **Discounts**: Applied through vendor_discounts table with rules
- **Multi-vendor**: Same product can have different prices per vendor

### 🛒 Multi-Vendor Cart & Checkout (CRITICAL)
**IMPORTANT**: Customers can add products from multiple vendors to a single cart. At checkout:

1. **Cart contains products from different vendors**
   - Each cart item tracks its vendor_id
   - Prices are vendor-specific (vendor_products.vendor_price)

2. **Vendor-specific discounts apply individually**
   - Vendor A's discount only applies to Vendor A's products
   - Vendor B's discount only applies to Vendor B's products
   - Each vendor's discount rules are evaluated separately

3. **Checkout process splits by vendor**:
   ```sql
   -- Example checkout flow
   Cart Items:
   - Product X from Vendor A: $100 (Vendor A has 20% discount = $80)
   - Product Y from Vendor A: $50 (Vendor A has 20% discount = $40)
   - Product Z from Vendor B: $75 (Vendor B has 10% discount = $67.50)
   
   Total: $80 + $40 + $67.50 = $187.50
   ```

4. **Order splitting**:
   - Single customer order creates multiple vendor sub-orders
   - Each vendor only sees their portion of the order
   - Commission calculated per vendor based on their items

5. **Discount application tables**:
   - `cart_vendor_discounts` - Tracks which vendor discounts apply to cart
   - `vendor_discount_usage` - Records discount usage per vendor

### Key Database Relationships for Checkout:
```sql
-- cart_items
cart_item_id INT
cart_id INT
product_id INT
vendor_id INT -- Critical: tracks which vendor for this item
price DECIMAL -- Vendor-specific price at time of adding
quantity INT

-- cart_vendor_discounts
cart_id INT
vendor_id INT
discount_id INT
discount_amount DECIMAL -- Calculated discount for this vendor's items

-- orders (after checkout)
order_id INT -- Customer's main order
vendor_id INT -- NULL for main order, set for vendor sub-orders
parent_order_id INT -- Links vendor orders to main order
```

---

## 💰 COMPREHENSIVE PRICING SYSTEM ARCHITECTURE (June 2025)

### 🎯 Multi-Layered Pricing Engine Overview
The BlindsCommerce platform features a sophisticated pricing system that handles complex B2B/B2C scenarios with multiple pricing strategies, discounts, and dynamic calculations.

### 📊 Database Pricing Architecture

#### **Core Pricing Tables:**
```json
{
  "main_pricing_systems": {
    "products": {
      "base_price": "MSRP starting price",
      "cost_price": "vendor wholesale cost", 
      "purpose": "foundation pricing for all calculations"
    },
    "product_pricing_matrix": {
      "structure": "width_min, width_max, height_min, height_max, base_price, price_per_sqft",
      "purpose": "dimensional pricing based on width/height ranges (11-300 inches)",
      "component": "PricingMatrix.tsx",
      "grid_format": "width_x_height_ranges with '_' separator",
      "example": "11-20_21-30 = 11-20 inch width, 21-30 inch height",
      "critical_fix_2025": "key separator changed from '-' to '_' to prevent parsing conflicts"
    },
    "product_fabric_pricing": {
      "structure": "fabric_option_id, min_width, max_width, price_per_sqft",
      "purpose": "fabric-specific pricing per square foot",
      "component": "Fabric.tsx price matrix section",
      "calculation": "(width × height) / 144 × price_per_sqft"
    },
    "vendor_products": {
      "vendor_price": "vendor-specific selling price",
      "quantity_available": "vendor inventory levels",
      "purpose": "multi-vendor marketplace pricing"
    }
  }
}
```

### 🧮 Pricing Calculation Flow

#### **Step-by-Step Price Calculation:**
```javascript
// Complete pricing engine flow
function calculateFinalPrice(productConfig) {
  // 1. Base Price Foundation
  let basePrice = getBasePrice(productConfig);
  
  // 2. Dimensional Pricing (if applicable)
  if (hasDimensions(productConfig)) {
    basePrice = getPricingMatrixPrice(width, height) || basePrice;
  }
  
  // 3. Fabric/Material Costs
  if (hasFabricSelection(productConfig)) {
    const fabricCost = calculateFabricCost(fabric, width, height);
    basePrice += fabricCost;
  }
  
  // 4. Configuration Option Modifiers
  const optionModifiers = calculateOptionModifiers(selectedOptions);
  let configuredPrice = basePrice + optionModifiers;
  
  // 5. Customer-Specific Pricing
  if (hasCustomerPricing(customer)) {
    configuredPrice = applyCustomerPricing(configuredPrice, customer);
  }
  
  // 6. Dynamic Pricing Rules (time-based, inventory-based)
  configuredPrice = applyDynamicPricing(configuredPrice, rules);
  
  // 7. Item Total (price × quantity)
  let itemTotal = configuredPrice * quantity;
  
  // 8. Volume Discounts
  itemTotal = applyVolumeDiscounts(itemTotal, quantity);
  
  // 9. Vendor-Specific Discounts
  itemTotal = applyVendorDiscounts(itemTotal, vendorId);
  
  // 10. Coupon/Campaign Discounts
  itemTotal = applyCoupons(itemTotal, coupons);
  
  // 11. Shipping Calculation
  const shipping = calculateShipping(itemTotal, customer);
  
  // 12. Tax Calculation
  const tax = calculateTax(itemTotal + shipping, taxRate);
  
  // 13. Final Total
  return {
    basePrice,
    configuredPrice,
    itemTotal,
    shipping,
    tax,
    finalTotal: itemTotal + shipping + tax,
    discountBreakdown: getDiscountBreakdown()
  };
}
```

### 💡 Pricing Components & Files

#### **Key Pricing Files:**
```json
{
  "pricing_components": {
    "PricingMatrix.tsx": {
      "location": "/components/products/shared/",
      "purpose": "interactive dimensional pricing grid",
      "features": "width×height ranges, paginated view, real-time updates",
      "grid_size": "11 width ranges × 29 height ranges",
      "ranges": "11-20\" to 291-300\" in 10-inch increments"
    },
    "UnifiedProductPage.tsx": {
      "pricing_integration": "formatPricingMatrix() function",
      "key_format": "widthRange + '_' + heightRange",
      "database_conversion": "range labels to min/max values"
    },
    "Fabric.tsx": {
      "fabric_pricing": "per square foot calculations",
      "width_tiers": "different pricing for width ranges",
      "area_calculation": "(width × height) / 144 square feet"
    }
  },
  "api_endpoints": {
    "/api/pricing/calculate": "main pricing engine with all discounts",
    "/api/products/[slug]/pricing": "product-specific pricing",
    "/api/products/[slug]/fabric-pricing": "fabric pricing calculations",
    "/api/cart/vendor-discounts": "cart-level discount application",
    "/api/admin/pricing/*": "admin pricing management"
  }
}
```

### 🏷️ Discount & Commission System

#### **Discount Types & Applications:**
```json
{
  "discount_hierarchy": {
    "1_customer_specific": {
      "types": ["fixed_price", "discount_percent", "discount_amount", "markup_percent"],
      "application": "override or modify base pricing",
      "table": "customer_specific_pricing"
    },
    "2_volume_discounts": {
      "structure": "quantity tiers with percentage discounts",
      "example": "5-10 items: 5%, 11-25 items: 10%, 26+: 15%",
      "table": "volume_discounts"
    },
    "3_vendor_discounts": {
      "types": ["percentage", "fixed_amount", "tiered", "bulk_pricing"],
      "scope": ["all_products", "specific_categories", "individual_products"],
      "table": "vendor_discounts"
    },
    "4_coupon_codes": {
      "features": ["usage_limits", "expiration_dates", "customer_restrictions"],
      "stacking": "configurable with other promotions",
      "table": "coupon_codes"
    },
    "5_promotional_campaigns": {
      "types": ["seasonal", "clearance", "new_customer", "category_specific"],
      "scheduling": "start/end dates with automatic activation",
      "table": "promotional_campaigns"
    }
  },
  "commission_structure": {
    "vendor_commissions": {
      "calculation_methods": ["percentage", "fixed_amount", "tiered"],
      "scope": ["vendor_specific", "category_based", "product_specific", "global"],
      "table": "commission_rules"
    },
    "sales_staff_commissions": {
      "individual_rates": "per salesperson commission tracking",
      "override_capability": "can override vendor default rates",
      "tracking": "tied to order attribution"
    }
  }
}
```

### 🔧 Dynamic Pricing Engine

#### **Real-Time Pricing Adjustments:**
```json
{
  "dynamic_pricing_rules": {
    "time_based_pricing": {
      "hour_of_day": "different rates for peak/off-peak hours",
      "day_of_week": "weekend vs weekday pricing",
      "seasonal": "month-based price adjustments"
    },
    "inventory_based_pricing": {
      "low_stock": "increase prices when inventory drops below threshold",
      "overstock": "discount pricing to move excess inventory",
      "out_of_stock": "hide pricing or show backorder pricing"
    },
    "demand_based_pricing": {
      "high_demand": "increase prices for popular items",
      "conversion_optimization": "A/B test different price points",
      "geographic": "regional pricing variations"
    },
    "rule_constraints": {
      "min_max_prices": "prevent prices from going below/above limits",
      "percentage_limits": "cap maximum discount percentages",
      "customer_type_rules": "different rules for B2B vs B2C"
    }
  }
}
```

### 🛒 Multi-Vendor Cart Pricing

#### **Complex Cart Calculations:**
```json
{
  "multi_vendor_cart_logic": {
    "vendor_separation": {
      "cart_grouping": "items grouped by vendor for discount application",
      "individual_calculations": "each vendor's discounts apply only to their items",
      "shipping_per_vendor": "separate shipping calculations per vendor"
    },
    "discount_stacking": {
      "application_order": [
        "customer_specific_pricing",
        "volume_discounts",
        "vendor_discounts", 
        "coupon_codes",
        "promotional_campaigns"
      ],
      "maximum_discount_caps": "prevent over-discounting",
      "conflict_resolution": "highest discount wins vs stackable rules"
    },
    "cart_level_features": {
      "price_alerts": "notify when items go on sale",
      "save_for_later": "price tracking for saved items",
      "bulk_pricing": "automatic volume discount application",
      "free_shipping_calculation": "threshold per vendor vs combined"
    }
  }
}
```

### ⚙️ Administrative Controls

#### **Admin Pricing Management:**
```json
{
  "admin_pricing_controls": {
    "global_settings": {
      "tax_rate": "platform-wide tax percentage (default 8.25%)",
      "minimum_order_amount": "minimum purchase requirement",
      "free_shipping_threshold": "free shipping cutoff ($100 default)",
      "default_commission_rate": "standard vendor commission (15%)",
      "payment_processing_fee": "credit card processing costs"
    },
    "pricing_rule_management": {
      "commission_rules": "create/modify vendor and sales staff rates",
      "volume_discounts": "configure quantity-based pricing tiers",
      "promotional_campaigns": "setup platform-wide sales events",
      "dynamic_pricing": "configure time/inventory-based rules"
    },
    "vendor_oversight": {
      "discount_approval": "review and approve vendor discount requests",
      "pricing_audits": "monitor vendor pricing compliance",
      "commission_reports": "track commission payments and calculations"
    }
  }
}
```

### 🧪 Testing & Validation

#### **Pricing System Testing:**
```json
{
  "testing_scenarios": {
    "basic_pricing": {
      "single_product": "verify base price + options calculations",
      "fabric_pricing": "test per-sqft calculations with different dimensions",
      "matrix_pricing": "validate dimensional pricing grid accuracy"
    },
    "discount_testing": {
      "volume_discounts": "test quantity tier breakpoints",
      "coupon_stacking": "verify discount combination rules",
      "vendor_specific": "ensure vendor discounts don't cross-apply"
    },
    "edge_cases": {
      "zero_pricing": "handle free items and promotional giveaways",
      "negative_discounts": "prevent negative final prices",
      "extreme_dimensions": "test very large window configurations"
    },
    "performance_testing": {
      "cart_calculations": "bulk pricing calculations with many items",
      "real_time_updates": "pricing updates during configuration",
      "concurrent_users": "multiple users calculating prices simultaneously"
    }
  }
}
```

### 📈 Business Intelligence & Reporting

#### **Pricing Analytics:**
```json
{
  "pricing_analytics": {
    "revenue_optimization": {
      "price_elasticity": "track sales volume vs price point changes",
      "discount_effectiveness": "measure ROI of different discount types",
      "conversion_rates": "pricing impact on purchase decisions"
    },
    "vendor_performance": {
      "commission_tracking": "vendor earnings and payment schedules",
      "pricing_competitiveness": "compare vendor prices for same products",
      "discount_usage": "track vendor discount strategy effectiveness"
    },
    "customer_insights": {
      "price_sensitivity": "customer response to pricing changes", 
      "average_order_value": "impact of pricing on purchase amounts",
      "customer_lifetime_value": "pricing strategy effect on retention"
    }
  }
}
```

### 🚀 Production Deployment Considerations

#### **Pricing System Performance:**
```json
{
  "performance_optimization": {
    "caching_strategy": {
      "pricing_matrix_cache": "cache dimensional pricing for faster lookups",
      "discount_rule_cache": "cache active discount rules",
      "tax_calculation_cache": "cache tax rates by location"
    },
    "database_optimization": {
      "pricing_indexes": "optimize queries on price-related tables",
      "discount_indexes": "fast lookups for applicable discounts",
      "vendor_pricing_indexes": "multi-vendor price comparisons"
    },
    "api_optimization": {
      "bulk_pricing_endpoints": "calculate multiple items efficiently",
      "real_time_calculations": "fast response for interactive pricing",
      "concurrent_processing": "handle multiple pricing requests"
    }
  },
  "monitoring_alerts": {
    "pricing_errors": "alert on calculation failures",
    "discount_abuse": "monitor excessive discount usage",
    "commission_discrepancies": "validate commission calculations"
  }
}
```

---

## 🔐 CRITICAL: Cart Security & Hardcoded User ID Audit (June 2025)

### Cart Shared Data Crisis
```json
{
  "issue_type": "critical_security_vulnerability",
  "severity": "P0_data_breach_risk", 
  "discovery_date": "2025-06-22",
  "symptoms": {
    "shared_cart_count": "all users see identical cart item count (3 items)",
    "cross_user_visibility": "admin, vendor, customer, guest all see same cart",
    "data_privacy_violation": "users can access other users' cart items",
    "role_access_inappropriate": "cart visible to admin/vendor roles who shouldn't have shopping access"
  },
  "root_cause": {
    "hardcoded_user_id": "const userId = 1; // Demo user in cart APIs",
    "missing_authentication": "cart APIs not using getCurrentUser() validation",
    "no_role_validation": "cart accessible to all user roles instead of customers only",
    "shared_state": "all users accessing same hardcoded user's cart data"
  }
}
```

### Comprehensive Security Fix Implementation
```json
{
  "fix_strategy": "complete_cart_system_authentication_overhaul",
  "implementation_date": "2025-06-22",
  "affected_components": {
    "api_routes": [
      "/app/api/account/cart/route.ts",
      "/app/api/account/cart/items/[id]/route.ts", 
      "/app/api/account/wishlist/route.ts"
    ],
    "ui_components": [
      "/components/Navbar.tsx",
      "/context/CartContext.tsx"
    ],
    "authentication_pattern": "getCurrentUser() with role validation"
  },
  "security_measures_applied": {
    "user_specific_data": {
      "before": "const userId = 1; // Demo user",
      "after": "const user = await getCurrentUser(); cart = await getOrCreateCart(pool, user.userId);",
      "enforcement": "each user only accesses their own cart/wishlist data"
    },
    "role_based_access_control": {
      "cart_access": "if (!user || user.role !== 'customer') return 403",
      "ui_visibility": "cart icon only shown to customers and guests",
      "context_protection": "CartContext only loads for customer role"
    },
    "api_authentication": {
      "all_cart_endpoints": "GET, POST, PUT, DELETE require customer authentication",
      "error_handling": "secure error messages for unauthorized access",
      "guest_support": "localStorage fallback for non-authenticated users"
    }
  }
}
```

### Hardcoded User ID Comprehensive Audit
```json
{
  "audit_scope": "entire_codebase_hardcoded_userid_patterns",
  "audit_date": "2025-06-22",
  "search_patterns": [
    "userId = 1",
    "user_id = 1", 
    "const userId = 1",
    "Demo user"
  ],
  "critical_findings": {
    "cart_apis": {
      "status": "FIXED",
      "files": [
        "/app/api/account/cart/route.ts",
        "/app/api/account/cart/items/[id]/route.ts"
      ],
      "fix": "replaced hardcoded userId with getCurrentUser() authentication"
    },
    "wishlist_api": {
      "status": "FIXED", 
      "file": "/app/api/account/wishlist/route.ts",
      "fix": "implemented proper authentication for GET, POST, DELETE operations"
    },
    "other_apis": {
      "status": "VERIFIED_SECURE",
      "scope": "124+ files checked",
      "result": "most APIs already using proper getCurrentUser() patterns"
    }
  },
  "security_validation": {
    "authentication_pattern": "getCurrentUser() with JWT token validation",
    "role_validation": "user.role checks for appropriate access levels",
    "data_isolation": "user.userId used for database queries",
    "error_handling": "403 responses for unauthorized access"
  }
}
```

### Cart System Architecture Post-Fix
```json
{
  "cart_access_control": {
    "customers": {
      "access": "full cart functionality",
      "data_scope": "own cart items only",
      "api_access": "authenticated cart APIs",
      "ui_visibility": "cart icon visible in navbar"
    },
    "guests": {
      "access": "localStorage-based cart",
      "data_scope": "local browser storage only", 
      "migration": "auto-merge to authenticated cart on login",
      "ui_visibility": "cart icon visible in navbar"
    },
    "admin_vendor_sales_installer": {
      "access": "NO_CART_ACCESS",
      "data_scope": "N/A - cart not applicable to business roles",
      "api_access": "403 forbidden responses",
      "ui_visibility": "cart icon hidden from navbar"
    }
  },
  "data_flow_security": {
    "authenticated_users": "getCurrentUser() → role validation → user-specific cart data",
    "guest_users": "localStorage cart → auto-merge on authentication",
    "role_enforcement": "customer role required for all cart API operations",
    "cross_user_protection": "database queries use authenticated user.userId only"
  }
}
```

### Production Security Validation
```json
{
  "security_checklist": {
    "user_data_isolation": "VERIFIED - each user only sees own cart/wishlist",
    "role_based_access": "VERIFIED - cart only accessible to customers/guests",
    "api_authentication": "VERIFIED - all cart endpoints require proper auth",
    "ui_role_visibility": "VERIFIED - cart icon hidden from business roles",
    "hardcoded_removal": "VERIFIED - no remaining const userId = 1 patterns",
    "error_handling": "VERIFIED - secure error messages for unauthorized access"
  },
  "testing_scenarios": {
    "customer_login": "sees only own cart items with correct count",
    "admin_login": "cart icon hidden, cart APIs return 403",
    "vendor_login": "cart icon hidden, cart APIs return 403", 
    "guest_user": "localStorage cart works, migrates on login",
    "cross_user_test": "user A cannot access user B's cart data"
  },
  "monitoring_recommendations": {
    "auth_failures": "monitor 403 responses on cart endpoints",
    "role_violations": "alert on non-customer cart access attempts",
    "data_integrity": "verify cart user_id matches authenticated user",
    "session_security": "monitor JWT token validation failures"
  }
}
```

### Files Modified for Security
```json
{
  "api_routes_fixed": {
    "/app/api/account/cart/route.ts": {
      "changes": ["replaced hardcoded userId with getCurrentUser()", "added customer role validation", "added proper error handling"],
      "impact": "cart now user-specific and secure"
    },
    "/app/api/account/cart/items/[id]/route.ts": {
      "changes": ["replaced hardcoded userId with getCurrentUser()", "added customer role validation", "added authentication to PATCH/DELETE"],
      "impact": "cart item operations now user-specific"
    },
    "/app/api/account/wishlist/route.ts": {
      "changes": ["replaced hardcoded userId with getCurrentUser()", "added customer role validation", "secured GET/POST/DELETE operations"],
      "impact": "wishlist now user-specific and secure"
    }
  },
  "ui_components_modified": {
    "/components/Navbar.tsx": {
      "changes": ["wrapped cart icon with customer/guest role check"],
      "impact": "cart only visible to appropriate user roles"
    },
    "/context/CartContext.tsx": {
      "changes": ["modified isAuthenticated() to only return true for customers"],
      "impact": "cart context only active for customer role"
    }
  }
}
```

### Business Impact & Risk Mitigation
```json
{
  "risk_mitigation": {
    "data_breach_prevention": "users can no longer access other users' cart data",
    "role_appropriate_access": "business users (admin/vendor) no longer see inappropriate cart functionality",
    "privacy_compliance": "cart data properly isolated per user",
    "user_experience": "customers see correct personalized cart count"
  },
  "business_continuity": {
    "customer_shopping": "enhanced - now sees own cart items correctly",
    "guest_experience": "maintained - localStorage cart still works",
    "admin_workflow": "improved - no confusing cart icon in business interface",
    "vendor_workflow": "improved - focused on business tools without cart distraction"
  },
  "security_posture": {
    "authentication": "strengthened with proper JWT validation throughout cart system",
    "authorization": "implemented with role-based access control",
    "data_isolation": "enforced at API and UI levels",
    "audit_trail": "comprehensive documentation for future security reviews"
  }
}
```

---

This README serves as a comprehensive reference for understanding the BlindsCommerce application architecture, business logic, pricing systems, and development patterns. Update this document as the application evolves and new features are added.