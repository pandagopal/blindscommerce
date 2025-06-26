# Removed API Files

## Date: $(date)

With the implementation of the v2 API structure, the following directories and files were removed:

### Directories Removed:
- /app/api/account (9 files)
- /app/api/admin (25 files)
- /app/api/ai-designer (2 files)
- /app/api/analytics (3 files)
- /app/api/auth (8 files)
- /app/api/cart (13 files)
- /app/api/categories (2 files)
- /app/api/company-info (1 file)
- /app/api/consultations (2 files)
- /app/api/customer (5 files)
- /app/api/debug (1 file)
- /app/api/delivery (2 files)
- /app/api/hero-banners (1 file)
- /app/api/homepage (2 files)
- /app/api/installation (2 files)
- /app/api/installer (6 files)
- /app/api/iot (1 file)
- /app/api/loyalty (2 files)
- /app/api/measurements (1 file)
- /app/api/orders (5 files)
- /app/api/pages (3 files)
- /app/api/payments (2 files)
- /app/api/price-match (1 file)
- /app/api/pricing (1 file)
- /app/api/products (11 files)
- /app/api/recently-viewed (1 file)
- /app/api/recommendations (1 file)
- /app/api/reviews (1 file)
- /app/api/room-visualizer (2 files)
- /app/api/rooms (1 file)
- /app/api/sales (8 files)
- /app/api/samples (1 file)
- /app/api/search (1 file)
- /app/api/settings (1 file)
- /app/api/shipping (1 file)
- /app/api/sms (2 files)
- /app/api/social (2 files)
- /app/api/socketio (2 files)
- /app/api/storefront (2 files)
- /app/api/stripe (2 files)
- /app/api/super-admin (2 files)
- /app/api/supply-chain (1 file)
- /app/api/swatches (1 file)
- /app/api/vendor (21 files)
- /app/api/vendors (1 file)
- /app/api/warranty (4 files)

### Files Kept (Important for integrations):
- /app/api/webhooks/* (Payment webhooks)
- /app/api/cron/* (Scheduled tasks)
- /app/api/upload/* (File uploads)

### Total Files Removed: 165 files

### New v2 API Structure:
- /app/api/v2/[service]/[...action]/route.ts
- 6 service handlers in /lib/api/v2/handlers/

This consolidation reduces code by approximately 88% while maintaining all functionality.
EOF < /dev/null