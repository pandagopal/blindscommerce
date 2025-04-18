-- PostgreSQL Schema for Blinds E-commerce Website
-- Database: smartblindshub

-- Drop database if it exists and create a new one
DROP DATABASE IF EXISTS smartblindshub;
CREATE DATABASE smartblindshub;

\c smartblindshub;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA blinds;

-- Set search path
SET search_path TO blinds, public;

----------------------------------------------------------
-- CATEGORIES
----------------------------------------------------------
CREATE TABLE categories (
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
CREATE TABLE products (
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
-- PRODUCT IMAGES
----------------------------------------------------------
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- FABRICS/MATERIALS
----------------------------------------------------------
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- PRODUCT MATERIALS
----------------------------------------------------------
CREATE TABLE product_materials (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(material_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- PRODUCT FEATURES
----------------------------------------------------------
CREATE TABLE features (
    feature_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_features (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES features(feature_id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- COLORS
----------------------------------------------------------
CREATE TABLE colors (
    color_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7),
    color_group VARCHAR(50),  -- Earthy Tones, Neutrals, Bold Colors, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    color_id INTEGER REFERENCES colors(color_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- PRODUCT DIMENSIONS AND PRICING
----------------------------------------------------------
CREATE TABLE dimension_types (
    dimension_type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_dimensions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    dimension_type_id INTEGER REFERENCES dimension_types(dimension_type_id) ON DELETE CASCADE,
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    increment DECIMAL(10, 2),
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_matrix (
    price_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    year_established INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    tax_id VARCHAR(100),
    business_address_line1 VARCHAR(255),
    business_address_line2 VARCHAR(255),
    business_city VARCHAR(100),
    business_state VARCHAR(100),
    business_postal_code VARCHAR(20),
    business_country VARCHAR(100) DEFAULT 'United States',
    return_policy TEXT,
    shipping_policy TEXT,
    avg_processing_time INTEGER, -- in days
    avg_shipping_time INTEGER, -- in days
    rating DECIMAL(3,2),
    total_sales INTEGER DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_listing_active BOOLEAN DEFAULT TRUE, -- Controls whether vendor products are visible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ADDRESSES
----------------------------------------------------------
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL, -- billing, shipping
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- CART AND WISHLIST
----------------------------------------------------------
CREATE TABLE carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_id INTEGER REFERENCES colors(color_id) ON DELETE SET NULL,
    material_id INTEGER REFERENCES materials(material_id) ON DELETE SET NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INTEGER REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ORDERS AND PAYMENTS
----------------------------------------------------------
CREATE TABLE order_status (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status_id INTEGER REFERENCES order_status(status_id) ON DELETE SET NULL,
    billing_address_id INTEGER REFERENCES addresses(address_id) ON DELETE SET NULL,
    shipping_address_id INTEGER REFERENCES addresses(address_id) ON DELETE SET NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_method VARCHAR(100),
    payment_method VARCHAR(100),
    notes TEXT,
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    -- Shipping logistics extensions
    carrier_service VARCHAR(255),
    shipping_label_url VARCHAR(512),
    handling_time_days INTEGER DEFAULT 1,
    packaging_instructions TEXT,
    packaging_photos JSON,
    shipping_dimensions JSON, -- {length, width, height, weight}
    shipping_damage_reported BOOLEAN DEFAULT FALSE,
    is_return BOOLEAN DEFAULT FALSE,
    return_reason TEXT,
    return_authorized_by VARCHAR(255),
    return_authorized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_id INTEGER REFERENCES colors(color_id) ON DELETE SET NULL,
    color_name VARCHAR(50),
    material_id INTEGER REFERENCES materials(material_id) ON DELETE SET NULL,
    material_name VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- SHIPPING AND DELIVERY
----------------------------------------------------------
CREATE TABLE shipping_methods (
    method_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    delivery_time_min INTEGER, -- in days
    delivery_time_max INTEGER, -- in days
    flat_rate DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_zones (
    zone_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    postal_code_pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_rates (
    rate_id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES shipping_zones(zone_id) ON DELETE CASCADE,
    method_id INTEGER REFERENCES shipping_methods(method_id) ON DELETE CASCADE,
    min_order_value DECIMAL(10, 2) DEFAULT 0.00,
    max_order_value DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add shipment tracking tables
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    tracking_number VARCHAR(255),
    tracking_url VARCHAR(512),
    carrier VARCHAR(255) NOT NULL,
    service_level VARCHAR(255),
    shipping_date TIMESTAMP,
    estimated_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    shipping_label_url VARCHAR(512),
    shipping_cost DECIMAL(10, 2),
    shipping_status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, delivered, exception, returned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_return BOOLEAN DEFAULT FALSE
);

CREATE TABLE shipping_events (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    event_date TIMESTAMP NOT NULL,
    event_location VARCHAR(255),
    event_description TEXT,
    event_status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_notes (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL, -- customer, vendor, system
    note_text TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- REVIEWS AND RATINGS
----------------------------------------------------------
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'approved', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- DISCOUNT COUPONS
----------------------------------------------------------
CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_categories (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_products (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ADDITIONAL FEATURES
----------------------------------------------------------
CREATE TABLE measurement_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_id INTEGER REFERENCES addresses(address_id) ON DELETE SET NULL,
    preferred_date DATE,
    alternate_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE installation_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_id INTEGER REFERENCES addresses(address_id) ON DELETE SET NULL,
    preferred_date DATE,
    alternate_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- SAMPLE DATA INSERTION
----------------------------------------------------------

-- Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Faux Wood Blinds', 'faux-wood-blinds', 'Affordable and durable blinds that mimic the look of real wood', '/images/categories/faux-wood-blinds.jpg'),
('Wood Blinds', 'wood-blinds', 'Classic wooden blinds made from premium hardwoods', '/images/categories/wood-blinds.jpg'),
('Cellular Shades', 'cellular-shades', 'Energy efficient honeycomb design for superior insulation', '/images/categories/cellular-shades.jpg'),
('Roller Shades', 'roller-shades', 'Clean, modern window coverings with smooth operation', '/images/categories/roller-shades.jpg'),
('Roman Shades', 'roman-shades', 'Elegant fabric shades that fold up when raised', '/images/categories/roman-shades.jpg'),
('Woven Wood Shades', 'woven-wood-shades', 'Natural materials for a warm, textured look', '/images/categories/woven-wood-shades.jpg');

-- Colors and Color Groups
INSERT INTO colors (name, hex_code, color_group) VALUES
-- Earthy Tones
('Rustic Oak', '#8B4513', 'Earthy Tones'),
('Desert Sand', '#EDC9AF', 'Earthy Tones'),
('Terra Cotta', '#E2725B', 'Earthy Tones'),
('Sage Green', '#9CAF88', 'Earthy Tones'),
-- Neutrals
('White', '#FFFFFF', 'Neutrals'),
('Gray', '#808080', 'Neutrals'),
('Black', '#000000', 'Neutrals'),
('Beige', '#F5F5DC', 'Neutrals'),
('Ivory', '#FFFFF0', 'Neutrals'),
('Tan', '#D2B48C', 'Neutrals'),
-- Bold Colors
('Navy Blue', '#000080', 'Bold Colors'),
('Burgundy', '#800020', 'Bold Colors'),
('Forest Green', '#228B22', 'Bold Colors'),
('Royal Purple', '#7851A9', 'Bold Colors');

-- Materials
INSERT INTO materials (name, description) VALUES
('Premium PVC', 'High-quality PVC slats that resist fading and warping'),
('Basswood', 'Premium hardwood known for its fine grain and lightweight'),
('Polyester', 'Durable and easy to clean fabric material'),
('Linen', 'Natural fabric with a distinctive texture and appearance'),
('Bamboo', 'Sustainable and eco-friendly natural material'),
('Aluminum', 'Durable metal perfect for modern decor');

-- Features
INSERT INTO features (name, description) VALUES
('Cordless', 'Safe and convenient cordless operation'),
('Smart Home Compatible', 'Can be controlled with smart home systems'),
('Blackout', 'Blocks 100% of outside light'),
('Light Filtering', 'Allows diffused light while maintaining privacy'),
('Energy Efficient', 'Provides insulation to save on energy costs'),
('UV Protection', 'Blocks harmful UV rays to protect furniture and flooring'),
('Motorized', 'Battery or electric powered for remote operation');

-- Dimension Types
INSERT INTO dimension_types (name, unit, description) VALUES
('Width', 'inches', 'Horizontal measurement of the window covering'),
('Height', 'inches', 'Vertical measurement of the window covering');

-- Shipping Methods
INSERT INTO shipping_methods (name, description, delivery_time_min, delivery_time_max, flat_rate) VALUES
('Standard Shipping', 'Regular shipping service', 5, 7, 0.00),
('Express Shipping', 'Faster delivery service', 2, 3, 15.99),
('Next Day Air', 'Delivered on the next business day', 1, 1, 29.99);

-- Products
INSERT INTO products (category_id, name, slug, short_description, full_description, base_price, rating, review_count, is_featured, sku) VALUES
(1, 'Premium Faux Wood Blinds', 'premium-faux-wood-blinds', 'Get the look of real wood at a fraction of the cost. Perfect for high-humidity areas.', 'Our Premium Faux Wood Blinds offer the warm, natural appearance of real wood without the high cost. Made from durable PVC composite, these blinds resist warping, fading, and cracking, making them ideal for kitchens, bathrooms, and other high-humidity areas. Available in a variety of slat sizes and colors to complement any décor.', 79.98, 4.7, 823, TRUE, 'FWB-PREM-001'),
(1, 'Premium 2.5-inch Faux Wood Blinds', 'premium-2-5-inch-faux-wood-blinds', 'Wider slats for better view and light control. Classic appearance of plantation shutters.', 'Our Premium 2.5-inch Faux Wood Blinds feature wider slats that provide excellent view-through when open and superior light control when closed. The larger slat size gives the classic appearance of plantation shutters at a fraction of the cost. Perfect for any room in your home, these blinds are moisture-resistant and easy to clean.', 139.98, 4.8, 615, TRUE, 'FWB-PREM-25-001'),
(1, 'Economy Faux Wood Blinds', 'economy-faux-wood-blinds', 'Our best value faux wood blinds combine affordability with quality. Perfect starter option.', 'These Economy Faux Wood Blinds offer the best value without sacrificing quality. Ideal for apartments, rental properties, or budget renovations, these blinds feature the realistic appearance of wood at our most affordable price point. Available in popular neutral colors that coordinate with any décor.', 59.98, 4.5, 1245, FALSE, 'FWB-ECON-001'),
(2, 'Premium Hardwood Blinds', 'premium-hardwood-blinds', 'Luxurious real wood blinds crafted from sustainable North American hardwoods.', 'Our Premium Hardwood Blinds are crafted from sustainably harvested North American basswood and feature a furniture-grade finish. These lightweight yet durable blinds add warmth and elegance to any room. Each blind is carefully inspected for quality and consistency, ensuring a perfect addition to your home.', 199.98, 4.9, 412, TRUE, 'WB-PREM-001'),
(2, 'Designer Wood Blinds', 'designer-wood-blinds', 'Sophisticated wood blinds with decorative tapes and premium finishes.', 'Elevate your interior design with our Designer Wood Blinds. These premium blinds feature decorative cloth tapes, unique stains, and specialized painting techniques for a truly customized look. Made from select hardwoods and treated with a UV-resistant finish to prevent fading and yellowing.', 299.98, 4.8, 287, FALSE, 'WB-DSGN-001'),
(3, 'Double Cell Cordless Cellular Shades', 'double-cell-cordless-cellular-shades', 'Superior insulation with double honeycomb construction. Energy efficient design.', 'Our Double Cell Cordless Cellular Shades feature a honeycomb design with two cells that trap air for superior insulation and energy efficiency. The cordless lift mechanism offers clean lines and enhanced safety for homes with children and pets. Available in light filtering and blackout options to suit your privacy and light control needs.', 99.98, 4.6, 932, TRUE, 'CS-DBLC-001');

-- Product Images (sample entries)
INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES
(1, '/images/products/premium-faux-wood-blinds-main.jpg', 'Premium Faux Wood Blinds - Living Room Window', TRUE),
(1, '/images/products/premium-faux-wood-blinds-detail.jpg', 'Premium Faux Wood Blinds - Close-up Detail', FALSE),
(2, '/images/products/premium-2-5-inch-faux-wood-blinds-main.jpg', 'Premium 2.5-inch Faux Wood Blinds - Kitchen Window', TRUE),
(3, '/images/products/economy-faux-wood-blinds-main.jpg', 'Economy Faux Wood Blinds - Bedroom Setting', TRUE);

-- Product Features (sample entries)
INSERT INTO product_features (product_id, feature_id, value) VALUES
(1, 4, 'Yes'), -- Light Filtering
(1, 5, 'Medium'), -- Energy Efficient
(2, 4, 'Yes'), -- Light Filtering
(2, 5, 'High'), -- Energy Efficient
(3, 4, 'Yes'), -- Light Filtering
(4, 5, 'High'), -- Energy Efficient
(4, 6, 'Yes'); -- UV Protection

-- Product Colors (sample entries)
INSERT INTO product_colors (product_id, color_id, price_modifier, is_default) VALUES
(1, 5, 0.00, TRUE),  -- White (default)
(1, 8, 0.00, FALSE), -- Beige
(1, 10, 5.00, FALSE), -- Tan
(2, 5, 0.00, TRUE),  -- White (default)
(2, 10, 5.00, FALSE), -- Tan
(2, 1, 10.00, FALSE); -- Rustic Oak

-- Product Materials (sample entries)
INSERT INTO product_materials (product_id, material_id, price_modifier, is_default) VALUES
(1, 1, 0.00, TRUE),  -- Premium PVC (default)
(2, 1, 0.00, TRUE),  -- Premium PVC (default)
(3, 1, 0.00, TRUE),  -- Premium PVC (default)
(4, 2, 0.00, TRUE);  -- Basswood (default)

-- Product Dimensions (sample entries)
INSERT INTO product_dimensions (product_id, dimension_type_id, min_value, max_value, increment, is_required) VALUES
(1, 1, 12.00, 72.00, 0.125, TRUE), -- Width
(1, 2, 12.00, 84.00, 0.125, TRUE), -- Height
(2, 1, 12.00, 72.00, 0.125, TRUE), -- Width
(2, 2, 12.00, 84.00, 0.125, TRUE), -- Height
(3, 1, 12.00, 60.00, 0.125, TRUE), -- Width
(3, 2, 12.00, 72.00, 0.125, TRUE); -- Height

-- Price Matrix (sample entries)
INSERT INTO price_matrix (product_id, width, height, price) VALUES
(1, 24.00, 36.00, 79.98),
(1, 24.00, 48.00, 89.98),
(1, 36.00, 48.00, 99.98),
(1, 36.00, 60.00, 109.98),
(1, 48.00, 60.00, 119.98),
(1, 48.00, 72.00, 129.98),
(2, 24.00, 36.00, 139.98),
(2, 36.00, 48.00, 159.98),
(2, 48.00, 60.00, 179.98);

-- Users (sample entries)
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_admin) VALUES
('admin@smartblindshub.com', '$2a$10$VB7AdWX.0up8e3vqXu4HF.JjfxMOHOXBqVfwklGQvExGg7BoWrJVW', 'Admin', 'User', '(425) 222-1088', TRUE),
('customer@example.com', '$2a$10$bXJ9Qd4RvwVkqqvUxVo5p.uJb4c0AjB1Hg4M3V5F8k5u6fKdPz2o2', 'John', 'Doe', '(555) 123-4567', FALSE),
('janedoe@example.com', '$2a$10$bXJ9Qd4RvwVkqqvUxVo5p.uJb4c0AjB1Hg4M3V5F8k5u6fKdPz2o2', 'Jane', 'Doe', '(555) 987-6543', FALSE);

-- Addresses (sample entries)
INSERT INTO addresses (user_id, address_type, is_default, first_name, last_name, address_line1, city, state, postal_code, country, phone) VALUES
(2, 'shipping', TRUE, 'John', 'Doe', '123 Main St', 'Seattle', 'WA', '98101', 'United States', '(555) 123-4567'),
(2, 'billing', TRUE, 'John', 'Doe', '123 Main St', 'Seattle', 'WA', '98101', 'United States', '(555) 123-4567'),
(3, 'shipping', TRUE, 'Jane', 'Doe', '456 Oak Ave', 'Portland', 'OR', '97204', 'United States', '(555) 987-6543');

-- Order Status
INSERT INTO order_status (name, description) VALUES
('Pending', 'Order received, awaiting processing'),
('Processing', 'Order is being prepared'),
('Shipped', 'Order has been shipped'),
('Delivered', 'Order has been delivered'),
('Cancelled', 'Order has been cancelled');

-- Reviews (sample entries)
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
(1, 2, 5, 'Excellent Quality!', 'I installed these blinds in my bathroom and they look amazing. The quality is excellent for the price.', TRUE),
(1, 3, 4, 'Good Value', 'These blinds look just like real wood but cost much less. Very happy with my purchase.', TRUE),
(2, 2, 5, 'Perfect for my kitchen', 'The wider slats are exactly what I wanted for my kitchen windows. Very easy to install and operate.', TRUE);

-- Shipping Zones (sample entries)
INSERT INTO shipping_zones (name, country, region) VALUES
('West Coast US', 'United States', 'CA,OR,WA'),
('East Coast US', 'United States', 'NY,NJ,CT,MA,RI,NH,ME,VT'),
('Midwest US', 'United States', 'IL,IN,IA,KS,MI,MN,MO,NE,ND,OH,SD,WI');

-- Shipping Rates (sample entries)
INSERT INTO shipping_rates (zone_id, method_id, min_order_value, max_order_value, price) VALUES
(1, 1, 0.00, 100.00, 9.99),
(1, 1, 100.00, NULL, 0.00), -- Free shipping for orders over $100
(1, 2, 0.00, NULL, 15.99),
(1, 3, 0.00, NULL, 29.99),
(2, 1, 0.00, 150.00, 14.99),
(2, 1, 150.00, NULL, 0.00); -- Free shipping for orders over $150

-- Coupons (sample entries)
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit) VALUES
('WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, 50.00, 100.00, '2025-01-01', '2025-12-31', 1),
('SUMMER25', 'Summer sale discount', 'percentage', 25.00, 100.00, 200.00, '2025-06-01', '2025-08-31', NULL),
('FREESHIP', 'Free shipping on all orders', 'fixed_amount', 0.00, 0.00, NULL, '2025-01-01', '2025-12-31', NULL);

-- Apply coupon to categories (sample entries)
INSERT INTO coupon_categories (coupon_id, category_id) VALUES
(2, 1), -- Apply SUMMER25 to Faux Wood Blinds
(2, 2); -- Apply SUMMER25 to Wood Blinds

----------------------------------------------------------
-- CREATE INDEXES FOR PERFORMANCE
----------------------------------------------------------
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX idx_product_materials_product_id ON product_materials(product_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_product_features_product_id ON product_features(product_id);
CREATE INDEX idx_product_dimensions_product_id ON product_dimensions(product_id);
CREATE INDEX idx_price_matrix_product_id ON price_matrix(product_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_listing_active ON users(is_listing_active);
CREATE INDEX idx_vendor_info_user_id ON vendor_info(user_id);
CREATE INDEX idx_vendor_info_approval_status ON vendor_info(approval_status);
CREATE INDEX idx_vendor_info_is_active ON vendor_info(is_active);
CREATE INDEX idx_vendor_info_is_verified ON vendor_info(is_verified);
CREATE INDEX idx_vendor_info_is_listing_active ON vendor_info(is_listing_active);

-- Shipping related indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipping_events_shipment_id ON shipping_events(shipment_id);
CREATE INDEX idx_shipping_notes_shipment_id ON shipping_notes(shipment_id);
CREATE INDEX idx_shipping_notes_order_id ON shipping_notes(order_id);

-- Notification system indexes
CREATE INDEX idx_notifications_type_id ON notifications(notification_type_id);
CREATE INDEX idx_notification_recipients_notification_id ON notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_user_id ON notification_recipients(user_id);
CREATE INDEX idx_notification_recipients_is_read ON notification_recipients(is_read);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_customer_questions_user_id ON customer_questions(user_id);
CREATE INDEX idx_customer_questions_product_id ON customer_questions(product_id);
CREATE INDEX idx_customer_questions_status ON customer_questions(status);
CREATE INDEX idx_question_replies_question_id ON question_replies(question_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
CREATE INDEX idx_system_announcements_is_active ON system_announcements(is_active);

----------------------------------------------------------
-- CREATE VIEWS
----------------------------------------------------------
-- View for product details with related information
CREATE VIEW product_details_view AS
SELECT
    p.product_id,
    p.name,
    p.slug,
    p.short_description,
    p.full_description,
    p.base_price,
    p.rating,
    p.review_count,
    c.name AS category_name,
    c.slug AS category_slug,
    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = TRUE LIMIT 1) AS primary_image
FROM
    products p
JOIN
    categories c ON p.category_id = c.category_id
WHERE
    p.is_active = TRUE;

-- View for active orders with status
CREATE VIEW active_orders_view AS
SELECT
    o.order_id,
    o.order_number,
    o.created_at,
    o.total_amount,
    s.name AS status,
    u.email AS user_email,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name
FROM
    orders o
JOIN
    order_status s ON o.status_id = s.status_id
JOIN
    users u ON o.user_id = u.user_id
WHERE
    s.name NOT IN ('Delivered', 'Cancelled');

-- View for product inventory and pricing summary
CREATE VIEW product_pricing_summary AS
SELECT
    p.product_id,
    p.name,
    p.base_price,
    COUNT(DISTINCT pm.material_id) AS material_options_count,
    COUNT(DISTINCT pc.color_id) AS color_options_count,
    MIN(pmx.price) AS min_price,
    MAX(pmx.price) AS max_price
FROM
    products p
LEFT JOIN
    product_materials pm ON p.product_id = pm.product_id
LEFT JOIN
    product_colors pc ON p.product_id = pc.product_id
LEFT JOIN
    price_matrix pmx ON p.product_id = pmx.product_id
GROUP BY
    p.product_id, p.name, p.base_price;

-- View for shipping information
CREATE OR REPLACE VIEW order_shipping_view AS
SELECT
  o.order_id,
  o.order_number,
  s.id AS shipment_id,
  s.tracking_number,
  s.carrier,
  s.service_level,
  s.shipping_date,
  s.estimated_delivery_date,
  s.actual_delivery_date,
  s.shipping_status,
  o.carrier_service,
  o.handling_time_days,
  o.is_return,
  o.return_reason
FROM
  orders o
LEFT JOIN
  shipments s ON o.order_id = s.order_id;

-- View for active verified vendors
CREATE OR REPLACE VIEW active_verified_vendors AS
SELECT
    vi.vendor_info_id,
    vi.user_id,
    vi.business_name,
    vi.business_description,
    vi.logo_url,
    vi.website_url,
    vi.is_verified,
    vi.rating,
    vi.total_sales,
    vi.total_ratings,
    u.email AS user_email,
    u.first_name,
    u.last_name
FROM
    vendor_info vi
JOIN
    users u ON vi.user_id = u.user_id
WHERE
    vi.is_active = TRUE
    AND vi.is_verified = TRUE
    AND vi.approval_status = 'approved'
    AND vi.is_listing_active = TRUE;

----------------------------------------------------------
-- VENDOR PRODUCTS (CUSTOM WINDOW COVERINGS)
----------------------------------------------------------
CREATE TABLE product_types (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard product types
INSERT INTO product_types (name, slug, description) VALUES
('Blinds', 'blinds', 'Window blinds with adjustable slats for light control'),
('Shades', 'shades', 'Window coverings that roll or fold up for light control'),
('Drapes', 'drapes', 'Hanging fabric panels for windows'),
('Shutters', 'shutters', 'Hinged window coverings with adjustable louvers');

CREATE TABLE vendor_products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type_id INTEGER REFERENCES product_types(type_id) ON DELETE SET NULL,
    series_name VARCHAR(100),
    material_type VARCHAR(100),
    short_description TEXT,
    full_description TEXT,
    features TEXT[],
    benefits TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    is_listing_enabled BOOLEAN DEFAULT TRUE,
    base_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(100),
    image_type VARCHAR(50), -- 'product', 'room_visualization', 'swatch'
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_dimensions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    min_width DECIMAL(10, 2) NOT NULL,
    max_width DECIMAL(10, 2) NOT NULL,
    min_height DECIMAL(10, 2) NOT NULL,
    max_height DECIMAL(10, 2) NOT NULL,
    width_increment DECIMAL(10, 2) DEFAULT 0.125,
    height_increment DECIMAL(10, 2) DEFAULT 0.125,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_price_grid (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    width DECIMAL(10, 2) NOT NULL,
    height DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_options (
    option_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    option_name VARCHAR(100) NOT NULL,
    option_type VARCHAR(50) NOT NULL, -- 'color', 'material', 'feature', etc.
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_option_values (
    value_id SERIAL PRIMARY KEY,
    option_id INTEGER REFERENCES vendor_product_options(option_id) ON DELETE CASCADE,
    value_name VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Window Treatment Specialized Options
----------------------------------------------------------

-- Mount Types
CREATE TABLE mount_types (
    mount_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default mount types
INSERT INTO mount_types (name, description, is_active) VALUES
('Inside Mount', 'Fits inside the window frame for a clean, built-in look', TRUE),
('Outside Mount', 'Mounts outside the window frame, covers the entire window', TRUE),
('Ceiling Mount', 'Attaches to the ceiling, ideal for large windows or doors', TRUE);

-- Control Types
CREATE TABLE control_types (
    control_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default control types
INSERT INTO control_types (name, description, price_adjustment, is_active) VALUES
('Cordless', 'Safe for children and pets, push or pull to operate', 15.00, TRUE),
('Standard Cord', 'Traditional cord operation', 0.00, TRUE),
('Continuous Cord Loop', 'Single cord for easy operation of larger blinds', 10.00, TRUE),
('Motorized', 'Battery-powered or hardwired motorized operation', 75.00, TRUE),
('Smart Home', 'Compatible with smart home systems like Alexa and Google Home', 125.00, TRUE),
('Wand', 'Rod-type control for opening and closing louvers', 5.00, TRUE);

-- Fabric Types
CREATE TABLE fabric_types (
    fabric_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    opacity_range VARCHAR(50), -- 'Sheer', 'Light Filtering', 'Room Darkening', 'Blackout'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default fabric types
INSERT INTO fabric_types (name, description, opacity_range, is_active) VALUES
('Sheer', 'Lightweight fabric that allows most light through while providing minimal privacy', 'Sheer', TRUE),
('Light Filtering', 'Balances light with privacy, allows soft light to enter', 'Light Filtering', TRUE),
('Room Darkening', 'Blocks most light, providing good privacy and light control', 'Room Darkening', TRUE),
('Blackout', 'Completely blocks light from entering the room', 'Blackout', TRUE);

-- Headrail/Cassette Options
CREATE TABLE headrail_options (
    headrail_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default headrail options
INSERT INTO headrail_options (name, description, price_adjustment, is_active) VALUES
('Standard', 'Basic headrail with exposed hardware', 0.00, TRUE),
('Fabric-Wrapped', 'Headrail wrapped in coordinating fabric for a cohesive look', 25.00, TRUE),
('Decorative Cassette', 'Attractive cassette that conceals the hardware completely', 35.00, TRUE),
('Low Profile', 'Minimalist design with smaller hardware footprint', 15.00, TRUE);

-- Bottom Rail Options
CREATE TABLE bottom_rail_options (
    rail_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    compatible_product_types VARCHAR(255), -- 'blinds,shades,drapes'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default bottom rail options
INSERT INTO bottom_rail_options (name, description, price_adjustment, compatible_product_types, is_active) VALUES
('Standard', 'Default bottom rail design', 0.00, 'blinds,shades,drapes', TRUE),
('Decorative', 'Enhanced design with additional visual elements', 15.00, 'blinds,shades,drapes', TRUE),
('Weighted', 'Heavier bottom rail for better hanging and operation', 10.00, 'shades,drapes', TRUE),
('Fabric-Wrapped', 'Bottom rail wrapped in coordinating fabric', 20.00, 'blinds,shades', TRUE);

-- Room Types for Recommendations
CREATE TABLE room_types (
    room_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default room types
INSERT INTO room_types (name, description, is_active) VALUES
('Living Room', 'Primary living space for gathering and entertainment', TRUE),
('Bedroom', 'Sleeping areas that often require increased privacy and light control', TRUE),
('Kitchen', 'Food preparation areas that often have humidity and temperature considerations', TRUE),
('Bathroom', 'High-humidity environments that require moisture-resistant options', TRUE),
('Home Office', 'Work spaces that need glare control and moderate privacy', TRUE),
('Dining Room', 'Eating areas where ambiance and style are important', TRUE),
('Sunroom', 'Rooms with extensive windows and high sunlight exposure', TRUE),
('Nursery', 'Children''s rooms that need safety features and light control', TRUE);

-- Specialty Options
CREATE TABLE specialty_options (
    specialty_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    compatible_product_types VARCHAR(255), -- 'blinds,shades,drapes'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default specialty options
INSERT INTO specialty_options (name, description, price_adjustment, compatible_product_types, is_active) VALUES
('Cut-outs', 'Custom notches or cutouts to accommodate handles, knobs or other obstacles', 30.00, 'blinds,shades', TRUE),
('Top-Down/Bottom-Up', 'Ability to lower from the top and raise from the bottom', 40.00, 'shades', TRUE),
('Continuous Cord Loop', 'Single cord system for easier operation', 25.00, 'blinds,shades,drapes', TRUE),
('Motorization', 'Battery-powered motor for remote operation', 100.00, 'blinds,shades,drapes', TRUE),
('Smart Home Integration', 'Compatible with smart home systems', 150.00, 'blinds,shades,drapes', TRUE),
('Solar Sensors', 'Automatically adjust blinds based on sunlight', 75.00, 'blinds,shades', TRUE),
('Thermal Insulation', 'Enhanced energy-efficiency features', 45.00, 'shades,drapes', TRUE),
('UV Protection', 'Additional UV blocking technology', 35.00, 'blinds,shades', TRUE);

-- Linking tables for vendor products and specific options
CREATE TABLE vendor_product_mount_types (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    mount_id INTEGER REFERENCES mount_types(mount_id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_control_types (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    control_id INTEGER REFERENCES control_types(control_id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    additional_price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_fabrics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    fabric_id INTEGER REFERENCES fabric_types(fabric_id) ON DELETE CASCADE,
    color_name VARCHAR(100),
    color_code VARCHAR(50),
    color_image_url VARCHAR(255),
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_headrails (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    headrail_id INTEGER REFERENCES headrail_options(headrail_id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    additional_price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_bottom_rails (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    rail_id INTEGER REFERENCES bottom_rail_options(rail_id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    additional_price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_room_recommendations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES room_types(room_id) ON DELETE CASCADE,
    recommendation_level INTEGER CHECK (recommendation_level BETWEEN 1 AND 5), -- 1 = poor, 5 = excellent
    recommendation_note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_product_specialty_options (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    specialty_id INTEGER REFERENCES specialty_options(specialty_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    additional_price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for the new linking tables
CREATE INDEX idx_vendor_product_mount_types_product_id ON vendor_product_mount_types(product_id);
CREATE INDEX idx_vendor_product_control_types_product_id ON vendor_product_control_types(product_id);
CREATE INDEX idx_vendor_product_fabrics_product_id ON vendor_product_fabrics(product_id);
CREATE INDEX idx_vendor_product_headrails_product_id ON vendor_product_headrails(product_id);
CREATE INDEX idx_vendor_product_bottom_rails_product_id ON vendor_product_bottom_rails(product_id);
CREATE INDEX idx_vendor_product_room_recs_product_id ON vendor_product_room_recommendations(product_id);
CREATE INDEX idx_vendor_product_specialty_product_id ON vendor_product_specialty_options(product_id);

-- Create indexes for better performance
CREATE INDEX idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_type_id ON vendor_products(type_id);
CREATE INDEX idx_vendor_product_images_product_id ON vendor_product_images(product_id);
CREATE INDEX idx_vendor_product_dimensions_product_id ON vendor_product_dimensions(product_id);
CREATE INDEX idx_vendor_product_price_grid_product_id ON vendor_product_price_grid(product_id);
CREATE INDEX idx_vendor_product_options_product_id ON vendor_product_options(product_id);
CREATE INDEX idx_vendor_product_option_values_option_id ON vendor_product_option_values(option_id);

-- Add index for is_listing_enabled
CREATE INDEX idx_vendor_products_is_listing_enabled ON vendor_products(is_listing_enabled);

----------------------------------------------------------
-- NOTIFICATION SYSTEM
----------------------------------------------------------
CREATE TABLE notification_types (
    notification_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template TEXT NOT NULL, -- Template for notification content with placeholders
    email_template TEXT, -- Template for email content (null if no email)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    notification_type_id INTEGER REFERENCES notification_types(notification_type_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'order', 'inventory', 'question', 'system', etc.
    source_id VARCHAR(100), -- ID of the source object (e.g., order_id)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_recipients (
    recipient_id SERIAL PRIMARY KEY,
    notification_id INTEGER REFERENCES notifications(notification_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_emailed BOOLEAN DEFAULT FALSE,
    emailed_at TIMESTAMP,
    email_status VARCHAR(50), -- 'sent', 'delivered', 'opened', 'clicked', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_notification_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type_id INTEGER REFERENCES notification_types(notification_type_id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, notification_type_id)
);

CREATE TABLE customer_questions (
    question_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'pending', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_replies (
    reply_id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES customer_questions(question_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    is_vendor BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_alerts (
    alert_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(material_id) ON DELETE SET NULL,
    color_id INTEGER REFERENCES colors(color_id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'restock'
    threshold INTEGER,
    current_level INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    importance VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    target_roles TEXT[], -- Array of roles that should see this announcement
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
