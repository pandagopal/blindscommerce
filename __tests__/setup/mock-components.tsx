const React = require('react');

// Mock components for testing
const MockVendorDashboard = ({ data }: any) => (
  <div data-testid="vendor-dashboard">
    <h1>Vendor Dashboard</h1>
    <div data-testid="vendor-stats">
      <span>{data?.totalSales || '$0'}</span>
      <span>{data?.totalOrders || '0'}</span>
      <span>{data?.totalProducts || '0'}</span>
    </div>
  </div>
);

const MockVendorProducts = ({ products }: any) => (
  <div data-testid="vendor-products">
    <h1>Product Management</h1>
    {products?.map((product: any) => (
      <div key={product.id} data-testid={`product-${product.id}`}>
        <span>{product.name}</span>
        <span>{product.price}</span>
        <span>{product.status}</span>
      </div>
    ))}
  </div>
);

const MockVendorSalesTeam = ({ teamMembers }: any) => (
  <div data-testid="vendor-sales-team">
    <h1>Sales Team Management</h1>
    {teamMembers?.map((member: any) => (
      <div key={member.salesStaffId} data-testid={`member-${member.salesStaffId}`}>
        <span>{member.firstName} {member.lastName}</span>
        <span>{member.email}</span>
        <span>{member.territory}</span>
        <span>{member.specialization}</span>
        <span>{member.commissionRate}%</span>
        <span>${member.monthlyQuota.toLocaleString()}</span>
        <span>${member.totalSales.toLocaleString()}</span>
        <span>${member.monthlyProgress.toLocaleString()}</span>
        <span>{member.conversionRate}%</span>
        <span>${member.avgDealSize.toLocaleString()}</span>
        <span className={member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {member.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    ))}
  </div>
);

const MockVendorOrders = ({ orders }: any) => (
  <div data-testid="vendor-orders">
    <h1>Order Management</h1>
    {orders?.map((order: any) => (
      <div key={order.id} data-testid={`order-${order.id}`}>
        <span>{order.orderNumber}</span>
        <span>{order.customerName}</span>
        <span>{order.status}</span>
        <span>{order.totalAmount}</span>
      </div>
    ))}
  </div>
);

const MockVendorDiscounts = ({ discounts }: any) => (
  <div data-testid="vendor-discounts">
    <h1>Discount Management</h1>
    {discounts?.map((discount: any) => (
      <div key={discount.id} data-testid={`discount-${discount.id}`}>
        <span>{discount.name}</span>
        <span>{discount.type}</span>
        <span>{discount.value}</span>
        <span>{discount.status}</span>
      </div>
    ))}
  </div>
);

// Admin components
const MockAdminDashboard = ({ data }: any) => (
  <div data-testid="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <div data-testid="admin-stats">
      <span>{data?.totalUsers || '0'}</span>
      <span>{data?.totalRevenue || '$0'}</span>
    </div>
  </div>
);

const MockAdminUsers = ({ users }: any) => (
  <div data-testid="admin-users">
    <h1>User Management</h1>
    {users?.map((user: any) => (
      <div key={user.user_id} data-testid={`user-${user.user_id}`}>
        <span>{user.first_name} {user.last_name}</span>
        <span>{user.email}</span>
        <span>{user.role}</span>
      </div>
    ))}
  </div>
);

// Customer components
const MockCustomerDashboard = ({ data }: any) => (
  <div data-testid="customer-dashboard">
    <h1>Welcome back, {data?.firstName || 'Customer'}!</h1>
    <div data-testid="customer-stats">
      <span>{data?.totalOrders || '0'}</span>
      <span>{data?.totalSpent || '$0'}</span>
    </div>
  </div>
);

const MockCustomerOrders = ({ orders }: any) => (
  <div data-testid="customer-orders">
    <h1>My Orders</h1>
    {orders?.map((order: any) => (
      <div key={order.id} data-testid={`order-${order.id}`}>
        <span>{order.orderNumber}</span>
        <span>{order.status}</span>
        <span>{order.totalAmount}</span>
      </div>
    ))}
  </div>
);

// Sales components
const MockSalesDashboard = ({ data }: any) => (
  <div data-testid="sales-dashboard">
    <h1>Welcome back, {data?.firstName || 'Sales'}!</h1>
    <div data-testid="sales-stats">
      <span>{data?.totalSales || '$0'}</span>
      <span>{data?.totalLeads || '0'}</span>
    </div>
  </div>
);

const MockSalesLeads = ({ leads }: any) => (
  <div data-testid="sales-leads">
    <h1>Lead Management</h1>
    {leads?.map((lead: any) => (
      <div key={lead.id} data-testid={`lead-${lead.id}`}>
        <span>{lead.name}</span>
        <span>{lead.stage}</span>
        <span>{lead.value}</span>
      </div>
    ))}
  </div>
);

const MockSalesQuotes = ({ quotes }: any) => (
  <div data-testid="sales-quotes">
    <h1>Quote Management</h1>
    {quotes?.map((quote: any) => (
      <div key={quote.id} data-testid={`quote-${quote.id}`}>
        <span>{quote.customerName}</span>
        <span>{quote.amount}</span>
        <span>{quote.status}</span>
      </div>
    ))}
  </div>
);

// Additional Admin components
const MockAdminProducts = ({ products }: any) => (
  <div data-testid="admin-products">
    <h1>Product Management</h1>
    {products?.map((product: any) => (
      <div key={product.id} data-testid={`product-${product.id}`}>
        <span>{product.name}</span>
        <span>{product.vendor}</span>
        <span>{product.status}</span>
      </div>
    ))}
  </div>
);

const MockAdminVendors = ({ vendors }: any) => (
  <div data-testid="admin-vendors">
    <h1>Vendor Management</h1>
    {vendors?.map((vendor: any) => (
      <div key={vendor.id} data-testid={`vendor-${vendor.id}`}>
        <span>{vendor.name}</span>
        <span>{vendor.email}</span>
        <span>{vendor.status}</span>
      </div>
    ))}
  </div>
);

const MockAdminOrders = ({ orders }: any) => (
  <div data-testid="admin-orders">
    <h1>Order Management</h1>
    {orders?.map((order: any) => (
      <div key={order.id} data-testid={`order-${order.id}`}>
        <span>{order.orderNumber}</span>
        <span>{order.customerName}</span>
        <span>{order.status}</span>
      </div>
    ))}
  </div>
);

// Additional Customer components
const MockCustomerMeasurements = ({ measurements }: any) => (
  <div data-testid="customer-measurements">
    <h1>My Measurements</h1>
    {measurements?.map((measurement: any) => (
      <div key={measurement.id} data-testid={`measurement-${measurement.id}`}>
        <span>{measurement.roomName}</span>
        <span>{measurement.windowType}</span>
        <span>{measurement.dimensions}</span>
      </div>
    ))}
  </div>
);

// Installer components
const MockInstallerDashboard = ({ data }: any) => (
  <div data-testid="installer-dashboard">
    <h1>Welcome back, {data?.firstName || 'Installer'}!</h1>
    <div data-testid="installer-stats">
      <span>{data?.totalJobs || '0'}</span>
      <span>{data?.avgRating || '0'}</span>
    </div>
  </div>
);

// Export all components using CommonJS syntax
module.exports = {
  MockVendorDashboard,
  MockVendorProducts,
  MockVendorSalesTeam,
  MockVendorOrders,
  MockVendorDiscounts,
  MockAdminDashboard,
  MockAdminUsers,
  MockAdminProducts,
  MockAdminVendors,
  MockAdminOrders,
  MockCustomerDashboard,
  MockCustomerOrders,
  MockCustomerMeasurements,
  MockSalesDashboard,
  MockSalesLeads,
  MockSalesQuotes,
  MockInstallerDashboard
};