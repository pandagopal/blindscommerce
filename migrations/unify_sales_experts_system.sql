-- Migration: Unify Sales Staff and Experts System
-- Remove experts system and use only sales_staff for all sales/support functions

-- First, let's enhance the sales_staff table to include expert-like functionality
ALTER TABLE `sales_staff` 
ADD COLUMN `specialization` varchar(100) DEFAULT NULL 
AFTER `territory`;

ALTER TABLE `sales_staff` 
ADD COLUMN `experience_years` int DEFAULT NULL 
AFTER `specialization`;

ALTER TABLE `sales_staff` 
ADD COLUMN `availability_schedule` json DEFAULT NULL 
AFTER `experience_years`;

ALTER TABLE `sales_staff` 
ADD COLUMN `hourly_rate` decimal(8,2) DEFAULT NULL 
AFTER `availability_schedule`;

ALTER TABLE `sales_staff` 
ADD COLUMN `rating` decimal(3,2) DEFAULT NULL 
AFTER `hourly_rate`;

ALTER TABLE `sales_staff` 
ADD COLUMN `total_consultations` int DEFAULT '0' 
AFTER `rating`;

-- Update any existing chat_sessions that reference expert_id to use sales_staff
-- Note: This would need to be done carefully based on existing data
-- For now, we'll just modify the table structure

-- Drop foreign key constraint from chat_sessions to experts
ALTER TABLE `chat_sessions` 
DROP FOREIGN KEY `chat_sessions_ibfk_2`;

-- Rename expert_id to sales_staff_id in chat_sessions
ALTER TABLE `chat_sessions` 
CHANGE COLUMN `expert_id` `sales_staff_id` int DEFAULT NULL;

-- Add new foreign key constraint to sales_staff
ALTER TABLE `chat_sessions` 
ADD CONSTRAINT `chat_sessions_ibfk_2` 
FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) 
ON DELETE SET NULL;

-- Do the same for consultation_bookings table
ALTER TABLE `consultation_bookings` 
DROP FOREIGN KEY `consultation_bookings_ibfk_2`;

ALTER TABLE `consultation_bookings` 
CHANGE COLUMN `expert_id` `sales_staff_id` int DEFAULT NULL;

ALTER TABLE `consultation_bookings` 
ADD CONSTRAINT `consultation_bookings_ibfk_2` 
FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) 
ON DELETE SET NULL;

-- Do the same for consultation_slots table
ALTER TABLE `consultation_slots` 
DROP FOREIGN KEY `consultation_slots_ibfk_1`;

ALTER TABLE `consultation_slots` 
CHANGE COLUMN `expert_id` `sales_staff_id` int DEFAULT NULL;

ALTER TABLE `consultation_slots` 
ADD CONSTRAINT `consultation_slots_ibfk_1` 
FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) 
ON DELETE CASCADE;

-- Now we can safely drop the experts table
DROP TABLE IF EXISTS `experts`;

-- Create sales assistance sessions table for the PIN-based cart access system
CREATE TABLE `sales_assistance_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `customer_user_id` int NOT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `access_pin` varchar(8) NOT NULL,
  `session_type` enum('cart_assistance','consultation','general_support') DEFAULT 'cart_assistance',
  `status` enum('pending','active','completed','expired') DEFAULT 'pending',
  `customer_cart_id` int DEFAULT NULL,
  `permissions` json DEFAULT NULL COMMENT 'What sales staff can do: view_cart, modify_cart, apply_discounts, etc.',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `unique_active_pin` (`access_pin`, `status`),
  KEY `customer_user_id` (`customer_user_id`),
  KEY `sales_staff_id` (`sales_staff_id`),
  KEY `customer_cart_id` (`customer_cart_id`),
  KEY `idx_pin_status` (`access_pin`, `status`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `sales_assistance_sessions_ibfk_1` 
    FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_assistance_sessions_ibfk_2` 
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_assistance_sessions_ibfk_3` 
    FOREIGN KEY (`customer_cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sales staff online status table for notifications
CREATE TABLE `sales_staff_online_status` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `sales_staff_id` int NOT NULL,
  `is_online` tinyint(1) DEFAULT '0',
  `is_available_for_assistance` tinyint(1) DEFAULT '0',
  `current_active_sessions` int DEFAULT '0',
  `max_concurrent_sessions` int DEFAULT '5',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notification_preferences` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `sales_staff_id` (`sales_staff_id`),
  CONSTRAINT `sales_staff_online_status_ibfk_1` 
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cart access log for audit trail
CREATE TABLE `sales_cart_access_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `assistance_session_id` int NOT NULL,
  `sales_staff_id` int NOT NULL,
  `customer_user_id` int NOT NULL,
  `cart_id` int NOT NULL,
  `action_type` enum('view_cart','add_item','remove_item','modify_item','apply_discount','remove_discount','add_coupon','remove_coupon') NOT NULL,
  `action_details` json DEFAULT NULL COMMENT 'Details of what was changed',
  `previous_state` json DEFAULT NULL COMMENT 'State before change',
  `new_state` json DEFAULT NULL COMMENT 'State after change',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `assistance_session_id` (`assistance_session_id`),
  KEY `sales_staff_id` (`sales_staff_id`),
  KEY `customer_user_id` (`customer_user_id`),
  KEY `cart_id` (`cart_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `sales_cart_access_log_ibfk_1` 
    FOREIGN KEY (`assistance_session_id`) REFERENCES `sales_assistance_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_2` 
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_3` 
    FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_4` 
    FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;