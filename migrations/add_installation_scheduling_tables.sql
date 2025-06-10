-- Add Installation Scheduling System
-- This migration adds comprehensive installation scheduling and management tables

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

USE blindscommerce;

-- Installation service areas
CREATE TABLE IF NOT EXISTS installation_service_areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(255) NOT NULL,
    area_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Geographic coverage
    states_provinces JSON NOT NULL COMMENT 'Array of supported states/provinces',
    cities JSON NULL COMMENT 'Array of supported cities (null = all cities in states)',
    postal_code_patterns JSON NULL COMMENT 'Regex patterns for postal codes',
    
    -- Service settings
    is_active BOOLEAN DEFAULT TRUE,
    lead_time_days INT NOT NULL DEFAULT 3 COMMENT 'Minimum days advance notice required',
    max_advance_days INT NOT NULL DEFAULT 60 COMMENT 'Maximum days in advance to book',
    
    -- Pricing
    base_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    per_hour_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
    travel_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Service hours
    service_days JSON NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
    service_start_time TIME NOT NULL DEFAULT '08:00:00',
    service_end_time TIME NOT NULL DEFAULT '18:00:00',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_area_code (area_code),
    INDEX idx_active_areas (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Installation technicians/crews
CREATE TABLE IF NOT EXISTS installation_technicians (
    technician_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Reference to users table for installer account',
    employee_id VARCHAR(50) UNIQUE,
    
    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Service areas
    primary_service_area_id INT NOT NULL,
    secondary_service_areas JSON NULL COMMENT 'Array of additional area_ids',
    
    -- Skills and certifications
    skill_level ENUM('trainee', 'standard', 'senior', 'master') DEFAULT 'standard',
    certifications JSON NULL COMMENT 'Array of certification names/codes',
    specializations JSON NULL COMMENT 'Types of installations: blinds, shutters, awnings, etc.',
    
    -- Scheduling preferences
    max_jobs_per_day INT DEFAULT 4,
    preferred_start_time TIME DEFAULT '08:00:00',
    preferred_end_time TIME DEFAULT '17:00:00',
    works_weekends BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_installations INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    availability_status ENUM('available', 'busy', 'off_duty', 'vacation') DEFAULT 'available',
    hire_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_technician_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_technician_primary_area 
        FOREIGN KEY (primary_service_area_id) REFERENCES installation_service_areas(area_id) 
        ON DELETE RESTRICT,
    
    UNIQUE KEY unique_technician_user (user_id),
    INDEX idx_service_area (primary_service_area_id),
    INDEX idx_active_technicians (is_active, availability_status),
    INDEX idx_skill_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Installation time slots
CREATE TABLE IF NOT EXISTS installation_time_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL,
    slot_code VARCHAR(50) NOT NULL,
    
    -- Time window
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(3,1) GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60.0) STORED,
    
    -- Availability
    available_days JSON NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
    is_premium BOOLEAN DEFAULT FALSE COMMENT 'Premium time slots cost extra',
    premium_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Capacity
    max_concurrent_jobs INT DEFAULT 5 COMMENT 'Max number of jobs that can be scheduled in this slot',
    
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_slot_code (slot_code),
    INDEX idx_time_window (start_time, end_time),
    INDEX idx_active_slots (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Installation appointments/bookings
CREATE TABLE IF NOT EXISTS installation_appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    
    -- Scheduling details
    appointment_date DATE NOT NULL,
    time_slot_id INT NOT NULL,
    estimated_duration_hours DECIMAL(3,1) NOT NULL DEFAULT 2.0,
    
    -- Assignment
    assigned_technician_id INT NULL,
    backup_technician_id INT NULL,
    crew_size INT DEFAULT 1,
    
    -- Installation details
    installation_type ENUM('measurement', 'installation', 'repair', 'consultation') NOT NULL DEFAULT 'installation',
    product_types JSON NOT NULL COMMENT 'Types of products being installed',
    room_count INT DEFAULT 1,
    window_count INT DEFAULT 1,
    special_requirements TEXT NULL,
    
    -- Location
    installation_address JSON NOT NULL COMMENT 'Full address details',
    access_instructions TEXT NULL,
    parking_instructions TEXT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    alternative_contact VARCHAR(20) NULL,
    
    -- Pricing
    base_cost DECIMAL(10,2) NOT NULL,
    additional_fees JSON NULL COMMENT 'Breakdown of extra charges',
    total_cost DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show') DEFAULT 'scheduled',
    confirmation_sent_at TIMESTAMP NULL,
    reminder_sent_at TIMESTAMP NULL,
    
    -- Completion details
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    completion_notes TEXT NULL,
    before_photos JSON NULL COMMENT 'Array of photo URLs',
    after_photos JSON NULL COMMENT 'Array of photo URLs',
    
    -- Customer satisfaction
    customer_rating TINYINT NULL COMMENT '1-5 star rating',
    customer_feedback TEXT NULL,
    issues_reported TEXT NULL,
    
    -- Rescheduling
    original_appointment_date DATE NULL,
    reschedule_count INT DEFAULT 0,
    reschedule_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_appointment_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appointment_customer 
        FOREIGN KEY (customer_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_appointment_slot 
        FOREIGN KEY (time_slot_id) REFERENCES installation_time_slots(slot_id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_technician 
        FOREIGN KEY (assigned_technician_id) REFERENCES installation_technicians(technician_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_appointment_backup 
        FOREIGN KEY (backup_technician_id) REFERENCES installation_technicians(technician_id) 
        ON DELETE SET NULL,
    
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_technician_schedule (assigned_technician_id, appointment_date),
    INDEX idx_customer_appointments (customer_id, appointment_date),
    INDEX idx_status (status),
    INDEX idx_order_appointment (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Technician availability calendar
CREATE TABLE IF NOT EXISTS technician_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    
    -- Date and time
    availability_date DATE NOT NULL,
    time_slot_id INT NOT NULL,
    
    -- Availability status
    is_available BOOLEAN DEFAULT TRUE,
    unavailable_reason ENUM('booked', 'vacation', 'sick', 'training', 'maintenance', 'other') NULL,
    notes TEXT NULL,
    
    -- Override settings
    custom_start_time TIME NULL COMMENT 'Override slot start time',
    custom_end_time TIME NULL COMMENT 'Override slot end time',
    max_jobs_override INT NULL COMMENT 'Override max jobs for this slot',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_technician_date_slot (technician_id, availability_date, time_slot_id),
    
    CONSTRAINT fk_availability_technician 
        FOREIGN KEY (technician_id) REFERENCES installation_technicians(technician_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_availability_slot 
        FOREIGN KEY (time_slot_id) REFERENCES installation_time_slots(slot_id) 
        ON DELETE CASCADE,
    
    INDEX idx_date_availability (availability_date, is_available),
    INDEX idx_technician_calendar (technician_id, availability_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Installation job materials and parts
CREATE TABLE IF NOT EXISTS installation_job_materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    
    -- Material details
    material_type ENUM('bracket', 'screw', 'anchor', 'chain', 'cord', 'motor', 'remote', 'other') NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NULL,
    model_number VARCHAR(100) NULL,
    
    -- Quantity and pricing
    quantity_required INT NOT NULL,
    quantity_used INT NULL,
    unit_cost DECIMAL(8,2) NULL,
    total_cost DECIMAL(10,2) NULL,
    
    -- Source
    source ENUM('customer_provided', 'technician_stock', 'special_order', 'warranty_replacement') NOT NULL,
    supplier VARCHAR(255) NULL,
    
    -- Notes
    installation_notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_materials_appointment 
        FOREIGN KEY (appointment_id) REFERENCES installation_appointments(appointment_id) 
        ON DELETE CASCADE,
    
    INDEX idx_appointment_materials (appointment_id),
    INDEX idx_material_type (material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Installation quality checklist
CREATE TABLE IF NOT EXISTS installation_quality_checks (
    check_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    
    -- Checklist items
    mounting_secure BOOLEAN NULL,
    operation_smooth BOOLEAN NULL,
    alignment_correct BOOLEAN NULL,
    safety_features_working BOOLEAN NULL,
    cleanup_completed BOOLEAN NULL,
    customer_walkthrough_done BOOLEAN NULL,
    warranty_explained BOOLEAN NULL,
    
    -- Overall scores
    quality_score TINYINT NULL COMMENT '1-10 quality rating',
    safety_score TINYINT NULL COMMENT '1-10 safety rating',
    
    -- Issues and resolutions
    issues_found TEXT NULL,
    resolutions_applied TEXT NULL,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT NULL,
    
    -- Sign-off
    technician_signature VARCHAR(500) NULL COMMENT 'Digital signature data',
    customer_signature VARCHAR(500) NULL COMMENT 'Digital signature data',
    supervisor_approval BOOLEAN DEFAULT FALSE,
    approved_by INT NULL,
    
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_quality_check_appointment 
        FOREIGN KEY (appointment_id) REFERENCES installation_appointments(appointment_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_quality_check_supervisor 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) 
        ON DELETE SET NULL,
    
    UNIQUE KEY unique_appointment_quality_check (appointment_id),
    INDEX idx_quality_scores (quality_score, safety_score),
    INDEX idx_follow_up_required (follow_up_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default service areas
INSERT IGNORE INTO installation_service_areas (area_name, area_code, states_provinces, service_days) VALUES 
('Austin Metro', 'AUSTIN_TX', '["Texas"]', '["1","2","3","4","5"]'),
('Dallas Metro', 'DALLAS_TX', '["Texas"]', '["1","2","3","4","5"]'),
('Houston Metro', 'HOUSTON_TX', '["Texas"]', '["1","2","3","4","5"]');

-- Insert default time slots
INSERT IGNORE INTO installation_time_slots (slot_name, slot_code, start_time, end_time, available_days, display_order) VALUES 
('Early Morning', 'early_morning', '07:00:00', '10:00:00', '["1","2","3","4","5"]', 1),
('Morning', 'morning', '08:00:00', '12:00:00', '["1","2","3","4","5","6"]', 2),
('Afternoon', 'afternoon', '12:00:00', '17:00:00', '["1","2","3","4","5","6"]', 3),
('Evening', 'evening', '17:00:00', '20:00:00', '["1","2","3","4","5"]', 4),
('Weekend Morning', 'weekend_morning', '09:00:00', '13:00:00', '["0","6"]', 5),
('Weekend Afternoon', 'weekend_afternoon', '13:00:00', '17:00:00', '["0","6"]', 6);

-- =============================================================================
-- TRIGGERS AND PROCEDURES
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_update_technician_stats;
DROP TRIGGER IF EXISTS tr_auto_assign_technician;

DELIMITER $$

-- Update technician statistics when appointment is completed
CREATE TRIGGER tr_update_technician_stats
    AFTER UPDATE ON installation_appointments
    FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_technician_id IS NOT NULL THEN
        UPDATE installation_technicians 
        SET total_installations = total_installations + 1,
            average_rating = (
                SELECT AVG(customer_rating) 
                FROM installation_appointments 
                WHERE assigned_technician_id = NEW.assigned_technician_id 
                AND customer_rating IS NOT NULL
            ),
            completion_rate = (
                SELECT (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / COUNT(*) 
                FROM installation_appointments 
                WHERE assigned_technician_id = NEW.assigned_technician_id
            )
        WHERE technician_id = NEW.assigned_technician_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- ADD INSTALLATION FIELDS TO ORDERS TABLE
-- =============================================================================

-- Add installation appointment reference to orders table if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders' 
     AND COLUMN_NAME = 'installation_appointment_id') > 0,
    'SELECT "Column installation_appointment_id already exists" as Info',
    'ALTER TABLE orders ADD COLUMN installation_appointment_id INT NULL COMMENT "Reference to installation_appointments table"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_NAME = 'fk_orders_installation_appointment' 
     AND TABLE_SCHEMA = 'blindscommerce' 
     AND TABLE_NAME = 'orders') > 0,
    'SELECT "Foreign key fk_orders_installation_appointment already exists" as Info',
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_installation_appointment 
     FOREIGN KEY (installation_appointment_id) REFERENCES installation_appointments(appointment_id) 
     ON DELETE SET NULL'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Installation Scheduling system created successfully!' as Status;