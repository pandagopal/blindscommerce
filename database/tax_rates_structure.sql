-- US Tax Rates by ZIP Code
-- This table stores accurate tax rates for US locations

CREATE TABLE IF NOT EXISTS tax_rates (
  tax_rate_id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Location identifiers
  zip_code VARCHAR(10) NOT NULL,
  city VARCHAR(100),
  county VARCHAR(100),
  state_code CHAR(2) NOT NULL,
  state_name VARCHAR(50),
  
  -- Tax rate components (stored as percentage)
  state_tax_rate DECIMAL(6,4) DEFAULT 0.0000,
  county_tax_rate DECIMAL(6,4) DEFAULT 0.0000,
  city_tax_rate DECIMAL(6,4) DEFAULT 0.0000,
  special_district_tax_rate DECIMAL(6,4) DEFAULT 0.0000,
  
  -- Combined rate for quick lookup
  total_tax_rate DECIMAL(6,4) NOT NULL,
  
  -- Additional information
  tax_jurisdiction VARCHAR(255),
  effective_date DATE DEFAULT (CURDATE()),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for fast lookup
  INDEX idx_zip_code (zip_code),
  INDEX idx_state_code (state_code),
  INDEX idx_total_rate (total_tax_rate),
  INDEX idx_active (is_active)
);