# Product Approval System - Implementation Guide

## Overview

The Product Approval System allows salespersons to submit product CRUD requests that require approval from Admins or Vendors before execution.

## Architecture

### Database
- **Table**: `product_approval_requests`
- **Migration**: `scripts/migrations/product-approval-system.sql`

### Backend (API)
- **Admin Endpoints**: `/api/v2/admin/product-approvals/*`
- **Vendor Endpoints**: `/api/v2/vendors/product-approvals/*`
- **Handlers**:
  - `lib/api/v2/handlers/AdminHandler.ts`
  - `lib/api/v2/handlers/VendorsHandler.ts`
- **Manager**: `lib/managers/ProductManager.ts`

### Frontend

#### Reusable Widget Component
- **Component**: `components/dashboard/ProductApprovalsWidget.tsx`
- **Purpose**: Can be embedded in any dashboard or used standalone

#### Standalone Pages
- **Admin**: `/admin/product-approvals`
- **Vendor**: `/vendor/product-approvals`

## User Roles & Permissions

### Admin
- View all approval requests across all vendors
- Filter by vendor and status
- Approve/reject any request
- Full access to all features

### Vendor
- View approval requests for their products only
- Filter by status
- Approve/reject requests for their products
- No vendor dropdown (auto-filtered)

### Salesperson
- Submit product CRUD requests
- View their own submitted requests
- Cannot approve/reject (read-only)

## How It Works

### 1. Salesperson Submits Request

When a salesperson creates/updates/deletes a product through `ProductManager`:

```typescript
// Instead of directly executing
await productManager.createProduct(productData, userId);

// Request goes to approval queue
await productManager.createProductRequest(productData, userId);
```

### 2. Request Stored in Database

```sql
INSERT INTO product_approval_requests (
  action_type,      -- 'CREATE', 'UPDATE', or 'DELETE'
  product_id,       -- NULL for CREATE, product_id for UPDATE/DELETE
  requested_by,     -- Salesperson user_id
  vendor_id,        -- Associated vendor
  request_data,     -- Full product JSON
  status            -- Default: 'PENDING'
)
```

### 3. Admin/Vendor Reviews

- Admin/Vendor sees request in their dashboard or approval page
- Can view full product data
- Makes decision to approve or reject

### 4. Approval Executes Action

```typescript
// When approved
productManager.approveRequest(requestId, adminUserId)
  -> Executes the original action (CREATE/UPDATE/DELETE)
  -> Updates request status to 'APPROVED'
  -> Records approver and timestamp
```

### 5. Rejection Records Reason

```typescript
// When rejected
productManager.rejectRequest(requestId, reason, adminUserId)
  -> Does NOT execute the action
  -> Updates status to 'REJECTED'
  -> Stores rejection reason
  -> Records rejector and timestamp
```

## Integration in Dashboards

### Quick Integration (5 minutes)

Add to any dashboard page:

```typescript
import ProductApprovalsWidget from '@/components/dashboard/ProductApprovalsWidget';

// Inside your dashboard component
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Existing widgets */}

  {/* Product Approvals */}
  <div className="lg:col-span-2">
    <ProductApprovalsWidget
      userRole="ADMIN"  // or get from session
      limit={5}         // Show 5 most recent
      showFullView={false}
    />
  </div>
</div>
```

### Widget Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `userRole` | `'ADMIN' \| 'VENDOR' \| 'SALESPERSON'` | Yes | - | Current user's role |
| `limit` | `number` | No | `5` | Max items to show |
| `showFullView` | `boolean` | No | `false` | Show filters & full interface |

## API Endpoints

### GET - List Approval Requests

**Admin:**
```
GET /api/v2/admin/product-approvals?status=PENDING&vendor_id=123
```

**Vendor:**
```
GET /api/v2/vendors/product-approvals?status=PENDING
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action_type": "CREATE",
      "product_id": null,
      "product_name": "New Product",
      "requested_by": "user_123",
      "requester_first_name": "John",
      "requester_last_name": "Doe",
      "vendor_id": 5,
      "vendor_name": "Acme Corp",
      "request_data": { /* full product JSON */ },
      "status": "PENDING",
      "created_at": "2026-01-04T10:30:00Z"
    }
  ]
}
```

### POST - Approve Request

```
POST /api/v2/admin/product-approvals/:id/approve
POST /api/v2/vendors/product-approvals/:id/approve
```

**Response:**
```json
{
  "success": true,
  "message": "Request approved and product created successfully"
}
```

### POST - Reject Request

```
POST /api/v2/admin/product-approvals/:id/reject
Content-Type: application/json

{
  "reason": "Product description needs more details"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected successfully"
}
```

## Database Schema

```sql
CREATE TABLE product_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  product_id INT NULL,
  requested_by VARCHAR(255) NOT NULL,
  vendor_id INT NULL,
  request_data JSON NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  approved_by VARCHAR(255) NULL,
  rejected_by VARCHAR(255) NULL,
  rejection_reason TEXT NULL,

  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) ON DELETE SET NULL,

  INDEX idx_status (status),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_created_at (created_at),
  INDEX idx_requested_by (requested_by)
);
```

## Navigation

The approval pages are accessible via:

### Admin
- **Sidebar**: "Product Approvals" menu item
- **URL**: `/admin/product-approvals`
- **Icon**: CheckCircle2

### Vendor
- **Sidebar**: "Product Approvals" menu item
- **URL**: `/vendor/product-approvals`
- **Icon**: CheckCircle2

## Testing

### Test Approval Flow

1. **Create Test Request**:
   ```sql
   INSERT INTO product_approval_requests
   (action_type, requested_by, vendor_id, request_data, status)
   VALUES
   ('CREATE', 'test_user', 1, '{"name": "Test Product"}', 'PENDING');
   ```

2. **Navigate to Approvals**: Go to `/admin/product-approvals`

3. **Approve Request**: Click "Approve" button

4. **Verify**: Check that product was created in `products` table

### Test Rejection

1. Click "Reject" on a pending request
2. Enter rejection reason
3. Verify request status updated to 'REJECTED'
4. Verify product was NOT created

## Troubleshooting

### No Approvals Showing

**Check:**
- Are you logged in as Admin or Vendor?
- Are there pending requests in the database?
- Check browser console for API errors

**SQL Query:**
```sql
SELECT * FROM product_approval_requests WHERE status = 'PENDING';
```

### Foreign Key Error

**Issue**: `vendor_info` uses `vendor_info_id` not `vendor_id`

**Fix**: Ensure migrations use correct column:
```sql
FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id)
```

### Widget Not Loading

**Check:**
- Component import path is correct
- User role is one of: 'ADMIN', 'VENDOR', 'SALESPERSON'
- API endpoints are accessible (check network tab)

## Future Enhancements

- Email notifications when requests are submitted
- SMS notifications for urgent approvals
- Bulk approve/reject functionality
- Approval delegation
- Auto-approval rules based on criteria
- Approval history and audit trail
