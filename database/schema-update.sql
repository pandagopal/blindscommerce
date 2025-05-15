-- PostgreSQL Schema for Blinds E-commerce Website
-- Database: smartblindshub

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS blinds;

-- Set search path
SET search_path TO blinds, public;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS shipping_notes CASCADE;
DROP TABLE IF EXISTS shipping_events CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS shipping_rates CASCADE;
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_status CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS installers CASCADE;
DROP TABLE IF EXISTS sales_staff CASCADE;
DROP TABLE IF EXISTS vendor_info CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS price_matrix CASCADE;
DROP TABLE IF EXISTS product_dimensions CASCADE;
DROP TABLE IF EXISTS dimension_types CASCADE;
DROP TABLE IF EXISTS product_colors CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS product_features CASCADE;
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS product_materials CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

----------------------------------------------------------
-- USERS AND AUTHENTICATION
----------------------------------------------------------
CREATE TABLE users (
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
    is_listing_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- VENDOR INFORMATION
----------------------------------------------------------
CREATE TABLE vendor_info (
    vendor_info_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50),
    business_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- SALES STAFF
----------------------------------------------------------
CREATE TABLE sales_staff (
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
CREATE TABLE installers (
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
-- CREATE INDEXES
----------------------------------------------------------
-- Create indexes after all tables are created
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_listing_active ON users(is_listing_active);
CREATE INDEX idx_vendor_info_user_id ON vendor_info(user_id);
CREATE INDEX idx_vendor_info_approval_status ON vendor_info(approval_status);
CREATE INDEX idx_vendor_info_is_active ON vendor_info(is_active);
CREATE INDEX idx_vendor_info_is_verified ON vendor_info(is_verified);
CREATE INDEX idx_vendor_info_is_listing_active ON vendor_info(is_listing_active); 