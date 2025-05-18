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

----------------------------------------------------------
-- INSTALLATION SCHEDULING
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS installation_slots (
    slot_id SERIAL PRIMARY KEY,
    installer_id INTEGER REFERENCES installers(installer_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- 'morning', 'afternoon', 'evening'
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS installation_bookings (
    booking_id SERIAL PRIMARY KEY,
    slot_id INTEGER REFERENCES installation_slots(slot_id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
    installer_id INTEGER REFERENCES installers(installer_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    completion_notes TEXT,
    completion_photos JSON,
    customer_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- EXPERT CONSULTATIONS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS experts (
    expert_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    years_experience INTEGER,
    bio TEXT,
    profile_image VARCHAR(255),
    hourly_rate DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_slots (
    slot_id SERIAL PRIMARY KEY,
    expert_id INTEGER REFERENCES experts(expert_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_bookings (
    booking_id SERIAL PRIMARY KEY,
    slot_id INTEGER REFERENCES consultation_slots(slot_id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    expert_id INTEGER REFERENCES experts(expert_id) ON DELETE SET NULL,
    consultation_type VARCHAR(50) NOT NULL, -- 'design', 'measurement', 'installation', 'automation'
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    meeting_link VARCHAR(255), -- For virtual consultations
    notes TEXT,
    summary TEXT, -- Post-consultation summary
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- EMAIL NOTIFICATIONS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
    template_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSON, -- List of available variables for the template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_queue (
    email_id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES email_templates(template_id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSON, -- Actual variables used in the email
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installation_slots_installer_id ON installation_slots(installer_id);
CREATE INDEX IF NOT EXISTS idx_installation_slots_date ON installation_slots(date);
CREATE INDEX IF NOT EXISTS idx_installation_bookings_slot_id ON installation_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_installation_bookings_user_id ON installation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_installation_bookings_installer_id ON installation_bookings(installer_id);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_expert_id ON consultation_slots(expert_id);
CREATE INDEX IF NOT EXISTS idx_consultation_slots_date ON consultation_slots(date);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_slot_id ON consultation_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON consultation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_expert_id ON consultation_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry_at ON email_queue(next_retry_at);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, variables) VALUES
('installation_confirmation', 
 'Your Installation Appointment Confirmation', 
 'Dear {customer_name},\n\nYour installation appointment has been scheduled for {installation_date} at {installation_time}.\n\nInstaller: {installer_name}\nAddress: {installation_address}\n\nSpecial Instructions: {special_instructions}\n\nIf you need to reschedule, please contact us at least 24 hours in advance.\n\nBest regards,\nSmart Blinds Hub Team',
 '{"customer_name": "string", "installation_date": "date", "installation_time": "string", "installer_name": "string", "installation_address": "string", "special_instructions": "string"}'
),
('consultation_confirmation',
 'Your Expert Consultation Appointment Confirmation',
 'Dear {customer_name},\n\nYour consultation with {expert_name} has been scheduled for {consultation_date} at {consultation_time}.\n\nConsultation Type: {consultation_type}\nMeeting Link: {meeting_link}\n\nPlease prepare any questions or materials you''d like to discuss during the consultation.\n\nBest regards,\nSmart Blinds Hub Team',
 '{"customer_name": "string", "expert_name": "string", "consultation_date": "date", "consultation_time": "string", "consultation_type": "string", "meeting_link": "string"}'
),
('installation_reminder',
 'Reminder: Your Installation Appointment Tomorrow',
 'Dear {customer_name},\n\nThis is a reminder that your installation appointment is scheduled for tomorrow, {installation_date} at {installation_time}.\n\nInstaller: {installer_name}\nAddress: {installation_address}\n\nPlease ensure the installation area is clear and accessible.\n\nBest regards,\nSmart Blinds Hub Team',
 '{"customer_name": "string", "installation_date": "date", "installation_time": "string", "installer_name": "string", "installation_address": "string"}'
),
('consultation_reminder',
 'Reminder: Your Expert Consultation Tomorrow',
 'Dear {customer_name},\n\nThis is a reminder that your consultation with {expert_name} is scheduled for tomorrow, {consultation_date} at {consultation_time}.\n\nConsultation Type: {consultation_type}\nMeeting Link: {meeting_link}\n\nBest regards,\nSmart Blinds Hub Team',
 '{"customer_name": "string", "expert_name": "string", "consultation_date": "date", "consultation_time": "string", "consultation_type": "string", "meeting_link": "string"}'
)
ON CONFLICT (name) DO NOTHING;

----------------------------------------------------------
-- MOBILE MEASUREMENTS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS window_measurements (
    measurement_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    label VARCHAR(255),
    width DECIMAL(10, 2), -- in inches
    height DECIMAL(10, 2), -- in inches
    points JSON, -- Store measurement points for visualization
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_window_measurements_user_id ON window_measurements(user_id);

----------------------------------------------------------
-- CHAT SYSTEM
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    socket_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'ended'
    agent_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sender VARCHAR(50) NOT NULL, -- 'user', 'agent'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

----------------------------------------------------------
-- PRODUCT IMAGES
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
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
CREATE TABLE IF NOT EXISTS materials (
    material_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_materials (
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
CREATE TABLE IF NOT EXISTS features (
    feature_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_features (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES features(feature_id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- COLORS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS colors (
    color_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7),
    color_group VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_colors (
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
CREATE TABLE IF NOT EXISTS dimension_types (
    dimension_type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_dimensions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    dimension_type_id INTEGER REFERENCES dimension_types(dimension_type_id) ON DELETE CASCADE,
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    increment DECIMAL(10, 2),
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_matrix (
    price_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ADDRESSES
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    address_type VARCHAR(20), -- 'billing', 'shipping'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- SHOPPING CART
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_id INTEGER REFERENCES colors(color_id),
    material_id INTEGER REFERENCES materials(material_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- WISHLIST
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_item_id SERIAL PRIMARY KEY,
    wishlist_id INTEGER REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- VIEWS
----------------------------------------------------------
CREATE OR REPLACE VIEW product_details_view AS
SELECT 
    p.product_id,
    p.name,
    p.slug,
    p.short_description,
    p.base_price,
    p.rating,
    p.review_count,
    c.name AS category_name,
    c.slug AS category_slug,
    pi.image_url AS primary_image,
    COUNT(DISTINCT pc.color_id) AS color_options,
    COUNT(DISTINCT pm.material_id) AS material_options
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
LEFT JOIN product_colors pc ON p.product_id = pc.product_id
LEFT JOIN product_materials pm ON p.product_id = pm.product_id
WHERE p.is_active = true
GROUP BY p.product_id, c.category_id, pi.image_url;

CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.order_id,
    o.order_number,
    u.email,
    u.first_name,
    u.last_name,
    o.total_amount,
    o.status_id,
    os.name AS status_name,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_status os ON o.status_id = os.status_id
WHERE o.status_id NOT IN (SELECT status_id FROM order_status WHERE name IN ('Delivered', 'Cancelled', 'Refunded'));

CREATE OR REPLACE VIEW product_pricing_summary AS
SELECT 
    p.product_id,
    p.name,
    p.base_price,
    MIN(pm.price) AS min_price,
    MAX(pm.price) AS max_price,
    COUNT(DISTINCT pc.color_id) AS color_count,
    COUNT(DISTINCT pmat.material_id) AS material_count,
    ARRAY_AGG(DISTINCT c.name) AS available_colors,
    ARRAY_AGG(DISTINCT m.name) AS available_materials
FROM products p
LEFT JOIN price_matrix pm ON p.product_id = pm.product_id
LEFT JOIN product_colors pc ON p.product_id = pc.product_id
LEFT JOIN colors c ON pc.color_id = c.color_id
LEFT JOIN product_materials pmat ON p.product_id = pmat.product_id
LEFT JOIN materials m ON pmat.material_id = m.material_id
WHERE p.is_active = true
GROUP BY p.product_id, p.name, p.base_price;

CREATE OR REPLACE VIEW active_verified_vendors AS
SELECT 
    v.vendor_info_id,
    v.business_name,
    v.business_email,
    v.rating,
    v.total_sales,
    v.total_ratings,
    COUNT(p.product_id) AS active_products,
    AVG(p.rating) AS avg_product_rating
FROM vendor_info v
LEFT JOIN products p ON v.vendor_info_id = p.product_id AND p.is_active = true
WHERE v.is_verified = true 
    AND v.is_active = true 
    AND v.is_listing_active = true
GROUP BY v.vendor_info_id;

----------------------------------------------------------
-- ADDITIONAL INDEXES
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_materials_product_id ON product_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_dimensions_product_id ON product_dimensions(product_id);
CREATE INDEX IF NOT EXISTS idx_price_matrix_product_id ON price_matrix(product_id);

----------------------------------------------------------
-- VENDOR PRODUCT MANAGEMENT
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_types (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendor_info(vendor_info_id) ON DELETE CASCADE,
    type_id INTEGER REFERENCES product_types(type_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    min_width DECIMAL(10, 2),
    max_width DECIMAL(10, 2),
    min_height DECIMAL(10, 2),
    max_height DECIMAL(10, 2),
    is_listing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_dimensions (
    dimension_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    increment DECIMAL(10, 2),
    unit VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_price_grid (
    grid_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_options (
    option_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_option_values (
    value_id SERIAL PRIMARY KEY,
    option_id INTEGER REFERENCES vendor_product_options(option_id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- BLIND SPECIFIC FEATURES
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS mount_types (
    mount_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    installation_notes TEXT,
    measurement_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS control_types (
    control_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_motorized BOOLEAN DEFAULT FALSE,
    is_cordless BOOLEAN DEFAULT FALSE,
    safety_features TEXT,
    compatibility_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fabric_types (
    fabric_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    light_filtering_level VARCHAR(50),
    uv_protection_level VARCHAR(50),
    cleaning_instructions TEXT,
    durability_rating INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS headrail_options (
    headrail_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    material VARCHAR(100),
    color_options TEXT[],
    compatibility_notes TEXT,
    installation_requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bottom_rail_options (
    bottom_rail_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    material VARCHAR(100),
    color_options TEXT[],
    weight_options TEXT[],
    compatibility_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_types (
    room_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    recommended_features TEXT[],
    considerations TEXT,
    typical_window_types TEXT[],
    lighting_characteristics TEXT,
    privacy_requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS specialty_options (
    specialty_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    compatibility_notes TEXT,
    price_impact TEXT,
    lead_time_impact TEXT,
    installation_requirements TEXT,
    maintenance_notes TEXT,
    warranty_implications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- VENDOR PRODUCT RELATIONSHIPS
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_product_mount_types (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    mount_type_id INTEGER REFERENCES mount_types(mount_type_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS vendor_product_control_types (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    control_type_id INTEGER REFERENCES control_types(control_type_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS vendor_product_fabrics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    fabric_type_id INTEGER REFERENCES fabric_types(fabric_type_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    available_colors TEXT[],
    lead_time INTEGER
);

CREATE TABLE IF NOT EXISTS vendor_product_headrails (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    headrail_id INTEGER REFERENCES headrail_options(headrail_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS vendor_product_bottom_rails (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    bottom_rail_id INTEGER REFERENCES bottom_rail_options(bottom_rail_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS vendor_product_room_recommendations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    room_type_id INTEGER REFERENCES room_types(room_type_id) ON DELETE CASCADE,
    suitability_rating INTEGER CHECK (suitability_rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS vendor_product_specialty_options (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    specialty_id INTEGER REFERENCES specialty_options(specialty_id) ON DELETE CASCADE,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00
);

----------------------------------------------------------
-- NOTIFICATION SYSTEM
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_types (
    type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES notification_types(type_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    recipient_id SERIAL PRIMARY KEY,
    notification_id INTEGER REFERENCES notifications(notification_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type_id INTEGER REFERENCES notification_types(type_id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- CUSTOMER SUPPORT
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_questions (
    question_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_replies (
    reply_id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES customer_questions(question_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    reply TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- INVENTORY MANAGEMENT
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_alerts (
    alert_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    threshold INTEGER,
    current_level INTEGER,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

----------------------------------------------------------
-- ADDITIONAL INDEXES FOR NEW TABLES
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_type_id ON vendor_products(type_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_images_product_id ON vendor_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_dimensions_product_id ON vendor_product_dimensions(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_price_grid_product_id ON vendor_product_price_grid(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_options_product_id ON vendor_product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_option_values_option_id ON vendor_product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_is_listing_enabled ON vendor_products(is_listing_enabled);
CREATE INDEX IF NOT EXISTS idx_vendor_product_mount_types_product_id ON vendor_product_mount_types(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_control_types_product_id ON vendor_product_control_types(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_fabrics_product_id ON vendor_product_fabrics(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_headrails_product_id ON vendor_product_headrails(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_bottom_rails_product_id ON vendor_product_bottom_rails(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_room_recs_product_id ON vendor_product_room_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_specialty_product_id ON vendor_product_specialty_options(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_id ON notifications(type_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification_id ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_id ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_is_read ON notification_recipients(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_questions_user_id ON customer_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_questions_product_id ON customer_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_questions_status ON customer_questions(status);
CREATE INDEX IF NOT EXISTS idx_question_replies_question_id ON question_replies(question_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_announcements_is_active ON system_announcements(is_active); 