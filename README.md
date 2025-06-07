# Smart Blinds Hub E-commerce Platform

A comprehensive e-commerce platform for selling custom window treatments (blinds, shades, shutters, etc.) with multi-role functionality for customers, vendors, sales representatives, installers, and administrators.

## Project Overview

Smart Blinds Hub provides a complete solution for browsing, configuring, and purchasing custom window treatments. The platform supports the entire customer journey from product discovery to installation, with specialized interfaces for each role in the process.

## Authentication

The platform uses JWT-based authentication with role-based access control.

### Default Admin Credentials
- **Email**: admin@smartblindshub.com
- **Password**: admin123

## User Roles

### 1. Customer
- Browse products by category
- Configure custom window treatments
- Save configurations and products to wishlist
- Manage shopping cart
- Place orders
- Track order status

### 2. Vendor
Access to Vendor Portal with functionality for:
- Company profile management
- Product catalog management (add/edit/configure products)
- Order management
- Contact information
- Manufacturing details
- Shipping addresses
- Business hours
- Legal documents

### 3. Admin
Comprehensive dashboard with:
- System statistics overview
- Vendor management
- Product management
- Order management
- User management
- System settings

### 4. Sales Person
Specialized interface for:
- Creating quotes
- Managing appointments
- Customer management
- Sales reports
- Performance tracking

### 5. Installer
Dashboard focused on:
- Installation schedule
- Job management
- Completed installations
- Customer information
- Material tracking

## Key Features

### Product Configurator
A sophisticated component that allows users to:
- Select dimensions with fraction precision
- Choose colors and materials
- Select mount types, control types, and other options
- View simulated previews
- Calculate pricing in real-time
- Add to cart or proceed to checkout
- Save configurations
- View augmented reality visualization
- Get style recommendations

### Shopping Cart
Full-featured cart functionality:
- Add/remove items
- Update quantities
- Apply promo codes
- Save items for later
- Save entire carts
- Calculate subtotals, tax, and shipping
- Proceed to checkout

### Database Setup
Initialize the database with sample data using:
```
psql -U postgres -f database/schema.sql
```
![image](https://github.com/user-attachments/assets/73f6f754-55f2-44fe-9050-68d6e253c481)

![image](https://github.com/user-attachments/assets/3a6e441c-d950-4e07-b155-eb156a461999)

![image](https://github.com/user-attachments/assets/92210b0a-aa90-4871-a3e4-a1696b05e321)

![image](https://github.com/user-attachments/assets/66ac1954-a83d-4181-8aae-7e478b1548d4)

## Color Scheme

Our platform uses a carefully selected color palette designed to provide a professional, accessible, and consistent user experience across all interfaces.

### Primary Colors

- **Brand Red** (`#CC2229`)
  - Main brand color
  - Used for primary actions, logos, and important UI elements
  - Provides strong visual hierarchy and brand recognition

- **Dark Blue** (`#1A365D`)
  - Secondary brand color
  - Used for hover states and secondary actions
  - Creates depth and professionalism

### Text Colors

- **Primary Text** (`#333333`)
  - Main text color
  - Used for headings and body text
  - Ensures optimal readability

- **Secondary Text** (`#717171`)
  - Used for supporting text
  - Perfect for descriptions, labels, and less prominent content
  - Maintains hierarchy while staying readable

### Background Colors

- **Main Background** (`#F5F5F5`)
  - Light gray background
  - Used for page backgrounds and hover states
  - Creates subtle contrast and depth

- **White** (`#FFFFFF`)
  - Used for cards, modals, and content areas
  - Provides clean, professional appearance

### Border Colors

- **Light Border** (`#E5E7EB`)
  - Used for subtle separators
  - Creates gentle visual boundaries

- **Main Border** (`#D1D5DB`)
  - Used for more prominent borders
  - Defines clear component boundaries

### Status Colors

- **Success** (`#059669`)
  - Indicates successful actions
  - Used for positive feedback

- **Error** (`#DC2626`)
  - Indicates errors or problems
  - Used for error messages and warnings

- **Warning** (`#D97706`)
  - Indicates caution
  - Used for warning messages

- **Info** (`#2563EB`)
  - Indicates informational content
  - Used for help text and notifications

### Hover States

- **Primary Hover** (`#B91C1C`)
  - Darker red for primary button hover
  - Provides clear interaction feedback

- **Gray Hover** (`#F3F4F6`)
  - Light gray for subtle hover effects
  - Used for menu items and secondary interactions

### Usage Guidelines

1. **Consistency**
   - Use colors consistently across the platform
   - Maintain the established color hierarchy
   - Follow accessibility guidelines for text contrast

2. **Accessibility**
   - Ensure sufficient contrast ratios
   - Use appropriate text colors on different backgrounds
   - Consider color-blind users when using status colors

3. **Implementation**
   - Use Tailwind CSS classes with our custom colors
   - Reference colors from the `colors.ts` file for TypeScript projects
   - Follow the established pattern in layouts and components

4. **Brand Identity**
   - Use the primary red color sparingly for impact
   - Maintain professional appearance with supporting colors
   - Keep interfaces clean and uncluttered

### Technical Implementation

Colors are defined in two locations:

1. `app/styles/colors.ts` - TypeScript constants for programmatic usage
2. `tailwind.config.js` - Tailwind CSS configuration for utility classes

Example usage with Tailwind:
```tsx
// Text color
<p className="text-[#333333]">Primary text</p>

// Background color
<div className="bg-[#F5F5F5]">Background</div>

// Border color
<div className="border border-[#E5E7EB]">Border</div>

// Hover states
<button className="text-[#D42E12] hover:text-[#1A365D]">
  Hover Effect
</button>
```

For more information about our design system and component library, please refer to the Design System documentation.

1. Advanced Product Search & Discovery
  - Smart search with auto-complete
  - Visual search (upload room photos)
  - Product recommendations engine
  - "Recently viewed" tracking
  - Cross-selling and upselling suggestions

  2. Enhanced Sample Management
  - Free sample limit tracking (typically 10-15 per customer)
  - Sample request history
  - Express shipping for samples
  - Sample return system
  - Digital color matching tools

  3. Comprehensive Warranty System
  - Product warranty registration
  - Warranty claim processing
  - Repair/replacement tracking
  - Extended warranty options

  4. Advanced Pricing Features
  - Dynamic pricing based on quantity
  - Bulk order discounts
  - Seasonal promotions system
  - Price match guarantee
  - Trade professional pricing

  🎯 User Experience Enhancements

  5. Room Planning Tools
  - Window measurement calculator
  - Multi-window room planner
  - Color coordination across rooms
  - Room-by-room shopping lists
  - Inspiration galleries by room type

  6. Customer Reviews & Social Proof
  - Photo reviews from customers
  - Video testimonials
  - Installation before/after galleries
  - Q&A section for products
  - Professional designer endorsements

  7. Content & Education Hub
  - How-to installation guides
  - Measuring tutorials with videos
  - Style guides and trends
  - Care and maintenance tips
  - DIY vs Professional decision guide

  🛒 E-commerce Optimization

  8. Advanced Checkout Features
  - Guest checkout option
  - Saved payment methods
  - Multiple shipping addresses
  - Delivery date scheduling
  - Installation appointment booking during checkout

  9. Order Management Enhancements
  - Order modification after placement
  - Rush order options
  - Partial shipment tracking
  - Return merchandise authorization (RMA)
  - Reorder from history with one click

  10. Loyalty & Retention Programs
  - Points-based loyalty system
  - Referral rewards program
  - Trade professional accounts
  - VIP customer tiers
  - Birthday and anniversary offers

  📱 Mobile Experience

  11. Mobile App Features
  - Barcode scanning for reorders
  - Push notifications for order updates
  - Mobile-exclusive deals
  - Offline product browsing
  - Camera-based room visualization

  🔧 Backend & Analytics

  12. Advanced Analytics
  - Conversion funnel tracking
  - A/B testing framework
  - Inventory forecasting
  - Customer lifetime value tracking
  - Seasonal demand planning

  13. Marketing Automation
  - Abandoned cart recovery
  - Post-purchase email sequences
  - Seasonal campaign automation
  - Customer segmentation
  - Personalized product recommendations

  🏢 B2B Features

  14. Trade Professional Portal
  - Volume pricing tiers
  - Project management tools
  - Client proposal generator
  - Trade account application
  - Net payment terms

  🎨 Visualization Enhancements

  15. Advanced AR/VR
  - Full room 360° visualization
  - Multiple product combinations
  - Lighting simulation
  - Shadow casting effects
  - Mobile AR quick preview

  📞 Customer Service

  16. Omnichannel Support
  - Live chat with screen sharing
  - Video consultation booking
  - Callback scheduling
  - Support ticket system
  - Community forum

    17. Advanced Vendor Features (should be #1 priority):
  - Vendor Performance Analytics: Sales metrics, customer ratings, fulfillment speed
  - Commission/Revenue Sharing System: Automated payout calculations
  - Vendor Rating & Review System: Customer feedback on vendor performance
  - Bulk Product Import: CSV/Excel upload for vendor catalogs
  - Vendor Subscription Tiers: Different fee structures based on volume
  - Vendor Marketing Tools: Promotional campaign management
  - Inventory Sync Integration: Real-time stock level updates
  - Vendor Messaging System: Direct communication with customers
  - Automated Vendor Onboarding: Self-service registration with approval workflow
  - Vendor Analytics Dashboard: Sales trends, popular products, seasonal insights

  This marketplace approach with multiple vendors is actually a blue ocean strategy in the blinds industry, where most major players
  operate as single-vendor retailers. You're positioning yourself more like Amazon for window treatments, which could be a major
  competitive advantage.