SET GLOBAL log_bin_trust_function_creators = 1;

DELIMITER $$

DROP FUNCTION IF EXISTS uuid_generate_v4$$

CREATE FUNCTION uuid_generate_v4()
RETURNS CHAR(36)
BEGIN
    RETURN LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)),
        '-',
        HEX(RANDOM_BYTES(2)),
        '-4',
        SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3),
        '-',
        HEX(CONV(FLOOR(1+RAND()*2), 10, 16)) || SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3),
        '-',
        HEX(RANDOM_BYTES(6))
    ));
END$$

DELIMITER ;

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    meta_title VARCHAR(100),
    meta_description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    full_description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2),
    review_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10, 2),
    sku VARCHAR(50) UNIQUE,
    stock_status VARCHAR(20) DEFAULT 'in_stock',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'vendor', 'sales', 'installer', 'customer') DEFAULT 'customer',
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    auth_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    verification_token VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @s = (SELECT IF(
    EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'users'
        AND COLUMN_NAME = 'is_listing_active'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN is_listing_active BOOLEAN DEFAULT TRUE'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS vendor_info (
    vendor_info_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50),
    business_description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    year_established INT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
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
    avg_processing_time INT,
    avg_shipping_time INT,
    rating DECIMAL(3,2),
    total_sales INT DEFAULT 0,
    total_ratings INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

SET @s = (SELECT IF(
    EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'vendor_info'
        AND COLUMN_NAME = 'is_listing_active'
    ),
    'SELECT 1',
    'ALTER TABLE vendor_info ADD COLUMN is_listing_active BOOLEAN DEFAULT TRUE'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS sales_staff (
    sales_staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    hire_date DATE NOT NULL,
    territory VARCHAR(100),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installers (
    installer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    certification_number VARCHAR(50),
    certification_expiry DATE,
    service_area VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status_id INT,
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id INT,
    billing_address_id INT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES order_status(status_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_name VARCHAR(100),
    material_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS installation_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    installer_id INT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (installer_id) REFERENCES installers(installer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installation_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT,
    user_id INT,
    order_id INT,
    installer_id INT,
    status VARCHAR(50) DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES installation_slots(slot_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (installer_id) REFERENCES installers(installer_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS experts (
    expert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    specialization VARCHAR(100),
    years_experience INT,
    certification VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultation_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultation_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT,
    user_id INT,
    expert_id INT,
    status VARCHAR(50) DEFAULT 'pending',
    consultation_type VARCHAR(50),
    topic VARCHAR(255),
    notes TEXT,
    meeting_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES consultation_slots(slot_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_queue (
    email_id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSON,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP NULL,
    next_retry_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(template_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    agent_id INT,
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    rating INT,
    feedback TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    user_id INT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_materials (
    product_material_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    material_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_features (
    product_feature_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    feature_id INT,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(feature_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS colors (
    color_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_colors (
    product_color_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    color_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(color_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dimension_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_dimensions (
    dimension_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    type_id INT,
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    increment DECIMAL(10, 2),
    unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES dimension_types(type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_matrix (
    matrix_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    min_width DECIMAL(10, 2),
    max_width DECIMAL(10, 2),
    min_height DECIMAL(10, 2),
    max_height DECIMAL(10, 2),
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    address_type VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    product_id INT,
    quantity INT NOT NULL,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    color_id INT,
    material_id INT,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors(color_id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_item_id INT AUTO_INCREMENT PRIMARY KEY,
    wishlist_id INT,
    product_id INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wishlist_id) REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    type_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_listing_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES product_types(type_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    type_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES notification_types(type_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    recipient_id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT,
    user_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type_id INT,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES notification_types(type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mount_types (
    mount_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    installation_notes TEXT,
    measurement_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS control_types (
    control_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_motorized BOOLEAN DEFAULT FALSE,
    is_cordless BOOLEAN DEFAULT FALSE,
    safety_features TEXT,
    compatibility_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fabric_types (
    fabric_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    light_filtering_level VARCHAR(50),
    uv_protection_level VARCHAR(50),
    cleaning_instructions TEXT,
    durability_rating INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS headrail_options (
    headrail_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    material VARCHAR(100),
    color_options TEXT,
    compatibility_notes TEXT,
    installation_requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bottom_rail_options (
    bottom_rail_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    material VARCHAR(100),
    color_options TEXT,
    weight_options TEXT,
    compatibility_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    recommended_features TEXT,
    considerations TEXT,
    typical_window_types TEXT,
    lighting_characteristics TEXT,
    privacy_requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS specialty_options (
    specialty_id INT AUTO_INCREMENT PRIMARY KEY,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_product_mount_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    mount_type_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (mount_type_id) REFERENCES mount_types(mount_type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_control_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    control_type_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (control_type_id) REFERENCES control_types(control_type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_fabrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    fabric_type_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (fabric_type_id) REFERENCES fabric_types(fabric_type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_headrails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    headrail_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (headrail_id) REFERENCES headrail_options(headrail_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_bottom_rails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    bottom_rail_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (bottom_rail_id) REFERENCES bottom_rail_options(bottom_rail_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_room_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    room_type_id INT,
    recommendation_level INT,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_specialty_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    specialty_id INT,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    lead_time_days INT,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialty_options(specialty_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_dimensions (
    dimension_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    name VARCHAR(50) NOT NULL,
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    increment DECIMAL(10, 2),
    unit VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_price_grid (
    grid_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES vendor_products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_product_option_values (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    option_id INT,
    value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0.00,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (option_id) REFERENCES vendor_product_options(option_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    question TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    user_id INT,
    reply TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES customer_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    alert_type VARCHAR(50),
    threshold_value INT,
    current_value INT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW product_details_view AS
SELECT 
    p.*,
    c.name AS category_name,
    c.slug AS category_slug,
    pi.image_url AS primary_image,
    GROUP_CONCAT(DISTINCT f.name) AS features,
    GROUP_CONCAT(DISTINCT m.name) AS available_materials,
    GROUP_CONCAT(DISTINCT col.name) AS available_colors
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = TRUE
LEFT JOIN product_features pf ON p.product_id = pf.product_id
LEFT JOIN features f ON pf.feature_id = f.feature_id
LEFT JOIN product_materials pm ON p.product_id = pm.product_id
LEFT JOIN materials m ON pm.material_id = m.material_id
LEFT JOIN product_colors pc ON p.product_id = pc.product_id
LEFT JOIN colors col ON pc.color_id = col.color_id
WHERE p.is_active = TRUE
GROUP BY p.product_id, p.name, p.slug, p.short_description, p.full_description, 
         p.base_price, p.rating, p.review_count, p.is_featured, p.is_on_sale, 
         p.sale_price, p.sku, p.stock_status, p.is_active, p.created_at, 
         p.updated_at, c.name, c.slug, pi.image_url;

CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.*,
    u.email AS customer_email,
    u.first_name,
    u.last_name,
    os.name AS status_name,
    COUNT(oi.order_item_id) AS total_items
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_status os ON o.status_id = os.status_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.user_id, o.order_number, o.status_id, o.subtotal, 
         o.shipping_cost, o.tax_amount, o.total_amount, o.shipping_address_id, 
         o.billing_address_id, o.payment_method, o.payment_status, o.notes, 
         o.created_at, o.updated_at, u.email, u.first_name, u.last_name, 
         os.name;

CREATE OR REPLACE VIEW product_pricing_summary AS
SELECT 
    p.product_id,
    p.name,
    p.base_price,
    MIN(pm.price_modifier) AS min_material_price_mod,
    MAX(pm.price_modifier) AS max_material_price_mod,
    MIN(pc.price_modifier) AS min_color_price_mod,
    MAX(pc.price_modifier) AS max_color_price_mod,
    MIN(pmx.base_price) AS min_size_price,
    MAX(pmx.base_price) AS max_size_price
FROM products p
LEFT JOIN product_materials pm ON p.product_id = pm.product_id
LEFT JOIN product_colors pc ON p.product_id = pc.product_id
LEFT JOIN price_matrix pmx ON p.product_id = pmx.product_id
WHERE p.is_active = TRUE
GROUP BY p.product_id, p.name, p.base_price;

CREATE OR REPLACE VIEW active_verified_vendors AS
SELECT 
    v.*,
    u.email,
    u.first_name,
    u.last_name,
    u.phone AS personal_phone,
    COUNT(DISTINCT vp.product_id) AS total_products,
    AVG(vp.base_price) AS avg_product_price
FROM vendor_info v
JOIN users u ON v.user_id = u.user_id
LEFT JOIN vendor_products vp ON v.vendor_info_id = vp.vendor_id
WHERE v.is_active = TRUE 
    AND v.is_verified = TRUE 
    AND u.is_active = TRUE
GROUP BY v.vendor_info_id, v.user_id, v.business_name, v.business_email, 
         v.business_phone, v.business_description, v.logo_url, v.website_url, 
         v.year_established, v.is_verified, v.verification_date, v.approval_status, 
         v.tax_id, v.business_address_line1, v.business_address_line2, 
         v.business_city, v.business_state, v.business_postal_code, 
         v.business_country, v.return_policy, v.shipping_policy, 
         v.avg_processing_time, v.avg_shipping_time, v.rating, v.total_sales, 
         v.total_ratings, v.is_active, v.created_at, v.updated_at, 
         v.is_listing_active, u.email, u.first_name, u.last_name, u.phone;

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_listing_active ON users(is_listing_active);
CREATE INDEX idx_vendor_info_user_id ON vendor_info(user_id);
CREATE INDEX idx_vendor_info_approval_status ON vendor_info(approval_status);
CREATE INDEX idx_vendor_info_is_active ON vendor_info(is_active);
CREATE INDEX idx_vendor_info_is_verified ON vendor_info(is_verified);
CREATE INDEX idx_vendor_info_is_listing_active ON vendor_info(is_listing_active);
CREATE INDEX idx_installation_slots_installer_id ON installation_slots(installer_id);
CREATE INDEX idx_installation_slots_date ON installation_slots(date);
CREATE INDEX idx_installation_bookings_slot_id ON installation_bookings(slot_id);
CREATE INDEX idx_installation_bookings_user_id ON installation_bookings(user_id);
CREATE INDEX idx_installation_bookings_installer_id ON installation_bookings(installer_id);
CREATE INDEX idx_consultation_slots_expert_id ON consultation_slots(expert_id);
CREATE INDEX idx_consultation_slots_date ON consultation_slots(date);
CREATE INDEX idx_consultation_bookings_slot_id ON consultation_bookings(slot_id);
CREATE INDEX idx_consultation_bookings_user_id ON consultation_bookings(user_id);
CREATE INDEX idx_consultation_bookings_expert_id ON consultation_bookings(expert_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_next_retry_at ON email_queue(next_retry_at);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX idx_product_materials_product_id ON product_materials(product_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_product_features_product_id ON product_features(product_id);
CREATE INDEX idx_product_dimensions_product_id ON product_dimensions(product_id);
CREATE INDEX idx_price_matrix_product_id ON price_matrix(product_id);
CREATE INDEX idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_type_id ON vendor_products(type_id);
CREATE INDEX idx_vendor_products_is_listing_enabled ON vendor_products(is_listing_enabled);
CREATE INDEX idx_notifications_type_id ON notifications(type_id);
CREATE INDEX idx_notification_recipients_notification_id ON notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_user_id ON notification_recipients(user_id);
CREATE INDEX idx_notification_recipients_is_read ON notification_recipients(is_read);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_vendor_product_images_product_id ON vendor_product_images(product_id);
CREATE INDEX idx_vendor_product_dimensions_product_id ON vendor_product_dimensions(product_id);
CREATE INDEX idx_vendor_product_price_grid_product_id ON vendor_product_price_grid(product_id);
CREATE INDEX idx_vendor_product_options_product_id ON vendor_product_options(product_id);
CREATE INDEX idx_vendor_product_option_values_option_id ON vendor_product_option_values(option_id);
CREATE INDEX idx_vendor_product_mount_types_product_id ON vendor_product_mount_types(product_id);
CREATE INDEX idx_vendor_product_control_types_product_id ON vendor_product_control_types(product_id);
CREATE INDEX idx_vendor_product_fabrics_product_id ON vendor_product_fabrics(product_id);
CREATE INDEX idx_vendor_product_headrails_product_id ON vendor_product_headrails(product_id);
CREATE INDEX idx_vendor_product_bottom_rails_product_id ON vendor_product_bottom_rails(product_id);
CREATE INDEX idx_vendor_product_room_recs_product_id ON vendor_product_room_recommendations(product_id);
CREATE INDEX idx_vendor_product_specialty_product_id ON vendor_product_specialty_options(product_id);
CREATE INDEX idx_customer_questions_user_id ON customer_questions(user_id);
CREATE INDEX idx_customer_questions_product_id ON customer_questions(product_id);
CREATE INDEX idx_customer_questions_status ON customer_questions(status);
CREATE INDEX idx_question_replies_question_id ON question_replies(question_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
CREATE INDEX idx_system_announcements_is_active ON system_announcements(is_active); 