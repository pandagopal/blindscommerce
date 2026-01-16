# Database Structure - BlindsCommerce

**Last Updated:** 2026-01-15
**Schema Version:** 2.0 (Hybrid Design with Security Layer)

## Overview

BlindsCommerce uses a hybrid database design that optimizes for different user types:
- **Single ID Pattern**: For 1:1 user extensions (Vendor, Installer, Shipping Agent)
- **Separate ID Pattern**: For business entities with relationships (Sales Staff)

This design provides simplicity where possible while maintaining flexibility where needed.

---

## Core Tables

### 1. users (Authentication & Core Identity)

Primary table for all user types across the platform.

```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  oauth_provider ENUM('google', 'facebook', 'apple') NULL,
  oauth_id VARCHAR(255) NULL,
  role ENUM('customer', 'vendor', 'admin', 'super_admin', 'sales', 'installer', 'shipping_agent'),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Security fields
  disabled_at TIMESTAMP NULL,
  disabled_by INT NULL,
  disabled_reason VARCHAR(500),
  deleted_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_disabled_by FOREIGN KEY (disabled_by) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE KEY unique_oauth (oauth_provider, oauth_id)
);
```

**Key Points:**
- `user_id` is the universal identifier
- OAuth users have `password_hash = NULL`
- `disabled_by` tracks who disabled the account
- `is_active = 0` means account is disabled (soft delete)

---

### 2. vendor_info (1:1 Extension - Single ID Pattern)

Business information for vendors. Uses `user_id` as PRIMARY KEY (no separate vendor_info_id).

```sql
CREATE TABLE vendor_info (
  user_id INT PRIMARY KEY,  -- Same as users.user_id
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255),
  business_phone VARCHAR(20),
  tax_id VARCHAR(50),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  description TEXT,
  logo_url VARCHAR(500),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  approval_status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT FALSE,

  -- Security fields
  suspended_at TIMESTAMP NULL,
  suspended_by INT NULL,
  suspended_reason VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_vendor_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Key Points:**
- `user_id` is both PRIMARY KEY and FOREIGN KEY
- No separate `vendor_info_id` - simplifies relationships
- `ON DELETE CASCADE`: If user deleted, vendor_info also deleted
- `approval_status = 'suspended'` when vendor is disabled

**Migration from Old Schema:**
- Old: vendor_info_id (PK), user_id (FK)
- New: user_id (PK)
- All references updated to use user_id

---

### 3. sales_staff (Separate Business Entity Pattern)

Sales representatives that can be linked to vendors or independent.

```sql
CREATE TABLE sales_staff (
  sales_staff_id INT PRIMARY KEY AUTO_INCREMENT,  -- Separate identity
  user_id INT NOT NULL,
  vendor_id INT NULL,  -- References vendor_info.user_id (nullable)
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  target_sales DECIMAL(10,2),
  territory VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  total_sales DECIMAL(10,2) DEFAULT 0,
  start_date DATE,

  -- Security fields
  disabled_at TIMESTAMP NULL,
  disabled_by INT NULL,
  disabled_reason VARCHAR(500),
  vendor_unlinked_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id) REFERENCES vendor_info(user_id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_sales (user_id),
  INDEX idx_vendor_id (vendor_id)
);
```

**Key Points:**
- Has its own `sales_staff_id` (separate from user_id)
- `vendor_id` is NULLABLE - sales can be independent
- `ON DELETE SET NULL`: If vendor deleted, sales become independent
- `vendor_unlinked_at`: Tracks when sales was unlinked from vendor

**Why Separate ID?**
- Sales is a business role/position, not just a user profile
- Can have properties independent of the user (commission, territory)
- Can be linked/unlinked from vendors
- Future-proof: one user could potentially have multiple sales positions

---

### 4. products (References Vendors by user_id)

```sql
CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  vendor_id INT NULL,  -- References vendor_info.user_id
  base_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,

  -- Security fields
  archived_at TIMESTAMP NULL,
  archived_reason VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_vendor FOREIGN KEY (vendor_id) REFERENCES vendor_info(user_id) ON DELETE SET NULL,
  INDEX idx_vendor_id (vendor_id)
);
```

**Key Points:**
- `vendor_id` references `vendor_info.user_id` (NOT vendor_info_id)
- `vendor_id = NULL` means "marketplace product" (no specific vendor)
- `ON DELETE SET NULL`: If vendor deleted, products become marketplace products

---

### 5. installer_info (1:1 Extension - Single ID Pattern)

```sql
CREATE TABLE installer_info (
  user_id INT PRIMARY KEY,
  license_number VARCHAR(50),
  certification VARCHAR(100),
  service_area VARCHAR(255),
  years_experience INT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_installer_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Key Points:**
- Optional profile data for installers
- Simple 1:1 extension of users table

---

### 6. shipping_agent_info (1:1 Extension - Single ID Pattern)

```sql
CREATE TABLE shipping_agent_info (
  user_id INT PRIMARY KEY,
  agency_name VARCHAR(255),
  vehicle_type VARCHAR(50),
  service_area VARCHAR(255),
  max_weight_capacity INT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_shipping_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## Security & Audit Tables

### 7. audit_log (Compliance & Security Tracking)

```sql
CREATE TABLE audit_log (
  audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by INT NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_performed_by (performed_by),
  INDEX idx_created_at (created_at),

  CONSTRAINT fk_audit_performed_by FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Tracks:**
- Vendor enable/disable/delete actions
- User modifications
- Security-related events
- Admin actions

---

### 8. admin_tasks (Manual Review Queue)

```sql
CREATE TABLE admin_tasks (
  task_id INT PRIMARY KEY AUTO_INCREMENT,
  task_type VARCHAR(50) NOT NULL,
  related_entity INT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  assigned_to INT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,

  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),

  CONSTRAINT fk_task_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);
```

**Use Cases:**
- Review sales staff when vendor re-enabled
- Approve vendor applications
- Manual moderation tasks

---

### 9. archived_vendor_data (GDPR Compliance)

```sql
CREATE TABLE archived_vendor_data (
  archive_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  original_user_id INT NOT NULL,
  vendor_data JSON NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_by INT NOT NULL,
  deletion_reason VARCHAR(500) NULL,

  INDEX idx_original_user_id (original_user_id),
  INDEX idx_archived_at (archived_at)
);
```

**Purpose:**
- Preserve vendor data after permanent deletion
- GDPR compliance (right to be forgotten + record retention)
- Legal/financial audit requirements

---

## Relationships Diagram

```
users (user_id)
  ├── 1:1 → vendor_info (user_id PK)
  │         └── 1:N → products (vendor_id FK)
  │         └── 1:N → sales_staff (vendor_id FK, nullable)
  ├── 1:1 → installer_info (user_id PK)
  ├── 1:1 → shipping_agent_info (user_id PK)
  └── 1:1 → sales_staff (user_id FK, unique)
```

---

## Common Queries

### Get Vendor with User Info
```sql
SELECT u.*, vi.*
FROM users u
JOIN vendor_info vi ON u.user_id = vi.user_id
WHERE u.user_id = ?;
```

### Get Products by Vendor
```sql
SELECT p.*
FROM products p
WHERE p.vendor_id = ?;  -- Uses user_id
```

### Get Sales Staff Linked to Vendor
```sql
SELECT ss.*, u.first_name, u.last_name, u.email
FROM sales_staff ss
JOIN users u ON ss.user_id = u.user_id
WHERE ss.vendor_id = ?;  -- Uses vendor's user_id
```

### Get Independent Sales Staff
```sql
SELECT ss.*, u.first_name, u.last_name
FROM sales_staff ss
JOIN users u ON ss.user_id = u.user_id
WHERE ss.vendor_id IS NULL;
```

---

## Design Rationale

### Why Single ID for Vendors?
1. **Simplicity**: One ID eliminates confusion
2. **Performance**: Fewer joins required
3. **Clarity**: Vendors are truly 1:1 with users
4. **Developer Experience**: Less likely to use wrong ID

### Why Separate ID for Sales?
1. **Flexibility**: Sales can be linked/unlinked from vendors
2. **Business Logic**: Sales is a position/role, not just a profile
3. **Independence**: Sales can work without a vendor
4. **Future-Proof**: Supports complex sales hierarchies

### Security Design Philosophy
1. **Soft Delete First**: Always disable before permanent deletion
2. **Audit Everything**: Track who did what and when
3. **Cascade Control**: Admin controls what happens to related records
4. **Data Preservation**: Archive before deleting (GDPR compliance)

---

## Migration Guide

See `/scripts/migrations/hybrid-design-security.sql` for complete migration script.

**Key Changes:**
1. `vendor_info.vendor_info_id` removed → Use `user_id` as PK
2. `products.vendor_id` now references `vendor_info.user_id`
3. `sales_staff.vendor_id` added (references `vendor_info.user_id`)
4. Security fields added to all entity tables
5. Audit and task tracking tables created

**Testing Checklist:**
- [ ] Verify vendor_info primary key is user_id
- [ ] Confirm products.vendor_id references vendor_info.user_id
- [ ] Test vendor disable with cascade options
- [ ] Test vendor enable with manual sales review
- [ ] Verify audit log entries created
- [ ] Test permanent deletion with archiving

---

## API Endpoints

### Vendor Security Management

**Disable Vendor:**
```
POST /api/v2/admin/vendors/:id/disable
Body: {
  reason: string,
  disabledBy: number,
  cascadeToSales?: boolean,
  cascadeToProducts?: boolean,
  notifySales?: boolean
}
```

**Enable Vendor:**
```
POST /api/v2/admin/vendors/:id/enable
Body: {
  enabledBy: number
}
```

**Permanently Delete:**
```
POST /api/v2/admin/vendors/:id/delete-permanently
Body: {
  deletedBy: number,
  reason: string
}
```

**Get Security Status:**
```
GET /api/v2/admin/vendors/:id/security-status
```

**Get Audit History:**
```
GET /api/v2/admin/vendors/:id/audit-history?limit=50
```

---

## Best Practices

1. **Always use user_id when referencing vendors** (not vendor_info_id)
2. **Check vendor.is_active before allowing operations**
3. **Log security-sensitive actions to audit_log**
4. **Soft delete by default, hard delete only when required**
5. **Notify affected users when disabling vendors**
6. **Archive data before permanent deletion**

---

## Troubleshooting

### Error: Foreign key constraint fails on products
**Cause:** Trying to use vendor_info_id instead of user_id
**Fix:** Use vendor_info.user_id for all vendor references

### Error: Sales staff not found for vendor
**Cause:** Sales may have been unlinked (vendor_id = NULL)
**Fix:** Query with `WHERE vendor_id = ? OR vendor_id IS NULL`

### Orphaned products after vendor deletion
**Expected Behavior:** Products become marketplace products (vendor_id = NULL)
**Recovery:** Assign to new vendor or leave as marketplace products

---

For questions or issues, see `/docs/Claude.md` for development guidelines.
