-- Add social login fields to users table
-- This migration adds support for social authentication providers

-- Add social login columns to users table
ALTER TABLE users 
ADD COLUMN social_provider VARCHAR(50) NULL COMMENT 'Social login provider (google, facebook, github, twitter, linkedin)',
ADD COLUMN social_id VARCHAR(255) NULL COMMENT 'Unique ID from social provider',
ADD COLUMN profile_image VARCHAR(500) NULL COMMENT 'Profile image URL from social provider',
ADD COLUMN email_verified TINYINT(1) DEFAULT 0 COMMENT 'Email verification status',
ADD COLUMN last_login TIMESTAMP NULL COMMENT 'Last login timestamp';

-- Add indexes for social login lookups
CREATE INDEX idx_users_social_provider ON users(social_provider);
CREATE INDEX idx_users_social_id ON users(social_id);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Add unique constraint for social provider + social_id combination
ALTER TABLE users 
ADD CONSTRAINT uk_users_social_provider_id UNIQUE (social_provider, social_id);

-- Create social_accounts table for multiple social account support
CREATE TABLE IF NOT EXISTS social_accounts (
  social_account_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  provider VARCHAR(50) NOT NULL COMMENT 'Social provider name',
  provider_account_id VARCHAR(255) NOT NULL COMMENT 'Account ID from provider',
  provider_type VARCHAR(50) DEFAULT 'oauth' COMMENT 'Provider type',
  refresh_token TEXT NULL COMMENT 'Refresh token from provider',
  access_token TEXT NULL COMMENT 'Access token from provider',
  expires_at INT NULL COMMENT 'Token expiration timestamp',
  token_type VARCHAR(50) NULL COMMENT 'Token type',
  scope VARCHAR(255) NULL COMMENT 'Token scope',
  id_token TEXT NULL COMMENT 'ID token from provider',
  session_state VARCHAR(255) NULL COMMENT 'Session state',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY uk_social_accounts_provider (provider, provider_account_id),
  INDEX idx_social_accounts_user_id (user_id),
  INDEX idx_social_accounts_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create verification_tokens table for NextAuth
CREATE TABLE IF NOT EXISTS verification_tokens (
  token VARCHAR(255) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL,
  
  PRIMARY KEY (token),
  UNIQUE KEY uk_verification_tokens_identifier_token (identifier, token),
  INDEX idx_verification_tokens_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sessions table for NextAuth database sessions (optional - we use JWT)
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  expires TIMESTAMP NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (session_id),
  UNIQUE KEY uk_sessions_session_token (session_token),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;