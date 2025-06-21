#!/usr/bin/env node

/**
 * Script to fix dynamic import issues in test files
 * This script will replace all "await import" patterns with mock component imports
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'sales-dashboard/SalesDashboard.test.tsx',
  'sales-dashboard/SalesQuotes.test.tsx', 
  'sales-dashboard/SalesLeads.test.tsx',
  'installer-dashboard/InstallerDashboard.test.tsx',
  'admin-dashboard/AdminDashboard.test.tsx',
  'admin-dashboard/AdminProducts.test.tsx',
  'admin-dashboard/AdminVendors.test.tsx',
  'admin-dashboard/AdminUsers.test.tsx',
  'admin-dashboard/AdminOrders.test.tsx',
  'vendor-dashboard/VendorDashboard.test.tsx',
  'vendor-dashboard/VendorDiscounts.test.tsx',
  'vendor-dashboard/VendorOrders.test.tsx',
  'vendor-dashboard/VendorProducts.test.tsx',
  'customer-dashboard/CustomerDashboard.test.tsx',
  'customer-dashboard/CustomerMeasurements.test.tsx',
  'customer-dashboard/CustomerOrders.test.tsx'
];

const componentMappings = {
  // Sales dashboard
  'SalesDashboard': 'MockSalesDashboard',
  'SalesQuotes': 'MockSalesQuotes', 
  'SalesLeads': 'MockSalesLeads',
  
  // Installer dashboard
  'InstallerDashboard': 'MockInstallerDashboard',
  
  // Admin dashboard
  'AdminDashboard': 'MockAdminDashboard',
  'AdminProducts': 'MockAdminProducts',
  'AdminVendors': 'MockAdminVendors', 
  'AdminUsers': 'MockAdminUsers',
  'AdminOrders': 'MockAdminOrders',
  
  // Vendor dashboard
  'VendorDashboard': 'MockVendorDashboard',
  'VendorDiscounts': 'MockVendorDiscounts',
  'VendorOrders': 'MockVendorOrders',
  'VendorProducts': 'MockVendorProducts',
  
  // Customer dashboard
  'CustomerDashboard': 'MockCustomerDashboard',
  'CustomerMeasurements': 'MockCustomerMeasurements',
  'CustomerOrders': 'MockCustomerOrders'
};

function fixTestFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Extract component name from file path
  const fileName = path.basename(filePath, '.test.tsx');
  const mockComponent = componentMappings[fileName];
  
  if (!mockComponent) {
    console.log(`No mock component mapping found for ${fileName}`);
    return;
  }
  
  // Replace dynamic import pattern
  const dynamicImportRegex = new RegExp(
    `const ${fileName} = \\(await import\\('@/app/[^']+/page'\\)\\)\\.default;`,
    'g'
  );
  
  const replacement = `const { ${mockComponent} } = require('../setup/mock-components');`;
  
  // Count replacements
  const matches = content.match(dynamicImportRegex);
  if (matches) {
    content = content.replace(dynamicImportRegex, replacement);
    console.log(`Fixed ${matches.length} dynamic imports in ${filePath}`);
    
    // Also replace render calls
    const renderRegex = new RegExp(`render\\(<${fileName}[^>]*>\\);`, 'g');
    const renderMatches = content.match(renderRegex);
    if (renderMatches) {
      content = content.replace(renderRegex, (match) => {
        return match.replace(fileName, mockComponent);
      });
      console.log(`Fixed ${renderMatches.length} render calls in ${filePath}`);
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Successfully updated ${filePath}`);
  } else {
    console.log(`No dynamic imports found in ${filePath}`);
  }
}

console.log('Starting to fix dynamic import issues...\n');

testFiles.forEach(fixTestFile);

console.log('\nDone fixing dynamic import issues!');