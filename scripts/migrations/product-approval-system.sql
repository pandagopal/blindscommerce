-- Product Approval System Migration
-- Created: 2026-01-04
-- Description: Creates the product_approval_requests table for managing product CRUD approval workflow

-- Create product_approval_requests table
CREATE TABLE IF NOT EXISTS product_approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL COMMENT 'Type of action requested',
  product_id INT NULL COMMENT 'Product ID for UPDATE/DELETE actions',
  requested_by VARCHAR(255) NOT NULL COMMENT 'User ID of the salesperson who made the request',
  vendor_id INT NULL COMMENT 'Vendor ID associated with the product',
  request_data JSON NULL COMMENT 'Complete product data for the requested action',
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT 'Current status of the approval request',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the request was created',
  approved_at TIMESTAMP NULL COMMENT 'When the request was approved',
  rejected_at TIMESTAMP NULL COMMENT 'When the request was rejected',
  approved_by VARCHAR(255) NULL COMMENT 'User ID who approved the request',
  rejected_by VARCHAR(255) NULL COMMENT 'User ID who rejected the request',
  rejection_reason TEXT NULL COMMENT 'Reason provided for rejection',

  -- Foreign Keys
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendor_info(vendor_info_id) ON DELETE SET NULL,

  -- Indexes for performance
  INDEX idx_status (status),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_created_at (created_at),
  INDEX idx_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores product approval requests from salespersons for admin/vendor review';

-- Verify table was created
SELECT 'product_approval_requests table created successfully' AS status;

-- Show table structure
DESCRIBE product_approval_requests;
