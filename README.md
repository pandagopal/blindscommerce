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



