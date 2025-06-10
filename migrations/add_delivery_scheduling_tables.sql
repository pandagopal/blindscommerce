-- Add Delivery Date Scheduling System
-- This migration adds tables for managing delivery schedules and time slots

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Delivery time slots configuration
CREATE TABLE IF NOT EXISTS delivery_time_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL COMMENT 'Display name like "Morning (8AM-12PM)"',
    slot_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Internal code like "morning"',
    
    -- Time window
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability settings
    available_days JSON NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
    blackout_dates JSON NULL COMMENT 'Array of specific dates when slot is unavailable',
    
    -- Capacity management
    max_deliveries_per_day INT NOT NULL DEFAULT 10,
    max_deliveries_per_zone INT NULL COMMENT 'Zone-specific limits',
    
    -- Pricing
    additional_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Extra charge for this time slot',
    
    -- Lead time
    min_lead_days INT NOT NULL DEFAULT 2 COMMENT 'Minimum days in advance to book',
    max_advance_days INT NOT NULL DEFAULT 30 COMMENT 'Maximum days in advance to book',
    
    -- Settings
    requires_signature BOOLEAN DEFAULT FALSE,
    allows_specific_time_request BOOLEAN DEFAULT FALSE,
    priority_order INT NOT NULL DEFAULT 0 COMMENT 'Display order (lower = higher priority)',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slot_code (slot_code),
    INDEX idx_active_slots (is_active, priority_order),
    INDEX idx_time_window (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery schedules for orders
CREATE TABLE IF NOT EXISTS order_delivery_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    
    -- Scheduled delivery
    delivery_date DATE NOT NULL,
    time_slot_id INT NOT NULL,
    specific_time_requested TIME NULL COMMENT 'If customer requested specific time within slot',
    
    -- Customer preferences
    customer_notes TEXT NULL,
    alternative_recipient VARCHAR(255) NULL,
    alternative_phone VARCHAR(20) NULL,
    
    -- Delivery instructions
    delivery_location ENUM('front_door', 'back_door', 'garage', 'reception', 'mailroom', 'other') DEFAULT 'front_door',
    location_details TEXT NULL,
    access_instructions TEXT NULL COMMENT 'Gate codes, building access, etc.',
    
    -- Notifications
    notification_preferences JSON NULL COMMENT 'How to notify: SMS, email, phone call',
    notify_on_day_before BOOLEAN DEFAULT TRUE,
    notify_on_delivery_day BOOLEAN DEFAULT TRUE,
    notify_one_hour_before BOOLEAN DEFAULT TRUE,
    
    -- Status tracking
    status ENUM('scheduled', 'confirmed', 'in_transit', 'delivered', 'failed', 'rescheduled', 'cancelled') DEFAULT 'scheduled',
    confirmed_at TIMESTAMP NULL,
    
    -- Delivery completion
    delivered_at TIMESTAMP NULL,
    delivered_by VARCHAR(255) NULL COMMENT 'Driver/carrier name',
    delivery_photo_url VARCHAR(500) NULL,
    signature_url VARCHAR(500) NULL,
    recipient_name VARCHAR(255) NULL COMMENT 'Who actually received the delivery',
    
    -- Failed delivery handling
    failure_reason TEXT NULL,
    failure_count INT DEFAULT 0,
    
    -- Rescheduling
    original_delivery_date DATE NULL,
    rescheduled_from INT NULL COMMENT 'Previous schedule_id if rescheduled',
    reschedule_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_order_delivery (order_id),
    
    CONSTRAINT fk_delivery_schedule_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_delivery_schedule_slot 
        FOREIGN KEY (time_slot_id) REFERENCES delivery_time_slots(slot_id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_schedule_reschedule 
        FOREIGN KEY (rescheduled_from) REFERENCES order_delivery_schedules(schedule_id) 
        ON DELETE SET NULL,
    
    INDEX idx_delivery_date (delivery_date),
    INDEX idx_time_slot (time_slot_id, delivery_date),
    INDEX idx_status (status),
    INDEX idx_delivery_status_date (status, delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery capacity tracking
CREATE TABLE IF NOT EXISTS delivery_capacity (
    capacity_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_date DATE NOT NULL,
    time_slot_id INT NOT NULL,
    zone_id INT NULL COMMENT 'Reference to shipping zones if zone-specific',
    
    -- Capacity tracking
    total_capacity INT NOT NULL,
    booked_count INT NOT NULL DEFAULT 0,
    available_capacity INT GENERATED ALWAYS AS (total_capacity - booked_count) STORED,
    
    -- Override settings
    is_blocked BOOLEAN DEFAULT FALSE COMMENT 'Manually block this date/slot',
    block_reason TEXT NULL,
    capacity_override INT NULL COMMENT 'Override default capacity for this date',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_date_slot_zone (delivery_date, time_slot_id, zone_id),
    
    CONSTRAINT fk_capacity_slot 
        FOREIGN KEY (time_slot_id) REFERENCES delivery_time_slots(slot_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_capacity_zone 
        FOREIGN KEY (zone_id) REFERENCES shipping_zones(zone_id) 
        ON DELETE CASCADE,
    
    INDEX idx_date_availability (delivery_date, available_capacity),
    INDEX idx_slot_date (time_slot_id, delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery blackout dates (holidays, maintenance, etc.)
CREATE TABLE IF NOT EXISTS delivery_blackout_dates (
    blackout_id INT AUTO_INCREMENT PRIMARY KEY,
    blackout_date DATE NOT NULL,
    blackout_name VARCHAR(255) NOT NULL COMMENT 'Holiday name or reason',
    
    -- Scope
    applies_to_all_slots BOOLEAN DEFAULT TRUE,
    specific_slot_ids JSON NULL COMMENT 'Array of slot_ids if not all slots',
    applies_to_all_zones BOOLEAN DEFAULT TRUE,
    specific_zone_ids JSON NULL COMMENT 'Array of zone_ids if not all zones',
    
    -- Settings
    is_recurring_yearly BOOLEAN DEFAULT FALSE,
    notification_message TEXT NULL COMMENT 'Message to show customers',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    
    CONSTRAINT fk_blackout_creator 
        FOREIGN KEY (created_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    UNIQUE KEY unique_blackout_date_name (blackout_date, blackout_name),
    INDEX idx_blackout_date (blackout_date),
    INDEX idx_recurring (is_recurring_yearly)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery reschedule history
CREATE TABLE IF NOT EXISTS delivery_reschedule_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    schedule_id INT NOT NULL,
    
    -- Change details
    old_delivery_date DATE NOT NULL,
    old_time_slot_id INT NOT NULL,
    new_delivery_date DATE NOT NULL,
    new_time_slot_id INT NOT NULL,
    
    -- Reason and requester
    reschedule_reason TEXT NOT NULL,
    requested_by ENUM('customer', 'vendor', 'carrier', 'system') NOT NULL,
    requested_by_user_id INT NULL,
    
    -- Fees
    reschedule_fee DECIMAL(10,2) DEFAULT 0.00,
    fee_waived BOOLEAN DEFAULT FALSE,
    fee_waive_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reschedule_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_reschedule_schedule 
        FOREIGN KEY (schedule_id) REFERENCES order_delivery_schedules(schedule_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_reschedule_user 
        FOREIGN KEY (requested_by_user_id) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    INDEX idx_order_reschedules (order_id, created_at DESC),
    INDEX idx_schedule_history (schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default delivery time slots
INSERT IGNORE INTO delivery_time_slots (slot_name, slot_code, start_time, end_time, available_days, priority_order) VALUES 
('Early Morning (6AM-8AM)', 'early_morning', '06:00:00', '08:00:00', '[1,2,3,4,5]', 1),
('Morning (8AM-12PM)', 'morning', '08:00:00', '12:00:00', '[1,2,3,4,5,6]', 2),
('Afternoon (12PM-5PM)', 'afternoon', '12:00:00', '17:00:00', '[1,2,3,4,5,6]', 3),
('Evening (5PM-8PM)', 'evening', '17:00:00', '20:00:00', '[1,2,3,4,5]', 4),
('Weekend Morning (9AM-1PM)', 'weekend_morning', '09:00:00', '13:00:00', '[0,6]', 5),
('Weekend Afternoon (1PM-5PM)', 'weekend_afternoon', '13:00:00', '17:00:00', '[0,6]', 6);

-- Insert common blackout dates (holidays)
INSERT IGNORE INTO delivery_blackout_dates (blackout_date, blackout_name, is_recurring_yearly, notification_message) VALUES 
('2025-01-01', 'New Year\'s Day', TRUE, 'Deliveries are not available on New Year\'s Day'),
('2025-07-04', 'Independence Day', TRUE, 'Deliveries are not available on Independence Day'),
('2025-12-25', 'Christmas Day', TRUE, 'Deliveries are not available on Christmas Day'),
('2025-11-28', 'Thanksgiving Day', TRUE, 'Deliveries are not available on Thanksgiving Day');

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_update_delivery_capacity;
DROP TRIGGER IF EXISTS tr_prevent_overbooking;

DELIMITER $$

-- Update capacity when delivery is scheduled
CREATE TRIGGER tr_update_delivery_capacity
    AFTER INSERT ON order_delivery_schedules
    FOR EACH ROW
BEGIN
    DECLARE zone_id_val INT;
    
    -- Get zone_id from order's shipping address (simplified - you may need to adjust based on your schema)
    SELECT sz.zone_id INTO zone_id_val
    FROM orders o
    LEFT JOIN shipping_zones sz ON sz.is_active = TRUE
    WHERE o.order_id = NEW.order_id
    LIMIT 1;
    
    -- Insert or update capacity tracking
    INSERT INTO delivery_capacity (delivery_date, time_slot_id, zone_id, total_capacity, booked_count)
    SELECT NEW.delivery_date, NEW.time_slot_id, zone_id_val, 
           COALESCE(dts.max_deliveries_per_day, 10), 1
    FROM delivery_time_slots dts
    WHERE dts.slot_id = NEW.time_slot_id
    ON DUPLICATE KEY UPDATE
        booked_count = booked_count + 1;
END$$

-- Prevent overbooking
CREATE TRIGGER tr_prevent_overbooking
    BEFORE INSERT ON order_delivery_schedules
    FOR EACH ROW
BEGIN
    DECLARE available_slots INT;
    DECLARE zone_id_val INT;
    
    -- Get zone_id
    SELECT sz.zone_id INTO zone_id_val
    FROM orders o
    LEFT JOIN shipping_zones sz ON sz.is_active = TRUE
    WHERE o.order_id = NEW.order_id
    LIMIT 1;
    
    -- Check capacity
    SELECT COALESCE(
        (SELECT available_capacity 
         FROM delivery_capacity 
         WHERE delivery_date = NEW.delivery_date 
         AND time_slot_id = NEW.time_slot_id 
         AND (zone_id = zone_id_val OR zone_id IS NULL)
         AND NOT is_blocked),
        (SELECT max_deliveries_per_day 
         FROM delivery_time_slots 
         WHERE slot_id = NEW.time_slot_id)
    ) INTO available_slots;
    
    IF available_slots <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'No delivery capacity available for selected date and time slot';
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- ADD DELIVERY FIELDS TO ORDERS TABLE
-- =============================================================================

-- Add delivery preference fields to orders table if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'preferred_delivery_date') > 0,
    'SELECT "Column preferred_delivery_date already exists" as Info',
    'ALTER TABLE orders ADD COLUMN preferred_delivery_date DATE NULL COMMENT "Customer preferred delivery date"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'preferred_time_slot_id') > 0,
    'SELECT "Column preferred_time_slot_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN preferred_time_slot_id INT NULL COMMENT "Reference to delivery_time_slots"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_delivery_slot' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_delivery_slot already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_delivery_slot 
     FOREIGN KEY (preferred_time_slot_id) REFERENCES delivery_time_slots(slot_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Delivery Date Scheduling system created successfully!' as Status;