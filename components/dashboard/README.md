# Product Approvals Widget

A reusable component for displaying product approval requests across different user dashboards.

## Features

- **Role-Based Display**: Automatically adapts to Admin, Vendor, or Salesperson roles
- **Compact & Full Views**: Can be used as a dashboard widget (compact) or full-page interface
- **Real-time Actions**: Approve/reject requests with inline actions
- **Filtering**: Filter by status (Pending/Approved/Rejected) and vendor (Admin only)

## Usage

### In Dashboards (Compact View)

Add to any dashboard to show recent approval requests:

```tsx
import ProductApprovalsWidget from '@/components/dashboard/ProductApprovalsWidget';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other dashboard widgets */}

      {/* Product Approvals Widget */}
      <ProductApprovalsWidget
        userRole="ADMIN" // or "VENDOR" or "SALESPERSON"
        limit={5} // Show only 5 most recent
        showFullView={false} // Compact mode
      />
    </div>
  );
}
```

### Full Page View

Used in dedicated approval pages:

```tsx
import ProductApprovalsWidget from '@/components/dashboard/ProductApprovalsWidget';

export default function ProductApprovalsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Product Approvals</h1>

      <ProductApprovalsWidget
        userRole="ADMIN"
        limit={100} // Show more items
        showFullView={true} // Full interface with filters
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userRole` | `'ADMIN' \| 'VENDOR' \| 'SALESPERSON'` | Required | Current user's role |
| `limit` | `number` | `5` | Maximum number of items to display |
| `showFullView` | `boolean` | `false` | Show full interface with filters |

## Role Behavior

- **ADMIN**: Can approve/reject all requests, filter by vendor
- **VENDOR**: Can approve/reject requests for their products only
- **SALESPERSON**: Can view their own submitted requests (read-only)

## Integration Examples

### Admin Dashboard

```tsx
// app/admin/page.tsx or app/admin/dashboard/page.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {/* Stats cards */}
  <StatsCard title="Revenue" value="$125,430" />
  <StatsCard title="Orders" value="1,234" />
  <StatsCard title="Customers" value="5,678" />

  {/* Product Approvals - takes full width */}
  <div className="lg:col-span-2 xl:col-span-3">
    <ProductApprovalsWidget userRole="ADMIN" limit={5} />
  </div>
</div>
```

### Vendor Dashboard

```tsx
// app/vendor/page.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Vendor stats */}
  <RevenueChart />
  <OrdersChart />

  {/* Product Approvals */}
  <div className="lg:col-span-2">
    <ProductApprovalsWidget userRole="VENDOR" limit={5} />
  </div>
</div>
```

### Salesperson Dashboard

```tsx
// app/salesperson/page.tsx or similar
<div className="space-y-6">
  <h2>My Recent Requests</h2>
  <ProductApprovalsWidget userRole="SALESPERSON" limit={10} />
</div>
```

## Standalone Pages

The widget is already being used in standalone pages:

- `/admin/product-approvals` - Admin approval interface
- `/vendor/product-approvals` - Vendor approval interface

These pages use `showFullView={true}` for the complete experience.
