-- Create social media accounts table for business profiles
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok') NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_url VARCHAR(500) NOT NULL,
  account_id VARCHAR(255) NULL, -- Platform-specific ID
  access_token TEXT NULL, -- For API integration
  refresh_token TEXT NULL,
  token_expires_at TIMESTAMP NULL,
  
  -- Account settings
  is_active TINYINT(1) DEFAULT 1,
  auto_post TINYINT(1) DEFAULT 0,
  post_schedule JSON NULL, -- When to auto-post
  
  -- Display settings
  display_order INT DEFAULT 0,
  show_in_footer TINYINT(1) DEFAULT 1,
  show_in_header TINYINT(1) DEFAULT 0,
  icon_class VARCHAR(100) NULL, -- CSS class for icon
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_platform (platform),
  INDEX idx_active (is_active),
  INDEX idx_display_order (display_order),
  UNIQUE KEY unique_platform_account (platform, account_name)
);

-- Create social media posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  post_type ENUM('product_showcase', 'room_inspiration', 'customer_review', 'promotion', 'educational', 'company_news', 'custom') NOT NULL,
  
  -- Content
  title VARCHAR(255) NULL,
  content TEXT NOT NULL,
  image_urls JSON NULL, -- Array of image URLs
  video_url VARCHAR(500) NULL,
  
  -- Product/content references
  product_id INT NULL,
  order_id INT NULL,
  review_id INT NULL,
  category_id INT NULL,
  
  -- Scheduling and status
  post_status ENUM('draft', 'scheduled', 'published', 'failed', 'deleted') DEFAULT 'draft',
  scheduled_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  
  -- Platform-specific data
  platform_post_id VARCHAR(255) NULL, -- ID from the social platform
  platform_url VARCHAR(500) NULL, -- URL to the post on the platform
  platform_data JSON NULL, -- Additional platform-specific data
  
  -- Engagement metrics
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  
  -- Hashtags and mentions
  hashtags JSON NULL,
  mentions JSON NULL,
  
  -- Campaign tracking
  campaign_name VARCHAR(255) NULL,
  utm_source VARCHAR(100) NULL,
  utm_medium VARCHAR(100) NULL,
  utm_campaign VARCHAR(100) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_account_id (account_id),
  INDEX idx_post_type (post_type),
  INDEX idx_post_status (post_status),
  INDEX idx_product_id (product_id),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_published_at (published_at),
  INDEX idx_campaign (campaign_name),
  
  CONSTRAINT fk_social_posts_account FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_social_posts_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  CONSTRAINT fk_social_posts_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
  CONSTRAINT fk_social_posts_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- Create social media interactions table for user engagement
CREATE TABLE IF NOT EXISTS social_media_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  interaction_type ENUM('like', 'comment', 'share', 'click', 'view', 'save') NOT NULL,
  user_id INT NULL, -- If interaction came from registered user
  
  -- Interaction data
  interaction_data JSON NULL, -- Platform-specific interaction data
  referrer_url VARCHAR(500) NULL,
  
  -- User info (for anonymous interactions)
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  location_data JSON NULL, -- City, country, etc.
  
  -- Platform tracking
  platform_user_id VARCHAR(255) NULL,
  platform_interaction_id VARCHAR(255) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_post_id (post_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  
  CONSTRAINT fk_social_interactions_post FOREIGN KEY (post_id) REFERENCES social_media_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_social_interactions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create social media campaigns table
CREATE TABLE IF NOT EXISTS social_media_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type ENUM('product_launch', 'seasonal', 'promotional', 'brand_awareness', 'user_generated', 'educational') NOT NULL,
  
  -- Campaign details
  description TEXT NULL,
  objective VARCHAR(255) NULL,
  target_audience JSON NULL, -- Demographics, interests, etc.
  budget DECIMAL(10,2) NULL,
  
  -- Timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  campaign_status ENUM('planning', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'planning',
  
  -- Associated content
  product_ids JSON NULL, -- Array of product IDs to feature
  hashtag_sets JSON NULL, -- Different hashtag combinations to use
  content_templates JSON NULL, -- Template content for posts
  
  -- Results tracking
  total_posts INT DEFAULT 0,
  total_reach INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  roi DECIMAL(10,4) DEFAULT 0.0000,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_campaign_type (campaign_type),
  INDEX idx_campaign_status (campaign_status),
  INDEX idx_dates (start_date, end_date),
  UNIQUE KEY unique_campaign_name (campaign_name)
);

-- Create social media analytics summary table
CREATE TABLE IF NOT EXISTS social_media_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  analytics_date DATE NOT NULL,
  
  -- Daily metrics
  posts_count INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  
  -- Engagement metrics
  total_likes INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_views INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  
  -- Reach and impressions
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  
  -- Website traffic from social
  website_visits INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  
  -- Calculated metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  click_through_rate DECIMAL(5,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_account_date (account_id, analytics_date),
  INDEX idx_analytics_date (analytics_date),
  
  CONSTRAINT fk_social_analytics_account FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_account_date (account_id, analytics_date)
);

-- Insert default social media accounts
INSERT IGNORE INTO social_media_accounts (platform, account_name, account_url, display_order, icon_class) VALUES
('facebook', 'SmartBlinds', 'https://facebook.com/smartblinds', 1, 'fab fa-facebook-f'),
('instagram', 'smartblinds_official', 'https://instagram.com/smartblinds_official', 2, 'fab fa-instagram'),
('twitter', 'SmartBlinds', 'https://twitter.com/smartblinds', 3, 'fab fa-twitter'),
('pinterest', 'SmartBlinds', 'https://pinterest.com/smartblinds', 4, 'fab fa-pinterest'),
('youtube', 'SmartBlinds Channel', 'https://youtube.com/c/smartblinds', 5, 'fab fa-youtube'),
('linkedin', 'SmartBlinds Company', 'https://linkedin.com/company/smartblinds', 6, 'fab fa-linkedin');

-- Create trigger to update campaign statistics
DELIMITER //

CREATE TRIGGER update_campaign_stats
AFTER INSERT ON social_media_posts
FOR EACH ROW
BEGIN
  IF NEW.campaign_name IS NOT NULL THEN
    UPDATE social_media_campaigns 
    SET total_posts = total_posts + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE campaign_name = NEW.campaign_name;
  END IF;
END//

CREATE TRIGGER update_post_engagement
AFTER INSERT ON social_media_interactions
FOR EACH ROW
BEGIN
  -- Update post engagement counts
  IF NEW.interaction_type = 'like' THEN
    UPDATE social_media_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSEIF NEW.interaction_type = 'comment' THEN
    UPDATE social_media_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSEIF NEW.interaction_type = 'share' THEN
    UPDATE social_media_posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  ELSEIF NEW.interaction_type = 'view' THEN
    UPDATE social_media_posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  ELSEIF NEW.interaction_type = 'click' THEN
    UPDATE social_media_posts SET clicks_count = clicks_count + 1 WHERE id = NEW.post_id;
  END IF;
END//

DELIMITER ;

SELECT 'Social media integration tables created successfully!' as status;