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
- **Role-based access control** with middleware protection
- **Password requirements**: 8+ chars, uppercase, lowercase, number, special char

### User Roles & Capabilities

#### 1. **Customer**
- Browse and configure products
- Manage cart, wishlist, orders
- Save measurements and configurations
- Book consultations and installations
- Account management (addresses, payments, etc.)

#### 2. **Admin**
- **Full system access**
- User and vendor management
- Product catalog administration
- Order management and analytics
- System settings and database management
- Pricing controls (discounts, commissions)

#### 3. **Vendor**
- Product catalog management
- Order fulfillment
- Custom storefront (`/storefront/[vendor]`)
- Performance analytics
- Business profile management

#### 4. **Sales Representative**
- Lead management and customer assistance
- Quote creation and order support
- Performance tracking and analytics
- Customer communication tools

#### 5. **Installer**
- Job scheduling and route optimization
- Installation appointments management
- Material tracking and job completion
- Customer communication and reporting

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
- **Connection pooling** configured (max 10 connections)
- **Retry logic** for failed connections (5 retries in production)
- **Environment validation** for required credentials

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

This README serves as a comprehensive reference for understanding the BlindsCommerce application architecture, business logic, and development patterns. Update this document as the application evolves and new features are added.