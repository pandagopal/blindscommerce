#!/bin/bash

# Script to remove deprecated APIs after consolidation
# This removes all APIs that have been replaced by consolidated endpoints

echo "🧹 Removing Deprecated APIs..."
echo "=============================="

# Track removed count
REMOVED_COUNT=0

# Function to remove directory and count
remove_api() {
    local path=$1
    if [ -d "$path" ]; then
        rm -rf "$path"
        echo "❌ Removed: $path"
        ((REMOVED_COUNT++))
    fi
}

# Admin Dashboard APIs (replaced by /api/admin/dashboard-consolidated)
echo -e "\n📁 Removing deprecated Admin Dashboard APIs..."
remove_api "app/api/admin/dashboard/export"
remove_api "app/api/admin/dashboard/stats"
remove_api "app/api/admin/dashboard/overview"
remove_api "app/api/admin/dashboard/revenue-chart"
remove_api "app/api/admin/dashboard/order-chart"
remove_api "app/api/admin/dashboard/insights"
remove_api "app/api/admin/dashboard/activity"
remove_api "app/api/admin/dashboard/performance"
remove_api "app/api/admin/dashboard/quick-stats"
remove_api "app/api/admin/dashboard/alerts"

# Vendor Dashboard APIs (replaced by /api/vendor/dashboard)
echo -e "\n📁 Removing deprecated Vendor Dashboard APIs..."
remove_api "app/api/vendor/dashboard/overview"
remove_api "app/api/vendor/dashboard/sales-metrics"
remove_api "app/api/vendor/dashboard/product-stats"
remove_api "app/api/vendor/dashboard/recent-activity"
remove_api "app/api/vendor/dashboard/commission"
remove_api "app/api/vendor/dashboard/performance"
remove_api "app/api/vendor/dashboard/alerts"
remove_api "app/api/vendor/dashboard/financial"
remove_api "app/api/vendor/dashboard/sales-team"
remove_api "app/api/vendor/dashboard/quick-actions"

# Cart APIs (replaced by /api/cart)
echo -e "\n📁 Removing deprecated Cart APIs..."
remove_api "app/api/cart/enhanced"
remove_api "app/api/cart/add"
remove_api "app/api/cart/items"
remove_api "app/api/cart/clear"
remove_api "app/api/cart/coupons"
remove_api "app/api/cart/discounts"
remove_api "app/api/cart/shipping"
remove_api "app/api/cart/validate"
remove_api "app/api/cart/recommendations"
remove_api "app/api/cart/bulk"
remove_api "app/api/cart/merge"
remove_api "app/api/cart/save"
remove_api "app/api/cart/restore"
remove_api "app/api/cart/share"
remove_api "app/api/cart/saved-items"
remove_api "app/api/account/cart"

# Payment APIs (replaced by /api/payments/process)
echo -e "\n📁 Removing deprecated Payment APIs..."
remove_api "app/api/payments/stripe/create-payment-intent"
remove_api "app/api/payments/paypal/create-order"
remove_api "app/api/payments/paypal/capture-order"
remove_api "app/api/payments/paypal"
remove_api "app/api/payments/klarna"
remove_api "app/api/payments/afterpay"
remove_api "app/api/payments/affirm"
remove_api "app/api/payments/braintree"

# Product APIs (some replaced by /api/products)
echo -e "\n📁 Removing deprecated Product APIs..."
remove_api "app/api/products/search/visual"
remove_api "app/api/products/compare"
remove_api "app/api/products/bulk"
remove_api "app/api/products/recommendations"
remove_api "app/api/products/configurator"

# Admin Sub-APIs (replaced by consolidated admin endpoints)
echo -e "\n📁 Removing deprecated Admin sub-APIs..."
remove_api "app/api/admin/users/[id]"
remove_api "app/api/admin/users/create"
remove_api "app/api/admin/users/bulk"
remove_api "app/api/admin/vendors/[id]"
remove_api "app/api/admin/vendors/approve"
remove_api "app/api/admin/vendors/suspend"
remove_api "app/api/admin/products/[id]/vendors"
remove_api "app/api/admin/products/[id]/configuration"
remove_api "app/api/admin/products/approve"
remove_api "app/api/admin/products/bulk"
remove_api "app/api/admin/orders/[id]"
remove_api "app/api/admin/orders/export"
remove_api "app/api/admin/orders/refund"
remove_api "app/api/admin/orders/bulk"

# Vendor Sub-APIs (replaced by consolidated vendor endpoints)
echo -e "\n📁 Removing deprecated Vendor sub-APIs..."
remove_api "app/api/vendor/products/[id]"
remove_api "app/api/vendor/products/create"
remove_api "app/api/vendor/products/bulk"
remove_api "app/api/vendor/products/duplicate"
remove_api "app/api/vendor/products/inheritance"
remove_api "app/api/vendor/products/clone"
remove_api "app/api/vendor/bulk-products"
remove_api "app/api/vendor/orders/[orderId]"
remove_api "app/api/vendor/orders/export"
remove_api "app/api/vendor/orders/tracking"

# Account APIs (replaced by consolidated endpoints)
echo -e "\n📁 Removing deprecated Account APIs..."
remove_api "app/api/account/wishlist"
remove_api "app/api/account/addresses/[id]"
remove_api "app/api/account/payment-methods/[id]"
remove_api "app/api/account/preferences/notifications"

# Pricing APIs (replaced by /api/pricing/calculate)
echo -e "\n📁 Removing deprecated Pricing APIs..."
remove_api "app/api/pricing/tax"
remove_api "app/api/pricing/shipping"
remove_api "app/api/pricing/discounts"
remove_api "app/api/pricing/volume"

# Check for empty parent directories and clean them up
echo -e "\n🧹 Cleaning up empty directories..."
find app/api -type d -empty -delete 2>/dev/null

echo -e "\n✅ Cleanup Complete!"
echo "=============================="
echo "Total APIs removed: $REMOVED_COUNT"
echo ""
echo "📋 Remaining consolidated endpoints:"
echo "  • /api/admin/dashboard-consolidated"
echo "  • /api/admin/users"
echo "  • /api/admin/vendors"
echo "  • /api/admin/orders"
echo "  • /api/admin/products"
echo "  • /api/vendor/dashboard"
echo "  • /api/vendor/products"
echo "  • /api/vendor/orders"
echo "  • /api/cart"
echo "  • /api/products"
echo "  • /api/payments/process"
echo ""
echo "🎉 API consolidation cleanup complete!"