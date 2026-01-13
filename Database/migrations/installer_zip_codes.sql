-- Migration: Installer Zip Codes
-- Description: Links installers (users with role='installer') to zip codes they serve
-- When orders are shipped, installers see orders in their service zip codes

-- =====================================================
-- Table: installer_zip_codes
-- Maps installer users to the zip codes they serve
-- =====================================================
CREATE TABLE IF NOT EXISTS `installer_zip_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT 'References users table where role=installer',
  `zip_code` VARCHAR(10) NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 1 COMMENT 'Primary service area',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_installer_zip` (`user_id`, `zip_code`),
  KEY `idx_zip_code` (`zip_code`),
  KEY `idx_user_active` (`user_id`, `is_active`),

  CONSTRAINT `fk_installer_zip_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data: Add zip codes for existing installer user
-- =====================================================
-- INSERT INTO `installer_zip_codes` (`user_id`, `zip_code`, `is_primary`)
-- SELECT user_id, '98052', 1 FROM users WHERE role = 'installer' LIMIT 1;
