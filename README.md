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



