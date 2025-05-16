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