-- Add payment environment settings to company_settings table
-- This script adds environment (live/sandbox) settings for all payment providers

-- Stripe environment
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('stripe_environment', 'sandbox', 'string', 'payments', 'Stripe API environment (sandbox or live)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- PayPal environment  
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('paypal_environment', 'sandbox', 'string', 'payments', 'PayPal API environment (sandbox or live)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Braintree environment
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('braintree_environment', 'sandbox', 'string', 'payments', 'Braintree API environment (sandbox or production)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Klarna environment
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('klarna_environment', 'sandbox', 'string', 'payments', 'Klarna API environment (sandbox or live)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Klarna API URL (changes based on environment)
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('klarna_api_url', 'https://api.playground.klarna.com', 'string', 'payments', 'Klarna API base URL', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Afterpay environment
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('afterpay_environment', 'sandbox', 'string', 'payments', 'Afterpay API environment (sandbox or live)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Affirm environment
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('affirm_environment', 'sandbox', 'string', 'payments', 'Affirm API environment (sandbox or live)', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Affirm API URL (changes based on environment)
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES ('affirm_api_url', 'https://sandbox.affirm.com', 'string', 'payments', 'Affirm API base URL', 0)
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Update Affirm key names to match PaymentService expectations
UPDATE company_settings SET setting_key = 'affirm_public_key' WHERE setting_key = 'affirm_public_api_key';
UPDATE company_settings SET setting_key = 'affirm_private_key' WHERE setting_key = 'affirm_private_api_key';