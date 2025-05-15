-- PostgreSQL Schema for Blinds E-commerce Website
-- Database: smartblindshub

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS blinds;

-- Set search path
SET search_path TO blinds, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------------
-- CATEGORIES
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    meta_title VARCHAR(100),
    meta_description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- PRODUCTS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    full_description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10, 2),
    sku VARCHAR(50) UNIQUE,
    stock_status VARCHAR(20) DEFAULT 'in_stock',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- USERS AND AUTHENTICATION
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    auth_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    verification_token VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add is_listing_active column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'blinds' 
                  AND table_name = 'users' 
                  AND column_name = 'is_listing_active') THEN
        ALTER TABLE users ADD COLUMN is_listing_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

----------------------------------------------------------
-- VENDOR INFORMATION
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_info (
    vendor_info_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50),
    business_description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    year_established INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    approval_status VARCHAR(50) DEFAULT 'pending',
    tax_id VARCHAR(100),
    business_address_line1 VARCHAR(255),
    business_address_line2 VARCHAR(255),
    business_city VARCHAR(100),
    business_state VARCHAR(100),
    business_postal_code VARCHAR(20),
    business_country VARCHAR(100) DEFAULT 'United States',
    return_policy TEXT,
    shipping_policy TEXT,
    avg_processing_time INTEGER,
    avg_shipping_time INTEGER,
    rating DECIMAL(3,2),
    total_sales INTEGER DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add is_listing_active column to vendor_info table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'blinds' 
                  AND table_name = 'vendor_info' 
                  AND column_name = 'is_listing_active') THEN
        ALTER TABLE vendor_info ADD COLUMN is_listing_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

----------------------------------------------------------
-- SALES STAFF
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_staff (
    sales_staff_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    hire_date DATE NOT NULL,
    territory VARCHAR(100),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- INSTALLERS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS installers (
    installer_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    certification_number VARCHAR(50),
    certification_expiry DATE,
    service_area VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ORDERS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status_id INTEGER REFERENCES order_status(status_id),
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_method VARCHAR(100),
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_id INTEGER,
    color_name VARCHAR(50),
    material_id INTEGER,
    material_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_listing_active ON users(is_listing_active);
CREATE INDEX IF NOT EXISTS idx_vendor_info_user_id ON vendor_info(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_info_approval_status ON vendor_info(approval_status);
CREATE INDEX IF NOT EXISTS idx_vendor_info_is_active ON vendor_info(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_info_is_verified ON vendor_info(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_info_is_listing_active ON vendor_info(is_listing_active);

-- Insert default order statuses
INSERT INTO order_status (name, description)
VALUES 
    ('Pending', 'Order has been placed but not yet processed'),
    ('Processing', 'Order is being processed'),
    ('Shipped', 'Order has been shipped'),
    ('Delivered', 'Order has been delivered'),
    ('Cancelled', 'Order has been cancelled'),
    ('Refunded', 'Order has been refunded')
ON CONFLICT (name) DO NOTHING; 