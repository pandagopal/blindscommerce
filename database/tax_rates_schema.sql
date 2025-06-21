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

-- Sample data for major US cities
INSERT INTO tax_rates (zip_code, city, county, state_code, state_name, state_tax_rate, county_tax_rate, city_tax_rate, special_district_tax_rate, total_tax_rate, tax_jurisdiction) VALUES

-- New York
('10001', 'New York', 'New York County', 'NY', 'New York', 4.0000, 4.2500, 0.0000, 0.0000, 8.2500, 'New York City'),
('10019', 'New York', 'New York County', 'NY', 'New York', 4.0000, 4.2500, 0.0000, 0.0000, 8.2500, 'New York City'),

-- California  
('90210', 'Beverly Hills', 'Los Angeles County', 'CA', 'California', 7.2500, 2.2500, 0.0000, 0.0000, 9.5000, 'Los Angeles County'),
('94102', 'San Francisco', 'San Francisco County', 'CA', 'California', 7.2500, 1.2500, 0.0000, 0.0000, 8.5000, 'San Francisco'),

-- Texas
('75201', 'Dallas', 'Dallas County', 'TX', 'Texas', 6.2500, 2.0000, 0.0000, 0.0000, 8.2500, 'Dallas County'),
('78701', 'Austin', 'Travis County', 'TX', 'Texas', 6.2500, 2.0000, 0.0000, 0.0000, 8.2500, 'Austin'),

-- Illinois
('60601', 'Chicago', 'Cook County', 'IL', 'Illinois', 6.2500, 1.7500, 2.2500, 0.0000, 10.2500, 'Chicago'),

-- Florida (no state income tax, but has sales tax)
('33101', 'Miami', 'Miami-Dade County', 'FL', 'Florida', 6.0000, 1.0000, 0.0000, 0.0000, 7.0000, 'Miami-Dade County'),

-- Washington
('98101', 'Seattle', 'King County', 'WA', 'Washington', 6.5000, 3.1000, 0.0000, 0.0000, 9.6000, 'Seattle'),

-- No sales tax states
('97201', 'Portland', 'Multnomah County', 'OR', 'Oregon', 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 'Oregon - No Sales Tax'),
('19901', 'Dover', 'Kent County', 'DE', 'Delaware', 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 'Delaware - No Sales Tax'),

-- Default fallback rates by state
('00000', 'Default', 'Default', 'TX', 'Texas', 6.2500, 2.0000, 0.0000, 0.0000, 8.2500, 'Texas Default'),
('00000', 'Default', 'Default', 'CA', 'California', 7.2500, 1.0000, 0.0000, 0.0000, 8.2500, 'California Default'),
('00000', 'Default', 'Default', 'NY', 'New York', 4.0000, 3.0000, 0.0000, 0.0000, 7.0000, 'New York Default'),
('00000', 'Default', 'Default', 'FL', 'Florida', 6.0000, 1.0000, 0.0000, 0.0000, 7.0000, 'Florida Default'),
('00000', 'Default', 'Default', 'IL', 'Illinois', 6.2500, 2.0000, 0.0000, 0.0000, 8.2500, 'Illinois Default');

-- Add a comprehensive default rate for unknown locations
INSERT INTO tax_rates (zip_code, city, county, state_code, state_name, state_tax_rate, county_tax_rate, city_tax_rate, special_district_tax_rate, total_tax_rate, tax_jurisdiction) VALUES
('99999', 'Unknown', 'Unknown', 'US', 'United States', 6.0000, 2.0000, 0.0000, 0.0000, 8.0000, 'US Average Tax Rate');