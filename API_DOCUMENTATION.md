# BlindsCommerce API Documentation

## Overview
This document provides a comprehensive list of all API routes in the BlindsCommerce e-commerce platform. The system supports multiple user roles (customers, vendors, sales representatives, installers, administrators) with role-based access control.

---

## Authentication & User Management (9 APIs)

### `/api/auth/login`
- **Methods**: POST
- **Description**: Authenticates users with email/password, returns JWT token and role-based redirect URL
- **Access**: Public
- **Features**: Rate limiting, secure cookie setting, multi-role support

### `/api/auth/register`
- **Methods**: POST
- **Description**: Public registration for customers only
- **Access**: Public
- **Notes**: Other roles must be created by admin

### `/api/auth/logout`
- **Methods**: POST, GET
- **Description**: Clears authentication cookies and tokens
- **Access**: Authenticated users
- **Features**: Supports redirect parameter

### `/api/auth/me`
- **Methods**: GET
- **Description**: Returns current authenticated user information
- **Access**: Authenticated users
- **Usage**: Session validation and user profile display

### `/api/auth/reset-password`
- **Methods**: POST
- **Description**: Handles password reset functionality
- **Access**: Public
- **Features**: Security validation and email verification

### `/api/auth/change-password`
- **Methods**: POST
- **Description**: Allows authenticated users to change their password
- **Access**: Authenticated users
- **Security**: Requires current password verification

### `/api/auth/trade-application`
- **Methods**: POST
- **Description**: Handles trade professional account applications
- **Access**: Public
- **Purpose**: B2B registration workflow for contractors and designers

---

## Product Management (8 APIs)

### `/api/products`
- **Methods**: GET
- **Description**: Fetches paginated products list with filtering, sorting, and search capabilities
- **Access**: Public
- **Features**: Caching, category/price/search filters, vendor-aware pricing
- **Performance**: High traffic endpoint with comprehensive caching

### `/api/products/[slug]`
- **Methods**: GET
- **Description**: Retrieves product details by slug
- **Access**: Public
- **Features**: Configuration mode, fabric options, pricing matrix, dimensions

### `/api/products/search`
- **Methods**: GET
- **Description**: Advanced product search with faceted filtering and relevance scoring
- **Access**: Public
- **Features**: Full-text search, category/brand/color/material filters, pagination

### `/api/products/[slug]/configuration`
- **Methods**: GET
- **Description**: Returns product configuration options for the customizer
- **Access**: Public
- **Data**: Fabric options, pricing matrix, control types, mount types

### `/api/products/[slug]/pricing`
- **Methods**: GET
- **Description**: Calculates dynamic pricing based on configuration and dimensions
- **Access**: Public
- **Features**: Real-time pricing with vendor-specific discounts

### `/api/products/[slug]/vendor-options`
- **Methods**: GET
- **Description**: Returns vendor-specific product options and pricing
- **Access**: Public
- **Purpose**: Multi-vendor marketplace functionality

### `/api/products/[slug]/reviews`
- **Methods**: GET, POST
- **Description**: Product reviews and ratings system
- **Access**: GET (Public), POST (Customers)
- **Features**: Customer feedback and product rating aggregation

### `/api/products/create`
- **Methods**: POST
- **Description**: Creates new products
- **Access**: Admin, Vendor
- **Features**: Multi-role product creation with approval workflow

---

## Shopping Cart & Checkout (7 APIs)

### `/api/account/cart`
- **Methods**: GET, POST, PUT, DELETE
- **Description**: Complete cart management - view, add, update, remove items
- **Access**: Customers, Guests
- **Features**: JSON configuration storage, real-time pricing
- **Performance**: Frequent updates, optimized for speed

### `/api/account/cart/items/[id]`
- **Methods**: PATCH, DELETE
- **Description**: Individual cart item operations
- **Access**: Customers, Guests
- **Returns**: Updated cart state after modifications

### `/api/cart/apply-coupon`
- **Methods**: POST, DELETE
- **Description**: Apply/remove vendor-specific coupons to cart
- **Access**: Customers, Guests
- **Features**: Multi-vendor coupon system with validation and usage tracking

### `/api/cart/enhanced`
- **Methods**: GET, POST
- **Description**: Enhanced cart with advanced features
- **Access**: Customers
- **Features**: Save for later, gift options

### `/api/cart/vendor-discounts`
- **Methods**: GET
- **Description**: Retrieves applicable vendor discounts for cart items
- **Access**: Customers
- **Features**: Automatic discount calculation per vendor

### `/api/pricing/calculate`
- **Methods**: POST
- **Description**: **CORE PRICING ENGINE** - Comprehensive pricing calculation
- **Access**: Public
- **Features**: Multi-vendor discounts, coupons, tax, shipping, ZIP-based tax calculation
- **Importance**: ⭐ Critical system component

---

## Order Management (5 APIs)

### `/api/orders/create`
- **Methods**: POST
- **Description**: Creates new orders with payment processing and inventory management
- **Access**: Customers
- **Features**: Multi-vendor order splitting, commission tracking, payment integration

### `/api/account/orders`
- **Methods**: GET
- **Description**: Returns paginated list of user's orders
- **Access**: Customers
- **Features**: Order history with filtering and search

### `/api/account/orders/[id]`
- **Methods**: GET
- **Description**: Detailed order information for specific order
- **Access**: Customers (own orders), Admin (all)
- **Data**: Order items, tracking, status updates

### `/api/orders/[id]/modifications`
- **Methods**: GET, POST
- **Description**: Order modification system for changes after placement
- **Access**: Customers (own orders), Admin
- **Features**: Track changes, pricing adjustments, approval workflow

### `/api/orders/[id]/modifications/[modId]`
- **Methods**: GET, PUT, DELETE
- **Description**: Individual modification management
- **Access**: Customers (own orders), Admin
- **Features**: Modification approval, rejection, cancellation

---

## Payment Processing (6 APIs)

### `/api/stripe/create-payment-intent`
- **Methods**: POST
- **Description**: Creates Stripe payment intent for checkout
- **Access**: Customers
- **Security**: Secure payment processing with customer information

### `/api/payments/stripe/config`
- **Methods**: GET
- **Description**: Returns Stripe configuration for frontend integration
- **Access**: Public
- **Data**: Public key and configuration settings

### `/api/payments/paypal/create-order`
- **Methods**: POST
- **Description**: Creates PayPal order for alternative payment method
- **Access**: Customers
- **Purpose**: PayPal integration for customer choice

### `/api/payments/klarna/create-session`
- **Methods**: POST
- **Description**: Creates Klarna payment session for buy-now-pay-later
- **Access**: Customers
- **Purpose**: BNPL option integration

### `/api/payments/methods`
- **Methods**: GET
- **Description**: Returns available payment methods based on admin settings
- **Access**: Public
- **Features**: Dynamic payment method availability

### `/api/webhooks/stripe`
- **Methods**: POST
- **Description**: Handles Stripe webhook events for payment status updates
- **Access**: Stripe webhooks only
- **Purpose**: Payment confirmations, disputes, refunds processing

---

## Admin Dashboard (8 APIs)

### `/api/admin/dashboard/stats`
- **Methods**: GET
- **Description**: Admin dashboard statistics and analytics
- **Access**: Admin only
- **Data**: Revenue, orders, customers, growth metrics

### `/api/admin/users`
- **Methods**: GET, POST
- **Description**: User management - list, create, and manage all user types
- **Access**: Admin only
- **Features**: Role-based user creation and management

### `/api/admin/products`
- **Methods**: GET, POST
- **Description**: Product management for administrators
- **Access**: Admin only
- **Features**: Full product CRUD operations, vendor assignments

### `/api/admin/orders`
- **Methods**: GET
- **Description**: All orders management and monitoring
- **Access**: Admin only
- **Features**: Order status updates, fulfillment tracking

### `/api/admin/vendors`
- **Methods**: GET, POST
- **Description**: Vendor management and approval
- **Access**: Admin only
- **Features**: Vendor onboarding, approval workflow, status management

### `/api/admin/categories`
- **Methods**: GET, POST
- **Description**: Product category management
- **Access**: Admin only
- **Features**: Category hierarchy, display order, featured categories

### `/api/admin/settings`
- **Methods**: GET, PUT
- **Description**: **SYSTEM CONFIGURATION** - System-wide configuration management
- **Access**: Admin only
- **Features**: Payment settings, shipping rates, tax configuration
- **Importance**: ⭐ Critical system component

### `/api/admin/rooms`
- **Methods**: GET, POST, PUT, DELETE
- **Description**: Room types management
- **Access**: Admin only
- **Features**: Room type CRUD, typical humidity, light exposure settings

---

## Vendor Portal (6 APIs)

### `/api/vendor/dashboard`
- **Methods**: GET
- **Description**: Vendor-specific dashboard with sales metrics and recent orders
- **Access**: Vendor only
- **Data**: Revenue tracking, product performance, order management

### `/api/vendor/products`
- **Methods**: GET, POST
- **Description**: Vendor's product catalog management
- **Access**: Vendor only
- **Features**: Product creation, editing, inventory management

### `/api/vendor/orders`
- **Methods**: GET
- **Description**: Orders containing vendor's products
- **Access**: Vendor only
- **Features**: Order fulfillment, status updates, shipping tracking

### `/api/vendor/discounts`
- **Methods**: GET, POST, PUT, DELETE
- **Description**: Vendor-specific discount and promotion management
- **Access**: Vendor only
- **Features**: Automatic discounts, volume pricing, promotional campaigns

### `/api/vendor/coupons`
- **Methods**: GET, POST, PUT, DELETE
- **Description**: Vendor coupon code management
- **Access**: Vendor only
- **Features**: Coupon creation, usage tracking, expiration management

### `/api/vendor/analytics`
- **Methods**: GET
- **Description**: Vendor performance analytics and reporting
- **Access**: Vendor only
- **Data**: Sales trends, customer insights, product performance

---

## Sales Representative Tools (4 APIs)

### `/api/sales/dashboard`
- **Methods**: GET
- **Description**: Sales rep dashboard with performance metrics and commission tracking
- **Access**: Sales Representative only
- **Data**: Monthly targets, commission calculations, customer management

### `/api/sales/leads`
- **Methods**: GET, POST
- **Description**: Lead management and customer assignment
- **Access**: Sales Representative only
- **Features**: Lead tracking, conversion metrics, follow-up scheduling

### `/api/sales/orders`
- **Methods**: GET
- **Description**: Orders assigned to sales representative
- **Access**: Sales Representative only
- **Features**: Sales attribution, commission tracking

### `/api/sales/assistance`
- **Methods**: GET, POST
- **Description**: Customer assistance and live help functionality
- **Access**: Sales Representative only
- **Features**: Real-time customer support, cart assistance

---

## Installer Management (3 APIs)

### `/api/installer/jobs`
- **Methods**: GET, POST
- **Description**: Installation job management and scheduling
- **Access**: Installer only
- **Features**: Job assignment, scheduling, progress tracking, customer satisfaction

### `/api/installer/appointments`
- **Methods**: GET, POST
- **Description**: Installation appointment scheduling
- **Access**: Installer only
- **Features**: Calendar integration, customer communication

### `/api/installation/availability`
- **Methods**: GET
- **Description**: Check installer availability for scheduling
- **Access**: Public
- **Features**: Real-time availability, geographic coverage

---

## Categories & Content (4 APIs)

### `/api/categories`
- **Methods**: GET
- **Description**: Product categories with hierarchy and display information
- **Access**: Public
- **Features**: Featured categories, display order, category images

### `/api/homepage/data`
- **Methods**: GET
- **Description**: **HOMEPAGE CONTENT** - Homepage content including featured products and categories
- **Access**: Public
- **Features**: Cached content for performance, featured items rotation
- **Performance**: ⭐ High traffic endpoint with extensive caching

### `/api/hero-banners`
- **Methods**: GET
- **Description**: Homepage banner management
- **Access**: Public
- **Purpose**: Promotional banners, campaign management

### `/api/rooms`
- **Methods**: GET
- **Description**: Room types and recommendations
- **Access**: Public
- **Features**: Room-based product filtering and recommendations

---

## Advanced Features (5 APIs)

### `/api/room-visualizer`
- **Methods**: POST
- **Description**: AI-powered room analysis and product recommendations
- **Access**: Public
- **Features**: Image processing, ML recommendations, AR integration

### `/api/ai-designer/emotion-detection`
- **Methods**: POST
- **Description**: Emotion-based design recommendations
- **Access**: Public
- **Features**: AI analysis of customer preferences

### `/api/search/visual`
- **Methods**: POST
- **Description**: Visual search using uploaded images
- **Access**: Public
- **Features**: Image recognition, similar product matching

### `/api/recommendations`
- **Methods**: GET
- **Description**: Personalized product recommendations
- **Access**: Public/Customers
- **Features**: Behavior-based recommendations, cross-selling

### `/api/swatch-orders`
- **Methods**: GET, POST
- **Description**: Physical sample ordering system
- **Access**: Customers
- **Features**: Sample management, shipping tracking

---

## User Account Management (7 APIs)

### `/api/account/dashboard`
- **Methods**: GET
- **Description**: Customer dashboard with order history and account info
- **Access**: Customers only
- **Features**: Personalized dashboard with recent activity

### `/api/account/profile`
- **Methods**: GET, PUT
- **Description**: User profile management
- **Access**: Authenticated users
- **Features**: Personal information updates, preferences

### `/api/account/shipping-addresses`
- **Methods**: GET, POST
- **Description**: Shipping addresses management
- **Access**: Customers only
- **Features**: Multiple address support, address validation

### `/api/account/shipping-addresses/[id]`
- **Methods**: GET, PUT, DELETE
- **Description**: Individual address management
- **Access**: Customers only
- **Features**: Address CRUD operations, default address setting

### `/api/account/shipping-addresses/[id]/default`
- **Methods**: POST
- **Description**: Set address as default
- **Access**: Customers only
- **Features**: Default address management

### `/api/account/wishlist`
- **Methods**: GET, POST, DELETE
- **Description**: Wishlist management
- **Access**: Customers only
- **Features**: Save products for later, wishlist sharing

### `/api/account/measurements`
- **Methods**: GET, POST
- **Description**: Room measurements storage and management
- **Access**: Customers only
- **Purpose**: Installation requirements, accurate pricing

---

## Utility & Support (6 APIs)

### `/api/settings`
- **Methods**: GET
- **Description**: Public application settings and configuration
- **Access**: Public
- **Data**: Tax rates, shipping thresholds, payment methods

### `/api/delivery/schedule`
- **Methods**: GET, POST
- **Description**: Delivery scheduling system
- **Access**: Customers
- **Features**: Calendar integration, time slot management, capacity checking

### `/api/warranty/register`
- **Methods**: POST
- **Description**: Product warranty registration
- **Access**: Customers
- **Features**: Warranty tracking, claim management

### `/api/recently-viewed`
- **Methods**: GET, POST
- **Description**: Customer browsing history tracking
- **Access**: Customers
- **Purpose**: Personalization, recommendation engine

### `/api/tax/calculate`
- **Methods**: POST
- **Description**: Tax calculation by ZIP code
- **Access**: Public
- **Features**: Real-time tax calculation, ZIP code validation

### `/api/shipping/rates`
- **Methods**: GET
- **Description**: Shipping rate calculation
- **Access**: Public
- **Features**: Distance-based shipping, carrier integration

---

## System Architecture Notes

### Key Features:
1. **Multi-Vendor System**: All pricing, discounts, and coupons are vendor-specific
2. **Role-Based Access**: Strict authentication and authorization throughout
3. **Caching Strategy**: Multiple cache layers for performance optimization
4. **Rate Limiting**: Protection against abuse and DOS attacks
5. **Security**: Input validation, SQL injection prevention, XSS protection
6. **Real-time Features**: WebSocket support for live updates
7. **Payment Integration**: Multiple payment providers (Stripe, PayPal, Klarna, Afterpay)
8. **Tax Calculation**: ZIP code-based tax rates with caching
9. **Complex Pricing**: Multi-tier pricing with volume discounts, customer-specific rates
10. **Admin Override System**: Admins can view any user role's dashboard for support

### Performance Critical APIs (⭐):
- `/api/pricing/calculate` - Core pricing engine
- `/api/admin/settings` - System configuration
- `/api/homepage/data` - Homepage content (high traffic)
- `/api/products` - Product listing (high traffic)
- `/api/account/cart` - Shopping cart (frequent updates)

### Security Notes:
- All authenticated endpoints require valid JWT tokens
- Role-based access control enforced at API level
- Payment processing uses encrypted credentials
- Rate limiting on authentication endpoints
- Input validation and sanitization on all endpoints

---

## API Summary Statistics

**Total API Endpoints**: ~90
- Authentication & User Management: 9 APIs
- Product Management: 8 APIs  
- Shopping Cart & Checkout: 7 APIs
- Order Management: 5 APIs
- Payment Processing: 6 APIs
- Admin Dashboard: 8 APIs
- Vendor Portal: 6 APIs
- Sales Representative: 4 APIs
- Installer Management: 3 APIs
- Categories & Content: 4 APIs
- Advanced Features: 5 APIs
- User Account Management: 7 APIs
- Utility & Support: 6 APIs

**Database Connection Pattern**: All APIs use immediate connection release after database operations to prevent connection pool exhaustion.

**Caching Strategy**: Multi-tier caching implemented across high-traffic endpoints with configurable TTL values.