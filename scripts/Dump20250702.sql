CREATE DATABASE  IF NOT EXISTS `blindscommerce_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `blindscommerce_test`;
-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: blindscommerce_test
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `abandoned_cart_recovery`
--

DROP TABLE IF EXISTS `abandoned_cart_recovery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abandoned_cart_recovery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cart_data` json NOT NULL,
  `total_value` decimal(10,2) NOT NULL,
  `item_count` int NOT NULL,
  `recovery_status` enum('pending','email_sent','reminder_sent','recovered','expired','opted_out') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `recovery_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_email_sent_at` timestamp NULL DEFAULT NULL,
  `reminder_email_sent_at` timestamp NULL DEFAULT NULL,
  `last_email_sent_at` timestamp NULL DEFAULT NULL,
  `email_open_count` int DEFAULT '0',
  `email_click_count` int DEFAULT '0',
  `recovered_at` timestamp NULL DEFAULT NULL,
  `recovery_order_id` int DEFAULT NULL,
  `recovery_value` decimal(10,2) DEFAULT '0.00',
  `send_first_email_after` int DEFAULT '1440',
  `send_reminder_after` int DEFAULT '4320',
  `expire_after` int DEFAULT '10080',
  `customer_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_contact_time` enum('morning','afternoon','evening','any') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'any',
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `source_page` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recovery_token` (`recovery_token`),
  KEY `idx_cart_id` (`cart_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_email` (`email`),
  KEY `idx_recovery_token` (`recovery_token`),
  KEY `idx_recovery_status` (`recovery_status`),
  KEY `idx_created_at` (`created_at`),
  KEY `recovery_order_id` (`recovery_order_id`),
  CONSTRAINT `abandoned_cart_recovery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `abandoned_cart_recovery_ibfk_2` FOREIGN KEY (`recovery_order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abandoned_cart_recovery`
--

LOCK TABLES `abandoned_cart_recovery` WRITE;
/*!40000 ALTER TABLE `abandoned_cart_recovery` DISABLE KEYS */;
/*!40000 ALTER TABLE `abandoned_cart_recovery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `abandoned_carts`
--

DROP TABLE IF EXISTS `abandoned_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abandoned_carts` (
  `abandoned_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cart_value` decimal(10,2) NOT NULL,
  `item_count` int NOT NULL,
  `abandoned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `recovery_email_sent` tinyint(1) DEFAULT '0',
  `recovery_emails_count` int DEFAULT '0',
  `last_recovery_email` timestamp NULL DEFAULT NULL,
  `recovered_at` timestamp NULL DEFAULT NULL,
  `recovery_order_id` int DEFAULT NULL,
  PRIMARY KEY (`abandoned_id`),
  KEY `idx_abandoned_user` (`user_id`),
  KEY `idx_abandoned_session` (`session_id`),
  KEY `idx_abandoned_at` (`abandoned_at`),
  KEY `idx_recovery_status` (`recovery_email_sent`,`recovered_at`),
  CONSTRAINT `fk_abandoned_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abandoned_carts`
--

LOCK TABLES `abandoned_carts` WRITE;
/*!40000 ALTER TABLE `abandoned_carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `abandoned_carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `address_validation_history`
--

DROP TABLE IF EXISTS `address_validation_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address_validation_history` (
  `validation_id` int NOT NULL AUTO_INCREMENT,
  `address_id` int NOT NULL,
  `validation_service` enum('ups','fedex','usps','google','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `validation_status` enum('valid','invalid','corrected','ambiguous') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_address` json NOT NULL COMMENT 'Original address as entered',
  `suggested_address` json DEFAULT NULL COMMENT 'Address suggested by validation service',
  `confidence_score` decimal(3,2) DEFAULT NULL COMMENT 'Validation confidence from 0.00 to 1.00',
  `validation_errors` json DEFAULT NULL COMMENT 'Any errors or warnings from validation',
  `service_response` json DEFAULT NULL COMMENT 'Full response from validation service',
  `validated_by` int DEFAULT NULL COMMENT 'User ID if manually validated',
  `validation_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`validation_id`),
  KEY `fk_validation_user` (`validated_by`),
  KEY `idx_address_validations` (`address_id`,`created_at` DESC),
  KEY `idx_validation_service` (`validation_service`),
  KEY `idx_validation_status` (`validation_status`),
  CONSTRAINT `fk_validation_address` FOREIGN KEY (`address_id`) REFERENCES `user_shipping_addresses` (`address_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_validation_user` FOREIGN KEY (`validated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address_validation_history`
--

LOCK TABLES `address_validation_history` WRITE;
/*!40000 ALTER TABLE `address_validation_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `address_validation_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_type` enum('shipping','billing') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'shipping',
  `street_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apartment` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'United States',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_pricing_controls`
--

DROP TABLE IF EXISTS `admin_pricing_controls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_pricing_controls` (
  `control_id` int NOT NULL AUTO_INCREMENT,
  `control_type` enum('global_markup','vendor_margin_limit','category_pricing_rule','emergency_override') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `control_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('all_products','vendor','category','specific_products') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int DEFAULT NULL,
  `target_ids` json DEFAULT NULL COMMENT 'Array of IDs for specific products',
  `rule_type` enum('markup_percent','markup_amount','max_price','min_price','fixed_price') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_value` decimal(10,2) NOT NULL,
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `customer_types` json DEFAULT NULL COMMENT 'Array of customer types this applies to',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` datetime NOT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_emergency_override` tinyint(1) DEFAULT '0',
  `override_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`control_id`),
  KEY `fk_pricing_control_creator` (`created_by`),
  KEY `fk_pricing_control_approver` (`approved_by`),
  KEY `idx_control_type` (`control_type`,`applies_to`),
  KEY `idx_active_controls` (`is_active`,`valid_from`,`valid_until`),
  KEY `idx_emergency_overrides` (`is_emergency_override`,`is_active`),
  CONSTRAINT `fk_pricing_control_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pricing_control_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_pricing_controls`
--

LOCK TABLES `admin_pricing_controls` WRITE;
/*!40000 ALTER TABLE `admin_pricing_controls` DISABLE KEYS */;
INSERT INTO `admin_pricing_controls` VALUES (1,'global_markup','Global Minimum Markup','all_products',NULL,NULL,'markup_percent',20.00,0.00,NULL,1,'2025-06-10 15:04:09',NULL,0,NULL,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(2,'category_pricing_rule','Premium Category Markup','category',NULL,NULL,'markup_percent',35.00,0.00,NULL,1,'2025-06-10 15:04:09',NULL,0,NULL,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(3,'vendor_margin_limit','Vendor Margin Limit','vendor',NULL,NULL,'markup_percent',45.00,0.00,NULL,1,'2025-06-10 15:04:09',NULL,0,NULL,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(4,'global_markup','Global Minimum Markup','all_products',NULL,NULL,'markup_percent',20.00,0.00,NULL,1,'2025-06-10 15:06:25',NULL,0,NULL,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25'),(5,'category_pricing_rule','Premium Category Markup','category',NULL,NULL,'markup_percent',35.00,0.00,NULL,1,'2025-06-10 15:06:25',NULL,0,NULL,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25'),(6,'vendor_margin_limit','Vendor Margin Limit','vendor',NULL,NULL,'markup_percent',45.00,0.00,NULL,1,'2025-06-10 15:06:25',NULL,0,NULL,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25');
/*!40000 ALTER TABLE `admin_pricing_controls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_daily_summary`
--

DROP TABLE IF EXISTS `analytics_daily_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_daily_summary` (
  `summary_id` int NOT NULL AUTO_INCREMENT,
  `summary_date` date NOT NULL,
  `total_sessions` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `page_views` int DEFAULT '0',
  `bounce_rate` decimal(5,2) DEFAULT '0.00',
  `avg_session_duration` int DEFAULT '0',
  `total_orders` int DEFAULT '0',
  `total_revenue` decimal(12,2) DEFAULT '0.00',
  `avg_order_value` decimal(10,2) DEFAULT '0.00',
  `conversion_rate` decimal(5,2) DEFAULT '0.00',
  `cart_abandonment_rate` decimal(5,2) DEFAULT '0.00',
  `products_viewed` int DEFAULT '0',
  `products_added_to_cart` int DEFAULT '0',
  `new_users` int DEFAULT '0',
  `returning_users` int DEFAULT '0',
  `desktop_sessions` int DEFAULT '0',
  `mobile_sessions` int DEFAULT '0',
  `tablet_sessions` int DEFAULT '0',
  `organic_sessions` int DEFAULT '0',
  `paid_sessions` int DEFAULT '0',
  `social_sessions` int DEFAULT '0',
  `direct_sessions` int DEFAULT '0',
  `referral_sessions` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`summary_id`),
  UNIQUE KEY `unique_summary_date` (`summary_date`),
  KEY `idx_summary_date` (`summary_date`),
  KEY `idx_summary_revenue` (`total_revenue`),
  KEY `idx_summary_sessions` (`total_sessions`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_daily_summary`
--

LOCK TABLES `analytics_daily_summary` WRITE;
/*!40000 ALTER TABLE `analytics_daily_summary` DISABLE KEYS */;
INSERT INTO `analytics_daily_summary` VALUES (1,'2025-06-08',145,123,487,35.50,420,12,2450.00,204.17,8.28,65.20,89,45,23,100,89,45,11,78,15,25,20,7,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(2,'2025-06-07',132,115,445,38.20,385,8,1680.00,210.00,6.06,70.15,76,38,18,97,82,38,12,71,12,22,18,9,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(3,'2025-06-06',158,134,523,32.10,465,15,3125.00,208.33,9.49,58.90,98,52,28,106,95,48,15,85,18,28,19,8,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(4,'2025-06-05',167,142,578,29.80,495,18,3780.00,210.00,10.78,55.40,108,62,31,111,102,52,13,92,20,31,16,8,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(5,'2025-06-04',189,165,634,28.50,520,22,4620.00,210.00,11.64,52.30,125,72,38,127,115,58,16,105,25,35,17,7,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(6,'2025-06-03',142,118,456,36.90,398,9,1890.00,210.00,6.34,68.75,82,41,22,96,88,42,12,76,14,26,19,7,'2025-06-09 19:41:25','2025-06-09 19:41:25'),(7,'2025-06-02',123,105,389,41.20,345,6,1260.00,210.00,4.88,75.60,68,32,15,90,75,38,10,68,11,20,16,8,'2025-06-09 19:41:25','2025-06-09 19:41:25');
/*!40000 ALTER TABLE `analytics_daily_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_events`
--

DROP TABLE IF EXISTS `analytics_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_events` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_value` decimal(10,2) DEFAULT NULL,
  `page_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_referrer` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `device_type` enum('desktop','mobile','tablet') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `screen_resolution` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_term` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_content` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_data` json DEFAULT NULL,
  `page_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referrer_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `user_id` (`user_id`),
  KEY `session_id` (`session_id`),
  KEY `event_type` (`event_type`),
  KEY `event_name` (`event_name`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `analytics_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_events`
--

LOCK TABLES `analytics_events` WRITE;
/*!40000 ALTER TABLE `analytics_events` DISABLE KEYS */;
INSERT INTO `analytics_events` VALUES (1,1,'sess_001','page_view','page_view','navigation',NULL,NULL,'/','Home Page',NULL,NULL,'desktop','Chrome',NULL,NULL,'google','organic',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-08 19:41:42'),(2,1,'sess_001','page_view','page_view','navigation',NULL,NULL,'/products','Products',NULL,NULL,'desktop','Chrome',NULL,NULL,'google','organic',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-08 19:41:42'),(3,2,'sess_002','page_view','product_view','product',NULL,NULL,'/products/cellular-shades','Cellular Shades',NULL,1,'mobile','Safari',NULL,NULL,'facebook','social',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-07 19:41:42'),(4,NULL,'sess_003','page_view','page_view','navigation',NULL,NULL,'/','Home Page',NULL,NULL,'desktop','Firefox',NULL,NULL,'direct','none',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-06 19:41:42'),(5,2,'sess_002','engagement','add_to_cart','product',NULL,NULL,'/products/cellular-shades','Cellular Shades',NULL,1,'mobile','Safari',NULL,NULL,'facebook','social',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-07 19:41:42'),(6,3,'sess_004','page_view','product_view','product',NULL,NULL,'/products/roller-shades','Roller Shades',NULL,2,'tablet','Chrome',NULL,NULL,'google','organic',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-05 19:41:42'),(7,3,'sess_004','engagement','add_to_cart','product',NULL,NULL,'/products/roller-shades','Roller Shades',NULL,2,'tablet','Chrome',NULL,NULL,'google','organic',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-05 19:41:42'),(8,2,'sess_002','conversion','begin_checkout','checkout',NULL,NULL,'/checkout','Checkout',NULL,NULL,'mobile','Safari',NULL,NULL,'facebook','social',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-07 19:41:42'),(9,2,'sess_002','conversion','purchase','checkout',NULL,NULL,'/checkout/success','Order Complete',NULL,NULL,'mobile','Safari',NULL,NULL,'facebook','social',NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'2025-06-07 19:41:42');
/*!40000 ALTER TABLE `analytics_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_product_performance`
--

DROP TABLE IF EXISTS `analytics_product_performance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_product_performance` (
  `performance_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `date` date NOT NULL,
  `views` int DEFAULT '0',
  `unique_views` int DEFAULT '0',
  `cart_adds` int DEFAULT '0',
  `purchases` int DEFAULT '0',
  `revenue` decimal(12,2) DEFAULT '0.00',
  `avg_price` decimal(10,2) DEFAULT '0.00',
  `view_to_cart_rate` decimal(5,2) DEFAULT '0.00',
  `cart_to_purchase_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`performance_id`),
  UNIQUE KEY `unique_product_date` (`product_id`,`date`),
  KEY `idx_performance_date` (`date`),
  KEY `idx_performance_views` (`views`),
  KEY `idx_performance_revenue` (`revenue`),
  CONSTRAINT `fk_analytics_performance_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_product_performance`
--

LOCK TABLES `analytics_product_performance` WRITE;
/*!40000 ALTER TABLE `analytics_product_performance` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_product_performance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_sessions`
--

DROP TABLE IF EXISTS `analytics_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_sessions` (
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_start` timestamp NOT NULL,
  `session_end` timestamp NULL DEFAULT NULL,
  `session_duration` int DEFAULT NULL,
  `page_views` int DEFAULT '0',
  `events_count` int DEFAULT '0',
  `is_bounce` tinyint(1) DEFAULT '0',
  `landing_page` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referrer` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` enum('desktop','mobile','tablet') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_start` (`session_start`),
  KEY `idx_sessions_device` (`device_type`),
  KEY `idx_sessions_source` (`utm_source`),
  KEY `idx_sessions_date_range` (`session_start`,`session_end`),
  CONSTRAINT `fk_analytics_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_sessions`
--

LOCK TABLES `analytics_sessions` WRITE;
/*!40000 ALTER TABLE `analytics_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `available_samples`
--

DROP TABLE IF EXISTS `available_samples`;
/*!50001 DROP VIEW IF EXISTS `available_samples`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `available_samples` AS SELECT 
 1 AS `swatch_id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `color_code`,
 1 AS `material_name`,
 1 AS `material_type`,
 1 AS `category_id`,
 1 AS `category_name`,
 1 AS `sample_fee`,
 1 AS `is_premium`,
 1 AS `image_url`,
 1 AS `opacity_level`,
 1 AS `light_filtering_percentage`,
 1 AS `care_instructions`,
 1 AS `available_stock`,
 1 AS `is_in_stock`,
 1 AS `average_rating`,
 1 AS `review_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bottom_rail_options`
--

DROP TABLE IF EXISTS `bottom_rail_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bottom_rail_options` (
  `bottom_rail_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `material` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_options` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `weight_options` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `compatibility_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`bottom_rail_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bottom_rail_options`
--

LOCK TABLES `bottom_rail_options` WRITE;
/*!40000 ALTER TABLE `bottom_rail_options` DISABLE KEYS */;
INSERT INTO `bottom_rail_options` VALUES (1,'Fabric Wrapped','Bottom rail wrapped in matching fabric','Aluminum with Fabric',NULL,NULL,NULL,1,'2025-06-17 16:56:50','2025-06-17 16:56:50'),(2,'Just a Rail','Standard aluminum bottom rail','Aluminum',NULL,NULL,NULL,1,'2025-06-17 16:56:50','2025-06-17 16:56:50'),(3,'Weighted Rail','Heavy-duty weighted bottom rail for better draping','Steel',NULL,NULL,NULL,1,'2025-06-17 16:56:50','2025-06-17 16:56:50');
/*!40000 ALTER TABLE `bottom_rail_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_order_items`
--

DROP TABLE IF EXISTS `bulk_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_order_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `upload_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `csv_row_number` int NOT NULL,
  `room_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blind_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `width_inches` decimal(6,2) DEFAULT NULL,
  `height_inches` decimal(6,2) DEFAULT NULL,
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mount_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(8,2) DEFAULT NULL,
  `line_total` decimal(10,2) DEFAULT NULL,
  `installation_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `preferred_install_date` date DEFAULT NULL,
  `room_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `special_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urgency_level` enum('Low','Standard','High','Urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Standard',
  `budget_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `building_floor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `window_orientation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_identifier` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_scheme` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `building_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `target_completion_date` date DEFAULT NULL,
  `room_function` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `privacy_level` enum('Low','Medium','High','Maximum') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_control_preference` enum('Light Filtering','Room Darkening','Blackout','Sheer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `energy_efficiency_rating` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maintenance_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `warranty_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installation_priority` enum('Low','Medium','High','Critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget_allocation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_valid` tinyint(1) NOT NULL DEFAULT '1',
  `validation_errors` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `idx_upload_items` (`upload_id`),
  KEY `idx_item_validation` (`is_valid`),
  KEY `idx_blind_type` (`blind_type`),
  KEY `idx_room_type` (`room_type`),
  CONSTRAINT `fk_bulk_item_upload` FOREIGN KEY (`upload_id`) REFERENCES `customer_bulk_uploads` (`upload_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_order_items`
--

LOCK TABLES `bulk_order_items` WRITE;
/*!40000 ALTER TABLE `bulk_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulk_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_order_processing`
--

DROP TABLE IF EXISTS `bulk_order_processing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_order_processing` (
  `process_id` int NOT NULL AUTO_INCREMENT,
  `upload_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `processing_stage` enum('pending','pricing','review','approved','manufacturing','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `assigned_processor` int DEFAULT NULL,
  `estimated_completion_date` date DEFAULT NULL,
  `actual_completion_date` date DEFAULT NULL,
  `total_estimated_amount` decimal(12,2) DEFAULT NULL,
  `final_amount` decimal(12,2) DEFAULT NULL,
  `bulk_discount_percentage` decimal(5,2) DEFAULT '0.00',
  `bulk_discount_amount` decimal(10,2) DEFAULT '0.00',
  `processing_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `customer_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `approval_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`process_id`),
  KEY `idx_processing_stage` (`processing_stage`),
  KEY `idx_assigned_processor` (`assigned_processor`),
  KEY `idx_customer_processing` (`customer_id`,`processing_stage`),
  KEY `idx_completion_dates` (`estimated_completion_date`,`actual_completion_date`),
  KEY `fk_processing_upload` (`upload_id`),
  CONSTRAINT `fk_processing_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_processing_processor` FOREIGN KEY (`assigned_processor`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processing_upload` FOREIGN KEY (`upload_id`) REFERENCES `customer_bulk_uploads` (`upload_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_order_processing`
--

LOCK TABLES `bulk_order_processing` WRITE;
/*!40000 ALTER TABLE `bulk_order_processing` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulk_order_processing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_product_jobs`
--

DROP TABLE IF EXISTS `bulk_product_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_product_jobs` (
  `job_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` int NOT NULL,
  `operation_type` enum('import','export','update') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','completed','failed','completed_with_errors') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_records` int DEFAULT '0',
  `processed_records` int DEFAULT '0',
  `success_count` int DEFAULT '0',
  `error_count` int DEFAULT '0',
  `errors` json DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`job_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `bulk_product_jobs_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_product_jobs`
--

LOCK TABLES `bulk_product_jobs` WRITE;
/*!40000 ALTER TABLE `bulk_product_jobs` DISABLE KEYS */;
INSERT INTO `bulk_product_jobs` VALUES ('16c128de-ad7b-4277-92fa-528c28391515',9,'import','failed','test-bulk-upload-fixed.csv',2,0,0,0,NULL,'Unknown column \'is_active\' in \'where clause\'','2025-06-23 16:56:29','2025-06-23 16:56:29','2025-06-23 16:56:29'),('7c5c9599-95d1-4b9b-b03d-5ee53c5e392c',9,'import','failed','test-bulk-upload.csv',3,0,0,0,NULL,'Unknown column \'is_active\' in \'where clause\'','2025-06-23 16:45:10','2025-06-23 16:45:10','2025-06-23 16:45:10');
/*!40000 ALTER TABLE `bulk_product_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_analytics`
--

DROP TABLE IF EXISTS `cart_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_analytics` (
  `analytics_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` enum('item_added','item_removed','quantity_changed','saved_for_later','moved_to_cart','shared','abandoned','converted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int DEFAULT NULL,
  `previous_value` json DEFAULT NULL COMMENT 'Previous state before action',
  `new_value` json DEFAULT NULL COMMENT 'New state after action',
  `page_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`analytics_id`),
  KEY `idx_cart_analytics_cart` (`cart_id`),
  KEY `idx_cart_analytics_user` (`user_id`),
  KEY `idx_cart_analytics_action` (`action_type`),
  KEY `idx_cart_analytics_timestamp` (`timestamp`),
  CONSTRAINT `fk_cart_analytics_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_analytics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_analytics`
--

LOCK TABLES `cart_analytics` WRITE;
/*!40000 ALTER TABLE `cart_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_coupons`
--

DROP TABLE IF EXISTS `cart_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_coupons` (
  `cart_coupon_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `coupon_id` int NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_coupon_id`),
  UNIQUE KEY `unique_cart_coupon` (`cart_id`,`coupon_id`),
  KEY `idx_cart_id` (`cart_id`),
  KEY `idx_coupon_id` (`coupon_id`),
  CONSTRAINT `cart_coupons_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupon_codes` (`coupon_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_coupons`
--

LOCK TABLES `cart_coupons` WRITE;
/*!40000 ALTER TABLE `cart_coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_item_shipping`
--

DROP TABLE IF EXISTS `cart_item_shipping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item_shipping` (
  `shipping_id` int NOT NULL AUTO_INCREMENT,
  `cart_item_id` int NOT NULL,
  `address_id` int NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `shipping_method` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `special_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`shipping_id`),
  KEY `idx_cart_item_shipping` (`cart_item_id`),
  KEY `idx_shipping_address` (`address_id`),
  CONSTRAINT `fk_cart_shipping_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_shipping_item` FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items` (`cart_item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item_shipping`
--

LOCK TABLES `cart_item_shipping` WRITE;
/*!40000 ALTER TABLE `cart_item_shipping` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_item_shipping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `configuration` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `saved_for_later` tinyint(1) DEFAULT '0',
  `price_at_add` decimal(10,2) DEFAULT NULL COMMENT 'Price when item was added to track changes',
  `expiry_date` timestamp NULL DEFAULT NULL COMMENT 'When cart item expires',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Customer notes for this item',
  `is_gift` tinyint(1) DEFAULT '0',
  `gift_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `scheduled_delivery_date` date DEFAULT NULL,
  `installation_requested` tinyint(1) DEFAULT '0',
  `sample_requested` tinyint(1) DEFAULT '0',
  `configuration_price` decimal(10,2) DEFAULT '0.00' COMMENT 'Additional price from product configuration options',
  `material_surcharge` decimal(10,2) DEFAULT '0.00' COMMENT 'Additional charge for premium materials',
  `seasonal_discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Amount discounted from seasonal promotions per item',
  PRIMARY KEY (`cart_item_id`),
  KEY `cart_id` (`cart_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,1,243,1,'{\"name\": \"Vendor A Roller Shade\", \"slug\": \"vendor-a-roller-shade\", \"image\": \"/uploads/products/product_243_1750195341922_b337o93yu6.png\", \"width\": \"34\", \"height\": \"70\", \"cart_id\": 0, \"quantity\": 1, \"roomType\": \"Bathroom\", \"mountType\": \"inside\", \"fabricName\": \"Test Fabric 2\", \"fabricType\": \"84\", \"liftSystem\": \"\", \"product_id\": 243, \"totalPrice\": 267.99, \"unit_price\": 267.99, \"colorOption\": \"\", \"controlType\": \"basic-remote\", \"cart_item_id\": 1750621961045, \"fabricOption\": \"\", \"controlOption\": \"basic-remote\", \"valanceOption\": \"square-without\", \"widthFraction\": \"0\", \"heightFraction\": \"0\", \"bottomRailOption\": \"fabric-wrapped\"}','2025-06-22 19:52:41','2025-06-22 19:52:41',0,267.99,NULL,NULL,0,NULL,NULL,0,0,0.00,0.00,0.00),(2,1,243,1,'{\"name\": \"Vendor A Roller Shade\", \"slug\": \"vendor-a-roller-shade\", \"image\": \"/uploads/products/product_243_1750195341922_b337o93yu6.png\", \"width\": \"34\", \"height\": \"70\", \"cart_id\": 0, \"quantity\": 1, \"roomType\": \"Bathroom\", \"mountType\": \"inside\", \"fabricName\": \"Test Fabric 2\", \"fabricType\": \"84\", \"liftSystem\": \"\", \"product_id\": 243, \"totalPrice\": 267.99, \"unit_price\": 267.99, \"colorOption\": \"\", \"controlType\": \"continuous-loop\", \"cart_item_id\": 1750621980239, \"fabricOption\": \"\", \"controlOption\": \"continuous-loop\", \"valanceOption\": \"square-without\", \"widthFraction\": \"0\", \"heightFraction\": \"0\", \"bottomRailOption\": \"fabric-wrapped\"}','2025-06-22 19:53:00','2025-06-22 19:53:00',0,267.99,NULL,NULL,0,NULL,NULL,0,0,0.00,0.00,0.00),(3,1,243,1,'{\"name\": \"Vendor A Roller Shade\", \"slug\": \"vendor-a-roller-shade\", \"image\": \"/uploads/products/product_243_1750195341922_b337o93yu6.png\", \"width\": \"60\", \"height\": \"70\", \"cart_id\": 0, \"quantity\": 1, \"roomType\": \"Bathroom\", \"mountType\": \"inside\", \"fabricName\": \"Test Fabric 1\", \"fabricType\": \"85\", \"liftSystem\": \"\", \"product_id\": 243, \"totalPrice\": 449.99, \"unit_price\": 449.99, \"colorOption\": \"\", \"controlType\": \"string-lift\", \"cart_item_id\": 1750622002473, \"fabricOption\": \"\", \"controlOption\": \"string-lift\", \"valanceOption\": \"square-without\", \"widthFraction\": \"0\", \"heightFraction\": \"0\", \"bottomRailOption\": \"fabric-wrapped\"}','2025-06-22 19:53:22','2025-06-22 19:53:22',0,449.99,NULL,NULL,0,NULL,NULL,0,0,0.00,0.00,0.00);
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_promotions`
--

DROP TABLE IF EXISTS `cart_promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_promotions` (
  `promotion_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `promotion_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `promotion_type` enum('percentage','fixed_amount','free_shipping','bundle_discount','loyalty_discount') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `conditions` json DEFAULT NULL COMMENT 'Conditions that triggered this promotion',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`promotion_id`),
  KEY `idx_cart_promotions` (`cart_id`),
  KEY `idx_promotion_code` (`promotion_code`),
  KEY `idx_promotion_type` (`promotion_type`),
  CONSTRAINT `fk_cart_promotions_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_promotions`
--

LOCK TABLES `cart_promotions` WRITE;
/*!40000 ALTER TABLE `cart_promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_vendor_discounts`
--

DROP TABLE IF EXISTS `cart_vendor_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_vendor_discounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `discount_id` int DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `discount_type` enum('automatic','coupon') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_to_items` json NOT NULL COMMENT 'Array of cart_item_ids and their discount amounts',
  `subtotal_before` decimal(10,2) NOT NULL,
  `subtotal_after` decimal(10,2) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_vendor_discount` (`cart_id`,`vendor_id`,`discount_type`,`discount_code`),
  KEY `idx_cart_vendor_discounts` (`cart_id`,`vendor_id`),
  KEY `fk_cart_discount_vendor` (`vendor_id`),
  KEY `fk_cart_discount_discount` (`discount_id`),
  KEY `fk_cart_discount_coupon` (`coupon_id`),
  CONSTRAINT `fk_cart_discount_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `vendor_coupons` (`coupon_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_discount` FOREIGN KEY (`discount_id`) REFERENCES `vendor_discounts` (`discount_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_discount_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_vendor_discounts`
--

LOCK TABLES `cart_vendor_discounts` WRITE;
/*!40000 ALTER TABLE `cart_vendor_discounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_vendor_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','abandoned','converted') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,3,NULL,'active','2025-06-22 19:52:06','2025-06-22 19:52:06'),(2,14,NULL,'active','2025-06-23 16:16:47','2025-06-23 16:16:47');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `featured` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Shades','shades','Shades Blinds offer a sleek and stylish way to control light and privacy. Ideal for creating a soft, modern ambiance in any room.','/images/placeholder.jpg','2025-01-12 21:18:38','2025-07-01 03:25:51',1,1),(2,'Roller Shades','roller-shades','Modern roller shades for any room','','2025-01-12 21:29:20','2025-06-16 21:38:05',1,2),(3,'Roman Shades','roman-shades','Roman Shades combine the softness of drapery with the functionality of blinds. They add a classic, elegant touch to any room décor.',NULL,'2025-01-14 23:10:32','2025-07-01 03:26:03',1,3),(4,'Motorized Blinds','motorized','<p>Motorized Blinds bring modern convenience to your space with remote-controlled operation. Perfect for hard-to-reach windows and smart home integration.</p>',NULL,'2025-01-14 23:13:08','2025-06-19 18:53:38',0,4),(5,'Remote Control','remote-control','<p>This is a&nbsp;Remote Control blinds take hassel of pulling strings.</p>',NULL,'2025-02-20 22:08:56','2025-06-19 18:53:44',0,5),(6,'Vinyl Blinds','vinyl-blinds','Vinyl Blinds are a durable and cost-effective window treatment, perfect for everyday use. They offer easy maintenance and excellent light control for any space.',NULL,'2025-02-24 22:33:50','2025-06-30 23:33:17',0,6),(7,'Fabric Blinds','fabric-blinds','<p>Fabric Blinds add a soft, elegant touch to your windows while providing privacy and light control. Available in various colors and textures to suit any décor.</p>','','2025-02-24 22:34:26','2025-04-26 22:55:03',1,7),(8,'Wand Control','wand-control','Wand Control',NULL,'2025-04-19 22:05:53','2025-06-19 18:53:51',0,8),(9,'Commercial Blinds','commercial-blinds','<p>Commercial Blinds offer durable and functional window solutions ideal for offices, retail, and industrial spaces. Designed for performance, privacy, and professional aesthetics.</p>',NULL,'2025-04-19 22:14:10','2025-06-30 23:33:24',0,9),(11,'Bamboo / Woven Wood Shades','bamboo-woven-wood-shades','<p>Bamboo or Woven Wood Shades bring a natural, earthy texture to any space. Crafted from sustainable materials, they offer a warm, organic look while gently filtering light.</p>',NULL,'2025-04-19 22:20:45','2025-06-19 18:53:58',0,11),(12,'Sheer Shades','sheer-shades','<p>Sheer Shades combine the softness of fabric with the functionality of blinds. These shades allow natural light to filter through while providing privacy and a sleek, modern appearance.</p>','','2025-04-19 22:21:30','2025-04-19 22:21:30',1,12),(13,'Zebra Shades','zebra-shades','<p>Zebra Shades offer a stylish and versatile window treatment with alternating sheer and solid fabric stripes. These shades allow for precise light control while enhancing the aesthetic of any room.</p>','','2025-04-19 22:22:08','2025-04-19 22:22:08',1,13),(14,'Pleated Shades','pleated-shades','<p>Pleated Shades provide a sleek, modern look with crisp, pleated fabric that adds texture and style to your windows. They offer excellent light control and insulation, making them both functional and decorative.</p>',NULL,'2025-04-19 22:22:43','2025-06-19 18:54:04',0,14),(15,'Outdoor Shades','outdoor-shades','<p>Outdoor Shades are designed to block the sun while enhancing your outdoor living spaces. They provide privacy, reduce glare, and help regulate temperature, making them ideal for patios, decks, and pergolas.</p>','','2025-04-19 22:23:14','2025-04-19 22:23:14',1,15),(16,'Motorized Shades','motorized-shades','<p>Motorized Shades offer effortless control with a touch of a button, providing convenience and luxury to your windows. Perfect for hard-to-reach windows, they enhance comfort and privacy while offering a modern, sleek aesthetic.</p>','','2025-04-19 22:23:46','2025-04-26 22:56:01',1,16),(17,'Vertical Cellular Shades','vertical-cellular-shades','<p>Vertical Cellular Shades combine the elegance of vertical blinds with the energy efficiency of honeycomb design. These shades provide excellent insulation while allowing light control and privacy in large windows or sliding doors.</p>',NULL,'2025-04-19 22:27:43','2025-06-30 23:33:07',0,17),(18,'Sheer Vertical Shades','sheer-vertical-shades','<p>Sheer Vertical Shades offer a stylish combination of light control and privacy with their sheer fabric panels. Ideal for large windows or sliding doors, they allow natural light to filter through while providing a soft, elegant appearance.</p>','','2025-04-19 22:28:15','2025-04-19 22:28:15',1,18),(19,'Panel Track Blinds','panel-track-blinds','<p>Panel Track Blinds provide a sleek, modern solution for covering large windows or sliding doors. Their wide fabric panels glide smoothly along a track, offering excellent light control and a contemporary look for any room.</p>',NULL,'2025-04-19 22:28:46','2025-06-19 18:54:48',0,19),(21,'Cellular Shades','cellular-shades','Energy-efficient honeycomb shades',NULL,'2025-06-16 21:38:05','2025-06-19 18:52:30',1,1),(22,'Smart Blinds','smart-blinds','Motorized and smart home compatible blinds','/uploads/categories/category_1_1750360024253_zjwlhs5oxj.jpg','2025-06-16 21:38:05','2025-06-19 19:07:07',1,1),(23,'Venetian Blinds','venetian-blinds','Classic horizontal slat blinds',NULL,'2025-06-16 21:38:05','2025-06-16 21:38:05',0,0),(24,'Vertical Blinds','vertical-blinds','Vertical slat blinds for large windows',NULL,'2025-06-16 21:38:05','2025-06-16 21:38:05',0,0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`message_id`),
  KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,3,'Hello test','text','2025-06-23 16:07:22',0),(2,1,3,'Can you help me with choosing blinds?','text','2025-06-23 16:08:03',0),(3,2,3,'bhkhl','text','2025-06-25 04:08:55',0);
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `session_type` enum('support','consultation','sales') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'support',
  `status` enum('active','ended','waiting') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `expert_id` (`sales_staff_id`),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `chat_sessions_ibfk_2` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
INSERT INTO `chat_sessions` VALUES (1,3,NULL,'support','waiting','2025-06-23 16:07:22',NULL,NULL,NULL),(2,3,NULL,'support','waiting','2025-06-25 04:08:55',NULL,NULL,NULL);
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colors`
--

DROP TABLE IF EXISTS `colors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colors` (
  `color_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hex_code` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_family` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`color_id`),
  UNIQUE KEY `name` (`name`),
  KEY `color_family` (`color_family`),
  KEY `is_popular` (`is_popular`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colors`
--

LOCK TABLES `colors` WRITE;
/*!40000 ALTER TABLE `colors` DISABLE KEYS */;
INSERT INTO `colors` VALUES (1,'Classic White','#FFFFFF','whites',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(2,'Ivory','#FFFFF0','whites',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(3,'Beige','#F5F5DC','neutrals',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(4,'Light Gray','#D3D3D3','grays',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(5,'Charcoal','#36454F','grays',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(6,'Navy Blue','#000080','blues',0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05');
/*!40000 ALTER TABLE `colors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_calculations`
--

DROP TABLE IF EXISTS `commission_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_calculations` (
  `calculation_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `vendor_id` int DEFAULT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `order_amount` decimal(10,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `rule_id` int NOT NULL,
  `rule_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','paid','disputed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `payment_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calculated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`calculation_id`),
  UNIQUE KEY `unique_order_commission` (`order_id`,`vendor_id`,`sales_staff_id`),
  KEY `fk_commission_calc_rule` (`rule_id`),
  KEY `idx_vendor_commissions` (`vendor_id`,`payment_status`),
  KEY `idx_sales_commissions` (`sales_staff_id`,`payment_status`),
  KEY `idx_payment_status` (`payment_status`,`payment_date`),
  CONSTRAINT `fk_commission_calc_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_commission_calc_rule` FOREIGN KEY (`rule_id`) REFERENCES `commission_rules` (`rule_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_commission_calc_sales` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_commission_calc_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_calculations`
--

LOCK TABLES `commission_calculations` WRITE;
/*!40000 ALTER TABLE `commission_calculations` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_disputes`
--

DROP TABLE IF EXISTS `commission_disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_disputes` (
  `dispute_id` int NOT NULL AUTO_INCREMENT,
  `commission_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `dispute_type` enum('amount','payment_delay','order_issue','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_status` enum('open','under_review','resolved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `vendor_evidence` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `admin_response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `resolution_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `disputed_amount` decimal(10,2) DEFAULT NULL,
  `resolved_amount` decimal(10,2) DEFAULT NULL,
  `created_by` int NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`dispute_id`),
  KEY `idx_commission_disputes` (`commission_id`),
  KEY `idx_vendor_disputes` (`vendor_id`,`dispute_status`),
  KEY `idx_dispute_status` (`dispute_status`),
  KEY `idx_assigned_disputes` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_disputes`
--

LOCK TABLES `commission_disputes` WRITE;
/*!40000 ALTER TABLE `commission_disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_payments`
--

DROP TABLE IF EXISTS `commission_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `order_count` int NOT NULL,
  `payment_method` enum('bank_transfer','check','paypal','stripe','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_reference` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `processed_by` int NOT NULL,
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `failure_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `fk_commission_payment_processor` (`processed_by`),
  KEY `idx_vendor_payments` (`vendor_id`,`period_start`,`period_end`),
  KEY `idx_sales_payments` (`sales_staff_id`,`period_start`,`period_end`),
  KEY `idx_payment_status` (`status`,`processed_at`),
  CONSTRAINT `fk_commission_payment_processor` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_commission_payment_sales` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_commission_payment_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_payments`
--

LOCK TABLES `commission_payments` WRITE;
/*!40000 ALTER TABLE `commission_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_rules`
--

DROP TABLE IF EXISTS `commission_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_rules` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('vendor','sales_staff','category','product','global') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int DEFAULT NULL COMMENT 'ID of vendor, sales staff, category, or product',
  `commission_type` enum('percentage','fixed_amount','tiered') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_value` decimal(8,2) NOT NULL COMMENT 'Percentage or fixed amount',
  `minimum_sale_amount` decimal(10,2) DEFAULT '0.00',
  `maximum_commission_amount` decimal(10,2) DEFAULT NULL,
  `tiers` json DEFAULT NULL COMMENT 'Array of {min_amount, max_amount, commission_percent, commission_amount}',
  `is_default` tinyint(1) DEFAULT '0' COMMENT 'Default rule when no specific rule applies',
  `priority` int DEFAULT '100',
  `valid_from` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`),
  KEY `fk_commission_rule_creator` (`created_by`),
  KEY `idx_applies_to` (`applies_to`,`target_id`),
  KEY `idx_default_rules` (`is_default`,`priority`),
  KEY `idx_active_rules` (`is_active`,`valid_from`,`valid_until`),
  CONSTRAINT `fk_commission_rule_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_rules`
--

LOCK TABLES `commission_rules` WRITE;
/*!40000 ALTER TABLE `commission_rules` DISABLE KEYS */;
INSERT INTO `commission_rules` VALUES (1,'Default Vendor Commission','vendor',NULL,'percentage',15.00,0.00,NULL,NULL,1,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(2,'Default Sales Commission','sales_staff',NULL,'percentage',5.00,0.00,NULL,NULL,1,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(3,'High-Volume Vendor Tier','vendor',NULL,'tiered',0.00,0.00,NULL,'[{\"max_amount\": 5000, \"min_amount\": 0, \"commission_percent\": 10.0}, {\"max_amount\": 15000, \"min_amount\": 5001, \"commission_percent\": 15.0}, {\"max_amount\": 50000, \"min_amount\": 15001, \"commission_percent\": 20.0}, {\"max_amount\": null, \"min_amount\": 50001, \"commission_percent\": 25.0}]',0,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(4,'Premium Sales Tier','sales_staff',NULL,'tiered',0.00,0.00,NULL,'[{\"max_amount\": 2000, \"min_amount\": 0, \"commission_percent\": 3.0}, {\"max_amount\": 10000, \"min_amount\": 2001, \"commission_percent\": 5.0}, {\"max_amount\": 25000, \"min_amount\": 10001, \"commission_percent\": 7.0}, {\"max_amount\": null, \"min_amount\": 25001, \"commission_percent\": 10.0}]',0,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:04:09','2025-06-10 22:04:09'),(5,'Default Vendor Commission','vendor',NULL,'percentage',15.00,0.00,NULL,NULL,1,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25'),(6,'Default Sales Commission','sales_staff',NULL,'percentage',5.00,0.00,NULL,NULL,1,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25'),(7,'High-Volume Vendor Tier','vendor',NULL,'tiered',0.00,0.00,NULL,'[{\"max_amount\": 5000, \"min_amount\": 0, \"commission_percent\": 10.0}, {\"max_amount\": 15000, \"min_amount\": 5001, \"commission_percent\": 15.0}, {\"max_amount\": 50000, \"min_amount\": 15001, \"commission_percent\": 20.0}, {\"max_amount\": null, \"min_amount\": 50001, \"commission_percent\": 25.0}]',0,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25'),(8,'Premium Sales Tier','sales_staff',NULL,'tiered',0.00,0.00,NULL,'[{\"max_amount\": 2000, \"min_amount\": 0, \"commission_percent\": 3.0}, {\"max_amount\": 10000, \"min_amount\": 2001, \"commission_percent\": 5.0}, {\"max_amount\": 25000, \"min_amount\": 10001, \"commission_percent\": 7.0}, {\"max_amount\": null, \"min_amount\": 25001, \"commission_percent\": 10.0}]',0,100,'2025-06-10',NULL,1,1,NULL,'2025-06-10 22:06:25','2025-06-10 22:06:25');
/*!40000 ALTER TABLE `commission_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `idx_public` (`is_public`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_settings`
--

LOCK TABLES `company_settings` WRITE;
/*!40000 ALTER TABLE `company_settings` DISABLE KEYS */;
INSERT INTO `company_settings` VALUES (1,'company_name','Smart Blinds Hub','string','company','Company name',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(2,'contact_email','support@smartblindshub.com','string','contact','Main contact email',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(3,'contact_phone','+1 (316) 123-4567','string','contact','Main contact phone',1,'2025-06-21 02:41:15','2025-06-28 06:57:15'),(4,'company_address','15326 Old Redmond Rd, Redmond,WA 98052','string','company','Company address',1,'2025-06-21 02:41:15','2025-06-28 06:57:15'),(5,'emergency_hotline','+1 (316) 123-4567','string','contact','Emergency hotline',1,'2025-06-21 02:41:15','2025-06-28 06:57:15'),(6,'sales_email','sales@smartblindshub.com','string','contact','Sales email',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(7,'info_email','info@smartblindshub.com','string','contact','Info email',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(8,'website_url','https://smartblindshub.com','string','company','Company website',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(9,'tax_rate','8.25','number','financial','Default tax rate percentage',0,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(10,'commission_rate','15.0','number','financial','Default commission rate percentage',0,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(11,'payment_processing_fee','2.9','number','financial','Payment processing fee percentage',0,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(12,'minimum_order','25.00','number','financial','Minimum order amount',0,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(13,'free_shipping_threshold','100.00','number','financial','Free shipping threshold',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(14,'basic_shipping_cost','9.99','number','shipping','Basic shipping cost',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(15,'business_hours','{\"monday\": \"8:00 AM - 6:00 PM\", \"tuesday\": \"8:00 AM - 6:00 PM\", \"wednesday\": \"8:00 AM - 6:00 PM\", \"thursday\": \"8:00 AM - 6:00 PM\", \"friday\": \"8:00 AM - 6:00 PM\", \"saturday\": \"9:00 AM - 4:00 PM\", \"sunday\": \"Closed\"}','json','company','Business hours',1,'2025-06-21 02:41:15','2025-06-21 02:41:15'),(16,'hero_slide_1_title','Transform Your Space with Premium Blinds','string','homepage','First hero slide title',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(17,'hero_slide_1_description','Discover our collection of custom blinds and shades','string','homepage','First hero slide description',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(18,'hero_slide_1_cta','Shop Now','string','homepage','First hero slide call to action',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(19,'hero_slide_2_title','Free Shipping on Orders Over $100','string','homepage','Second hero slide title',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(20,'hero_slide_2_description','Get your custom window treatments delivered free','string','homepage','Second hero slide description',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(21,'hero_slide_2_cta','Learn More','string','homepage','Second hero slide call to action',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(22,'hero_slide_3_title','Save Up to 40% Off','string','homepage','Third hero slide title',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(23,'hero_slide_3_description','Limited time offer on select window treatments','string','homepage','Third hero slide description',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(24,'hero_slide_3_cta','Shop Sale','string','homepage','Third hero slide call to action',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(25,'promo_banner_1','Free Shipping on orders over $100','string','promotions','First promotional banner text',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(26,'promo_banner_2','Extra 20% off Cellular Shades','string','promotions','Second promotional banner text',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(27,'promo_banner_3','Free Cordless Upgrade','string','promotions','Third promotional banner text',1,'2025-06-21 02:42:40','2025-06-21 02:42:40'),(28,'email_notifications','true','boolean','notifications',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13'),(29,'sms_notifications','false','boolean','notifications',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13'),(30,'two_factor_required','false','boolean','security',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13'),(31,'password_expiry_days','90','number','security',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13'),(32,'google_analytics_id','','string','integrations',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13'),(33,'smtp_server','smtp.smartblindshub.com','string','integrations',NULL,0,'2025-06-28 06:55:13','2025-06-28 06:55:13');
/*!40000 ALTER TABLE `company_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_availability`
--

DROP TABLE IF EXISTS `consultation_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_availability` (
  `availability_id` bigint NOT NULL AUTO_INCREMENT,
  `consultant_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_type` enum('measurement','installation','design','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  KEY `idx_consultant` (`consultant_id`),
  KEY `idx_day_time` (`day_of_week`,`start_time`,`end_time`),
  CONSTRAINT `consultation_availability_ibfk_1` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_availability`
--

LOCK TABLES `consultation_availability` WRITE;
/*!40000 ALTER TABLE `consultation_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_bookings`
--

DROP TABLE IF EXISTS `consultation_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `slot_id` int DEFAULT NULL,
  `consultation_type` enum('virtual','in-home','phone') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'virtual',
  `status` enum('scheduled','confirmed','completed','cancelled','rescheduled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `duration_minutes` int DEFAULT '60',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `confirmation_sent` tinyint(1) DEFAULT '0',
  `reminder_sent` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `user_id` (`user_id`),
  KEY `expert_id` (`sales_staff_id`),
  KEY `slot_id` (`slot_id`),
  CONSTRAINT `consultation_bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `consultation_bookings_ibfk_2` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE SET NULL,
  CONSTRAINT `consultation_bookings_ibfk_3` FOREIGN KEY (`slot_id`) REFERENCES `consultation_slots` (`slot_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_bookings`
--

LOCK TABLES `consultation_bookings` WRITE;
/*!40000 ALTER TABLE `consultation_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_details`
--

DROP TABLE IF EXISTS `consultation_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_details` (
  `detail_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `window_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `window_measurements` json DEFAULT NULL,
  `product_interest` json DEFAULT NULL,
  `design_preferences` json DEFAULT NULL,
  `budget_range` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `measurement_photos` json DEFAULT NULL,
  `room_photos` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`detail_id`),
  KEY `idx_consultation` (`consultation_id`),
  CONSTRAINT `consultation_details_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_details`
--

LOCK TABLES `consultation_details` WRITE;
/*!40000 ALTER TABLE `consultation_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_history`
--

DROP TABLE IF EXISTS `consultation_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_history` (
  `history_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `action_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_consultation_history` (`consultation_id`),
  CONSTRAINT `consultation_history_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`),
  CONSTRAINT `consultation_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_history`
--

LOCK TABLES `consultation_history` WRITE;
/*!40000 ALTER TABLE `consultation_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_messages`
--

DROP TABLE IF EXISTS `consultation_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_messages` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_consultation_messages` (`consultation_id`),
  CONSTRAINT `consultation_messages_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`),
  CONSTRAINT `consultation_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_messages`
--

LOCK TABLES `consultation_messages` WRITE;
/*!40000 ALTER TABLE `consultation_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_notes`
--

DROP TABLE IF EXISTS `consultation_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_notes` (
  `note_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `note_type` enum('measurement','recommendation','follow_up','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachments` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`),
  KEY `idx_consultation` (`consultation_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `consultation_notes_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`) ON DELETE CASCADE,
  CONSTRAINT `consultation_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_notes`
--

LOCK TABLES `consultation_notes` WRITE;
/*!40000 ALTER TABLE `consultation_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_ratings`
--

DROP TABLE IF EXISTS `consultation_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_ratings` (
  `rating_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `unique_consultation_rating` (`consultation_id`,`user_id`),
  KEY `idx_consultation` (`consultation_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `consultation_ratings_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`) ON DELETE CASCADE,
  CONSTRAINT `consultation_ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `consultation_ratings_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_ratings`
--

LOCK TABLES `consultation_ratings` WRITE;
/*!40000 ALTER TABLE `consultation_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_recommendations`
--

DROP TABLE IF EXISTS `consultation_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_recommendations` (
  `recommendation_id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `consultant_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `recommendation_type` enum('product','style','measurement','installation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `specifications` json DEFAULT NULL,
  `priority` enum('high','medium','low') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recommendation_id`),
  KEY `idx_consultation` (`consultation_id`),
  KEY `idx_consultant` (`consultant_id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `consultation_recommendations_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`) ON DELETE CASCADE,
  CONSTRAINT `consultation_recommendations_ibfk_2` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `consultation_recommendations_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_recommendations`
--

LOCK TABLES `consultation_recommendations` WRITE;
/*!40000 ALTER TABLE `consultation_recommendations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_recommendations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_slots`
--

DROP TABLE IF EXISTS `consultation_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `sales_staff_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `max_bookings` int DEFAULT '1',
  `current_bookings` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `expert_date_time` (`sales_staff_id`,`date`,`start_time`),
  KEY `expert_id` (`sales_staff_id`),
  CONSTRAINT `consultation_slots_ibfk_1` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_slots`
--

LOCK TABLES `consultation_slots` WRITE;
/*!40000 ALTER TABLE `consultation_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `consultation_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `consultant_id` int DEFAULT NULL,
  `status` enum('pending','scheduled','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `consultation_type` enum('measurement','installation','design','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time_slot` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_mode` enum('video','voice','chat','in_person') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'video',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duration_minutes` int DEFAULT '30',
  `room_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_started` tinyint(1) DEFAULT '0',
  `has_ended` tinyint(1) DEFAULT '0',
  `actual_start_time` timestamp NULL DEFAULT NULL,
  `actual_end_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`consultation_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_consultant` (`consultant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`preferred_date`),
  CONSTRAINT `consultations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `consultations_ibfk_2` FOREIGN KEY (`consultant_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_articles`
--

DROP TABLE IF EXISTS `content_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_articles` (
  `article_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('guide','tutorial','faq','blog','video','tip') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'beginner',
  `estimated_read_time` int DEFAULT NULL,
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `featured_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `images` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `meta_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `author_id` int DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `view_count` int DEFAULT '0',
  `rating` decimal(3,2) DEFAULT NULL,
  `rating_count` int DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`article_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  KEY `author_id` (`author_id`),
  KEY `content_type` (`content_type`),
  KEY `is_published` (`is_published`),
  KEY `is_featured` (`is_featured`),
  KEY `published_at` (`published_at`),
  CONSTRAINT `content_articles_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `content_categories` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `content_articles_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_articles`
--

LOCK TABLES `content_articles` WRITE;
/*!40000 ALTER TABLE `content_articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_categories`
--

DROP TABLE IF EXISTS `content_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `content_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `parent_id` int DEFAULT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `content_categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `content_categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_categories`
--

LOCK TABLES `content_categories` WRITE;
/*!40000 ALTER TABLE `content_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `control_types`
--

DROP TABLE IF EXISTS `control_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `control_types` (
  `control_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `operation_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `automation_compatible` tinyint(1) DEFAULT '0',
  `child_safety_features` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`control_type_id`),
  UNIQUE KEY `name` (`name`),
  KEY `operation_method` (`operation_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `control_types`
--

LOCK TABLES `control_types` WRITE;
/*!40000 ALTER TABLE `control_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `control_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_codes`
--

DROP TABLE IF EXISTS `coupon_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_codes` (
  `coupon_id` int NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coupon_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type of discount: percentage, fixed_amount, free_shipping, buy_one_get_one, etc.',
  `discount_value` decimal(8,2) NOT NULL,
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL,
  `applies_to` enum('all_products','specific_products','categories','exclude_products') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all_products',
  `target_product_ids` json DEFAULT NULL,
  `target_category_ids` json DEFAULT NULL,
  `excluded_product_ids` json DEFAULT NULL,
  `customer_id` int DEFAULT NULL COMMENT 'Specific customer only (null = any customer)',
  `customer_types` json DEFAULT NULL,
  `first_time_customers_only` tinyint(1) DEFAULT '0',
  `usage_limit_total` int DEFAULT NULL,
  `usage_limit_per_customer` int DEFAULT '1',
  `usage_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_auto_generated` tinyint(1) DEFAULT '0',
  `generation_pattern` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `coupon_code` (`coupon_code`),
  KEY `idx_coupon_code` (`coupon_code`),
  KEY `idx_customer_coupons` (`customer_id`),
  KEY `idx_active_coupons` (`is_active`,`valid_from`,`valid_until`),
  KEY `idx_batch_coupons` (`batch_id`),
  CONSTRAINT `fk_coupon_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_codes`
--

LOCK TABLES `coupon_codes` WRITE;
/*!40000 ALTER TABLE `coupon_codes` DISABLE KEYS */;
INSERT INTO `coupon_codes` VALUES (1,'SAVE10','10% Off Orders Over $100','percentage',10.00,100.00,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,0,NULL,1,0,1,NULL,NULL,0,NULL,NULL,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(2,'FREESHIP','Free Shipping','free_shipping',0.00,75.00,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,0,NULL,1,0,1,NULL,NULL,0,NULL,NULL,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(3,'WELCOME25','Welcome $25 Off','fixed_amount',25.00,100.00,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,0,NULL,1,0,1,NULL,NULL,0,NULL,NULL,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(8,'SAVE15NOW','15% Off All Orders','percentage',15.00,0.00,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,0,NULL,1,0,1,NULL,NULL,0,NULL,NULL,'2025-06-22 20:11:55','2025-06-22 20:11:55');
/*!40000 ALTER TABLE `coupon_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_type` enum('shipping','billing','both') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'shipping',
  `is_default` tinyint(1) DEFAULT '0',
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-friendly label like "Home", "Office", etc.',
  `recipient_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'United States',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_residential` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_customer_addresses` (`user_id`),
  KEY `idx_address_type` (`address_type`),
  KEY `idx_is_default` (`is_default`),
  CONSTRAINT `fk_customer_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_bulk_uploads`
--

DROP TABLE IF EXISTS `customer_bulk_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_bulk_uploads` (
  `upload_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `template_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `row_count` int NOT NULL DEFAULT '0',
  `valid_rows` int NOT NULL DEFAULT '0',
  `invalid_rows` int NOT NULL DEFAULT '0',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('uploaded','validating','valid','invalid','processed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uploaded',
  `validation_errors` json DEFAULT NULL,
  `validation_warnings` json DEFAULT NULL,
  `processing_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`upload_id`),
  KEY `idx_customer_uploads` (`customer_id`,`created_at` DESC),
  KEY `idx_upload_status` (`status`),
  KEY `idx_template_uploads` (`template_id`),
  KEY `idx_file_hash` (`file_hash`),
  CONSTRAINT `fk_bulk_upload_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_bulk_uploads`
--

LOCK TABLES `customer_bulk_uploads` WRITE;
/*!40000 ALTER TABLE `customer_bulk_uploads` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_bulk_uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_questions`
--

DROP TABLE IF EXISTS `customer_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_questions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `question_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_answered` tinyint(1) DEFAULT '0',
  `is_public` tinyint(1) DEFAULT '1',
  `helpful_votes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `customer_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `customer_questions_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_questions`
--

LOCK TABLES `customer_questions` WRITE;
/*!40000 ALTER TABLE `customer_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_specific_pricing`
--

DROP TABLE IF EXISTS `customer_specific_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_specific_pricing` (
  `pricing_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `product_id` int DEFAULT NULL COMMENT 'Specific product (null = applies to categories/brands)',
  `category_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `pricing_type` enum('fixed_price','discount_percent','discount_amount','markup_percent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pricing_value` decimal(10,2) NOT NULL,
  `minimum_quantity` int DEFAULT '1',
  `contract_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valid_from` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pricing_id`),
  UNIQUE KEY `unique_customer_product_pricing` (`customer_id`,`product_id`,`category_id`,`brand_id`),
  KEY `fk_customer_pricing_product` (`product_id`),
  KEY `fk_customer_pricing_approver` (`approved_by`),
  KEY `idx_customer_pricing` (`customer_id`),
  KEY `idx_approval_status` (`approval_status`),
  CONSTRAINT `fk_customer_pricing_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customer_pricing_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_pricing_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_specific_pricing`
--

LOCK TABLES `customer_specific_pricing` WRITE;
/*!40000 ALTER TABLE `customer_specific_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_specific_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_blackout_dates`
--

DROP TABLE IF EXISTS `delivery_blackout_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_blackout_dates` (
  `blackout_id` int NOT NULL AUTO_INCREMENT,
  `blackout_date` date NOT NULL,
  `blackout_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Holiday name or reason',
  `applies_to_all_slots` tinyint(1) DEFAULT '1',
  `specific_slot_ids` json DEFAULT NULL COMMENT 'Array of slot_ids if not all slots',
  `applies_to_all_zones` tinyint(1) DEFAULT '1',
  `specific_zone_ids` json DEFAULT NULL COMMENT 'Array of zone_ids if not all zones',
  `is_recurring_yearly` tinyint(1) DEFAULT '0',
  `notification_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Message to show customers',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`blackout_id`),
  UNIQUE KEY `unique_blackout_date_name` (`blackout_date`,`blackout_name`),
  KEY `fk_blackout_creator` (`created_by`),
  KEY `idx_blackout_date` (`blackout_date`),
  KEY `idx_recurring` (`is_recurring_yearly`),
  CONSTRAINT `fk_blackout_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_blackout_dates`
--

LOCK TABLES `delivery_blackout_dates` WRITE;
/*!40000 ALTER TABLE `delivery_blackout_dates` DISABLE KEYS */;
INSERT INTO `delivery_blackout_dates` VALUES (1,'2025-01-01','New Year\'s Day',1,NULL,1,NULL,1,'Deliveries are not available on New Year\'s Day','2025-06-10 04:24:58',NULL),(2,'2025-07-04','Independence Day',1,NULL,1,NULL,1,'Deliveries are not available on Independence Day','2025-06-10 04:24:58',NULL),(3,'2025-12-25','Christmas Day',1,NULL,1,NULL,1,'Deliveries are not available on Christmas Day','2025-06-10 04:24:58',NULL),(4,'2025-11-28','Thanksgiving Day',1,NULL,1,NULL,1,'Deliveries are not available on Thanksgiving Day','2025-06-10 04:24:58',NULL);
/*!40000 ALTER TABLE `delivery_blackout_dates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_capacity`
--

DROP TABLE IF EXISTS `delivery_capacity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_capacity` (
  `capacity_id` int NOT NULL AUTO_INCREMENT,
  `delivery_date` date NOT NULL,
  `time_slot_id` int NOT NULL,
  `zone_id` int DEFAULT NULL COMMENT 'Reference to shipping zones if zone-specific',
  `total_capacity` int NOT NULL,
  `booked_count` int NOT NULL DEFAULT '0',
  `available_capacity` int GENERATED ALWAYS AS ((`total_capacity` - `booked_count`)) STORED,
  `is_blocked` tinyint(1) DEFAULT '0' COMMENT 'Manually block this date/slot',
  `block_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `capacity_override` int DEFAULT NULL COMMENT 'Override default capacity for this date',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`capacity_id`),
  UNIQUE KEY `unique_date_slot_zone` (`delivery_date`,`time_slot_id`,`zone_id`),
  KEY `fk_capacity_zone` (`zone_id`),
  KEY `idx_date_availability` (`delivery_date`,`available_capacity`),
  KEY `idx_slot_date` (`time_slot_id`,`delivery_date`),
  CONSTRAINT `fk_capacity_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `delivery_time_slots` (`slot_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_capacity_zone` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones` (`zone_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_capacity`
--

LOCK TABLES `delivery_capacity` WRITE;
/*!40000 ALTER TABLE `delivery_capacity` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_capacity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_reschedule_history`
--

DROP TABLE IF EXISTS `delivery_reschedule_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_reschedule_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `schedule_id` int NOT NULL,
  `old_delivery_date` date NOT NULL,
  `old_time_slot_id` int NOT NULL,
  `new_delivery_date` date NOT NULL,
  `new_time_slot_id` int NOT NULL,
  `reschedule_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` enum('customer','vendor','carrier','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by_user_id` int DEFAULT NULL,
  `reschedule_fee` decimal(10,2) DEFAULT '0.00',
  `fee_waived` tinyint(1) DEFAULT '0',
  `fee_waive_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `fk_reschedule_user` (`requested_by_user_id`),
  KEY `idx_order_reschedules` (`order_id`,`created_at` DESC),
  KEY `idx_schedule_history` (`schedule_id`),
  CONSTRAINT `fk_reschedule_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reschedule_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `order_delivery_schedules` (`schedule_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reschedule_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_reschedule_history`
--

LOCK TABLES `delivery_reschedule_history` WRITE;
/*!40000 ALTER TABLE `delivery_reschedule_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_reschedule_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_time_slots`
--

DROP TABLE IF EXISTS `delivery_time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_time_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `slot_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name like "Morning (8AM-12PM)"',
  `slot_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Internal code like "morning"',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `available_days` json NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
  `blackout_dates` json DEFAULT NULL COMMENT 'Array of specific dates when slot is unavailable',
  `max_deliveries_per_day` int NOT NULL DEFAULT '10',
  `max_deliveries_per_zone` int DEFAULT NULL COMMENT 'Zone-specific limits',
  `additional_fee` decimal(10,2) DEFAULT '0.00' COMMENT 'Extra charge for this time slot',
  `min_lead_days` int NOT NULL DEFAULT '2' COMMENT 'Minimum days in advance to book',
  `max_advance_days` int NOT NULL DEFAULT '30' COMMENT 'Maximum days in advance to book',
  `requires_signature` tinyint(1) DEFAULT '0',
  `allows_specific_time_request` tinyint(1) DEFAULT '0',
  `priority_order` int NOT NULL DEFAULT '0' COMMENT 'Display order (lower = higher priority)',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `slot_code` (`slot_code`),
  KEY `idx_slot_code` (`slot_code`),
  KEY `idx_active_slots` (`is_active`,`priority_order`),
  KEY `idx_time_window` (`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_time_slots`
--

LOCK TABLES `delivery_time_slots` WRITE;
/*!40000 ALTER TABLE `delivery_time_slots` DISABLE KEYS */;
INSERT INTO `delivery_time_slots` VALUES (1,'Early Morning (6AM-8AM)','early_morning','06:00:00','08:00:00','[1, 2, 3, 4, 5]',NULL,10,NULL,0.00,2,30,0,0,1,1,'2025-06-10 04:24:58','2025-06-10 04:24:58'),(2,'Morning (8AM-12PM)','morning','08:00:00','12:00:00','[1, 2, 3, 4, 5, 6]',NULL,10,NULL,0.00,2,30,0,0,2,1,'2025-06-10 04:24:58','2025-06-10 04:24:58'),(3,'Afternoon (12PM-5PM)','afternoon','12:00:00','17:00:00','[1, 2, 3, 4, 5, 6]',NULL,10,NULL,0.00,2,30,0,0,3,1,'2025-06-10 04:24:58','2025-06-10 04:24:58'),(4,'Evening (5PM-8PM)','evening','17:00:00','20:00:00','[1, 2, 3, 4, 5]',NULL,10,NULL,0.00,2,30,0,0,4,1,'2025-06-10 04:24:58','2025-06-10 04:24:58'),(5,'Weekend Morning (9AM-1PM)','weekend_morning','09:00:00','13:00:00','[0, 6]',NULL,10,NULL,0.00,2,30,0,0,5,1,'2025-06-10 04:24:58','2025-06-10 04:24:58'),(6,'Weekend Afternoon (1PM-5PM)','weekend_afternoon','13:00:00','17:00:00','[0, 6]',NULL,10,NULL,0.00,2,30,0,0,6,1,'2025-06-10 04:24:58','2025-06-10 04:24:58');
/*!40000 ALTER TABLE `delivery_time_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dimension_types`
--

DROP TABLE IF EXISTS `dimension_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dimension_types` (
  `dimension_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'inches',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dimension_type_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dimension_types`
--

LOCK TABLES `dimension_types` WRITE;
/*!40000 ALTER TABLE `dimension_types` DISABLE KEYS */;
INSERT INTO `dimension_types` VALUES (1,'Width',NULL,'inches',1,'2025-06-29 00:26:30','2025-06-29 00:26:30'),(2,'Height',NULL,'inches',1,'2025-06-29 00:26:30','2025-06-29 00:26:30');
/*!40000 ALTER TABLE `dimension_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `draft_configurations`
--

DROP TABLE IF EXISTS `draft_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `draft_configurations` (
  `draft_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int NOT NULL,
  `configuration` json NOT NULL,
  `completion_percentage` decimal(3,2) DEFAULT '0.00' COMMENT 'How complete the configuration is',
  `page_context` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Where user was configuring',
  `auto_saved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT ((now() + interval 7 day)),
  PRIMARY KEY (`draft_id`),
  KEY `idx_draft_user` (`user_id`),
  KEY `idx_draft_session` (`session_id`),
  KEY `idx_draft_product` (`product_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_draft_configurations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draft_configurations`
--

LOCK TABLES `draft_configurations` WRITE;
/*!40000 ALTER TABLE `draft_configurations` DISABLE KEYS */;
/*!40000 ALTER TABLE `draft_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dynamic_pricing_rules`
--

DROP TABLE IF EXISTS `dynamic_pricing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dynamic_pricing_rules` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` enum('time_based','demand_based','inventory_based','competition_based','seasonal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int DEFAULT NULL,
  `category_ids` json DEFAULT NULL,
  `brand_ids` json DEFAULT NULL,
  `conditions` json NOT NULL COMMENT 'Rule-specific conditions (time ranges, inventory levels, etc.)',
  `adjustment_type` enum('percentage','fixed_amount','multiply_by') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_value` decimal(8,4) NOT NULL,
  `min_price` decimal(10,2) DEFAULT NULL COMMENT 'Minimum price floor',
  `max_price` decimal(10,2) DEFAULT NULL COMMENT 'Maximum price ceiling',
  `priority` int DEFAULT '100',
  `conflicts_with` json DEFAULT NULL COMMENT 'Array of rule IDs that conflict with this rule',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `applications_count` int DEFAULT '0',
  `total_revenue_impact` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`),
  KEY `idx_rule_type` (`rule_type`),
  KEY `idx_product_dynamic_pricing` (`product_id`),
  KEY `idx_active_dynamic_rules` (`is_active`,`priority`),
  CONSTRAINT `fk_dynamic_pricing_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dynamic_pricing_rules`
--

LOCK TABLES `dynamic_pricing_rules` WRITE;
/*!40000 ALTER TABLE `dynamic_pricing_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `dynamic_pricing_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fabric_types`
--

DROP TABLE IF EXISTS `fabric_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fabric_types` (
  `fabric_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `light_filtering` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `privacy_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `energy_efficiency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maintenance_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_category` enum('budget','mid-range','premium','luxury') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'mid-range',
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fabric_type_id`),
  UNIQUE KEY `name` (`name`),
  KEY `light_filtering` (`light_filtering`),
  KEY `privacy_level` (`privacy_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fabric_types`
--

LOCK TABLES `fabric_types` WRITE;
/*!40000 ALTER TABLE `fabric_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `fabric_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `features`
--

DROP TABLE IF EXISTS `features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `features` (
  `feature_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feature_id`),
  UNIQUE KEY `name` (`name`),
  KEY `category` (`category`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `features`
--

LOCK TABLES `features` WRITE;
/*!40000 ALTER TABLE `features` DISABLE KEYS */;
INSERT INTO `features` VALUES (1,'Test feature','Testing fatures','heart','product_specific',1,0,'2025-06-17 22:38:41'),(3,'nothing special','dsfdsfdsfds',NULL,NULL,1,0,'2025-06-30 01:46:26');
/*!40000 ALTER TABLE `features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `headrail_options`
--

DROP TABLE IF EXISTS `headrail_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `headrail_options` (
  `headrail_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `material` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_options` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mounting_compatibility` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `weight_capacity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`headrail_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `headrail_options`
--

LOCK TABLES `headrail_options` WRITE;
/*!40000 ALTER TABLE `headrail_options` DISABLE KEYS */;
INSERT INTO `headrail_options` VALUES (1,'Circular (With Fabric Insert)','Circular headrail with fabric insert for a polished look','Aluminum',NULL,NULL,NULL,1,'2025-06-17 16:56:40','2025-06-17 16:56:40'),(2,'Square (Without Fabric)','Square headrail without fabric for a modern appearance','Aluminum',NULL,NULL,NULL,1,'2025-06-17 16:56:40','2025-06-17 16:56:40'),(3,'Fabric Wrapped','Fully fabric-wrapped headrail for seamless integration','Aluminum with Fabric',NULL,NULL,NULL,1,'2025-06-17 16:56:40','2025-06-17 16:56:40');
/*!40000 ALTER TABLE `headrail_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hero_banners`
--

DROP TABLE IF EXISTS `hero_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hero_banners` (
  `banner_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `background_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `right_side_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_cta_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_cta_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_cta_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_cta_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`banner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hero_banners`
--

LOCK TABLES `hero_banners` WRITE;
/*!40000 ALTER TABLE `hero_banners` DISABLE KEYS */;
INSERT INTO `hero_banners` VALUES (1,'Custom Window Treatments','Made to Your Exact Specifications','Free Shipping on Orders Over $100','/images/hero/hero-1.jpg','/uploads/hero-banners/hero_1_1750361606193_k2g8vjw0it.jpg','Shop Now','/products','Free Samples','/customer/samples',1,1,'2025-06-19 19:17:41','2025-06-19 19:33:28'),(2,'Smart Motorized Blinds','Control with Voice or App','Professional Installation Available','/images/hero/hero-2.jpg','/uploads/hero-banners/hero_1_1750732212911_amdz5bzpov.jpg','Explore Smart Blinds','/products?category=22','Book Consultation','/measure-install',2,1,'2025-06-19 19:17:41','2025-06-24 02:30:16'),(3,'End of Year Sale','Save Up to 40% Off','Limited Time Offer - While Supplies Last','/images/hero/hero-1.jpg','/uploads/hero-banners/hero_1_1750732232290_wlpl5hfr6y.jpg','Shop Sale','/sales','View All Deals','/products?sale=true',3,1,'2025-06-19 19:17:41','2025-06-24 02:30:34'),(4,'Premium Quality Blinds','Lifetime Warranty Included','Professional Design Consultation Available','/images/hero/hero-2.jpg',NULL,'Browse Collection','/products','Get Quote','/consultation',4,1,'2025-06-19 19:17:41','2025-06-19 19:17:41'),(5,'Energy Efficient Shades','Save on Your Energy Bills','Eco-Friendly Materials & UV Protection','/images/hero/hero-1.jpg','/uploads/hero-banners/hero_1_1750732656406_39yak0v92ew.jpg','Learn More','/features','Shop Energy Efficient','/products?type=energy-efficient',5,1,'2025-06-19 19:17:41','2025-06-24 02:37:39');
/*!40000 ALTER TABLE `hero_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_appointments`
--

DROP TABLE IF EXISTS `installation_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `appointment_date` date NOT NULL,
  `time_slot_id` int NOT NULL,
  `estimated_duration_hours` decimal(3,1) NOT NULL DEFAULT '2.0',
  `assigned_technician_id` int DEFAULT NULL,
  `backup_technician_id` int DEFAULT NULL,
  `crew_size` int DEFAULT '1',
  `installation_type` enum('measurement','installation','repair','consultation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'installation',
  `product_types` json NOT NULL COMMENT 'Types of products being installed',
  `room_count` int DEFAULT '1',
  `window_count` int DEFAULT '1',
  `special_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `installation_address` json NOT NULL COMMENT 'Full address details',
  `access_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `parking_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative_contact` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_cost` decimal(10,2) NOT NULL,
  `additional_fees` json DEFAULT NULL COMMENT 'Breakdown of extra charges',
  `total_cost` decimal(10,2) NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','rescheduled','no_show') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `confirmation_sent_at` timestamp NULL DEFAULT NULL,
  `reminder_sent_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completion_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `before_photos` json DEFAULT NULL COMMENT 'Array of photo URLs',
  `after_photos` json DEFAULT NULL COMMENT 'Array of photo URLs',
  `customer_rating` tinyint DEFAULT NULL COMMENT '1-5 star rating',
  `customer_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `issues_reported` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `original_appointment_date` date DEFAULT NULL,
  `reschedule_count` int DEFAULT '0',
  `reschedule_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  KEY `fk_appointment_slot` (`time_slot_id`),
  KEY `fk_appointment_backup` (`backup_technician_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_technician_schedule` (`assigned_technician_id`,`appointment_date`),
  KEY `idx_customer_appointments` (`customer_id`,`appointment_date`),
  KEY `idx_status` (`status`),
  KEY `idx_order_appointment` (`order_id`),
  CONSTRAINT `fk_appointment_backup` FOREIGN KEY (`backup_technician_id`) REFERENCES `installation_technicians` (`technician_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointment_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointment_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `installation_time_slots` (`slot_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_appointment_technician` FOREIGN KEY (`assigned_technician_id`) REFERENCES `installation_technicians` (`technician_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_appointments`
--

LOCK TABLES `installation_appointments` WRITE;
/*!40000 ALTER TABLE `installation_appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_appointments` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_update_technician_stats` AFTER UPDATE ON `installation_appointments` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `installation_bookings`
--

DROP TABLE IF EXISTS `installation_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_bookings` (
  `installation_booking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `installer_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `slot_id` int DEFAULT NULL,
  `installation_type` enum('standard','premium','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','rescheduled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `estimated_duration_hours` decimal(3,1) DEFAULT '2.0',
  `special_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `preparation_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `confirmation_sent` tinyint(1) DEFAULT '0',
  `reminder_sent` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`installation_booking_id`),
  KEY `user_id` (`user_id`),
  KEY `installer_id` (`installer_id`),
  KEY `order_id` (`order_id`),
  KEY `slot_id` (`slot_id`),
  CONSTRAINT `installation_bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `installation_bookings_ibfk_2` FOREIGN KEY (`installer_id`) REFERENCES `installers` (`installer_id`) ON DELETE SET NULL,
  CONSTRAINT `installation_bookings_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `installation_bookings_ibfk_4` FOREIGN KEY (`slot_id`) REFERENCES `installation_slots` (`slot_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_bookings`
--

LOCK TABLES `installation_bookings` WRITE;
/*!40000 ALTER TABLE `installation_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_job_materials`
--

DROP TABLE IF EXISTS `installation_job_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_job_materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int NOT NULL,
  `material_type` enum('bracket','screw','anchor','chain','cord','motor','remote','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity_required` int NOT NULL,
  `quantity_used` int DEFAULT NULL,
  `unit_cost` decimal(8,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `source` enum('customer_provided','technician_stock','special_order','warranty_replacement') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installation_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`material_id`),
  KEY `idx_appointment_materials` (`appointment_id`),
  KEY `idx_material_type` (`material_type`),
  CONSTRAINT `fk_materials_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `installation_appointments` (`appointment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_job_materials`
--

LOCK TABLES `installation_job_materials` WRITE;
/*!40000 ALTER TABLE `installation_job_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_job_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_quality_checks`
--

DROP TABLE IF EXISTS `installation_quality_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_quality_checks` (
  `check_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int NOT NULL,
  `mounting_secure` tinyint(1) DEFAULT NULL,
  `operation_smooth` tinyint(1) DEFAULT NULL,
  `alignment_correct` tinyint(1) DEFAULT NULL,
  `safety_features_working` tinyint(1) DEFAULT NULL,
  `cleanup_completed` tinyint(1) DEFAULT NULL,
  `customer_walkthrough_done` tinyint(1) DEFAULT NULL,
  `warranty_explained` tinyint(1) DEFAULT NULL,
  `quality_score` tinyint DEFAULT NULL COMMENT '1-10 quality rating',
  `safety_score` tinyint DEFAULT NULL COMMENT '1-10 safety rating',
  `issues_found` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `resolutions_applied` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `follow_up_required` tinyint(1) DEFAULT '0',
  `follow_up_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `technician_signature` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Digital signature data',
  `customer_signature` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Digital signature data',
  `supervisor_approval` tinyint(1) DEFAULT '0',
  `approved_by` int DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`check_id`),
  UNIQUE KEY `unique_appointment_quality_check` (`appointment_id`),
  KEY `fk_quality_check_supervisor` (`approved_by`),
  KEY `idx_quality_scores` (`quality_score`,`safety_score`),
  KEY `idx_follow_up_required` (`follow_up_required`),
  CONSTRAINT `fk_quality_check_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `installation_appointments` (`appointment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quality_check_supervisor` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_quality_checks`
--

LOCK TABLES `installation_quality_checks` WRITE;
/*!40000 ALTER TABLE `installation_quality_checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_quality_checks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_requests`
--

DROP TABLE IF EXISTS `installation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time_start` time DEFAULT NULL,
  `preferred_time_end` time DEFAULT NULL,
  `alternative_dates` json DEFAULT NULL,
  `property_type` enum('house','apartment','condo','office','commercial') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'house',
  `access_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `special_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tools_available` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pets_present` tinyint(1) DEFAULT '0',
  `status` enum('pending','scheduled','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `installation_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `installation_requests_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_requests`
--

LOCK TABLES `installation_requests` WRITE;
/*!40000 ALTER TABLE `installation_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_service_areas`
--

DROP TABLE IF EXISTS `installation_service_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_service_areas` (
  `area_id` int NOT NULL AUTO_INCREMENT,
  `area_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `states_provinces` json NOT NULL COMMENT 'Array of supported states/provinces',
  `cities` json DEFAULT NULL COMMENT 'Array of supported cities (null = all cities in states)',
  `postal_code_patterns` json DEFAULT NULL COMMENT 'Regex patterns for postal codes',
  `is_active` tinyint(1) DEFAULT '1',
  `lead_time_days` int NOT NULL DEFAULT '3' COMMENT 'Minimum days advance notice required',
  `max_advance_days` int NOT NULL DEFAULT '60' COMMENT 'Maximum days in advance to book',
  `base_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `per_hour_rate` decimal(10,2) NOT NULL DEFAULT '75.00',
  `travel_fee` decimal(10,2) DEFAULT '0.00',
  `service_days` json NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
  `service_start_time` time NOT NULL DEFAULT '08:00:00',
  `service_end_time` time NOT NULL DEFAULT '18:00:00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`area_id`),
  UNIQUE KEY `area_code` (`area_code`),
  KEY `idx_area_code` (`area_code`),
  KEY `idx_active_areas` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_service_areas`
--

LOCK TABLES `installation_service_areas` WRITE;
/*!40000 ALTER TABLE `installation_service_areas` DISABLE KEYS */;
INSERT INTO `installation_service_areas` VALUES (1,'Austin Metro','AUSTIN_TX','[\"Texas\"]',NULL,NULL,1,3,60,0.00,75.00,0.00,'[\"1\", \"2\", \"3\", \"4\", \"5\"]','08:00:00','18:00:00','2025-06-10 04:32:10','2025-06-10 04:32:10'),(2,'Dallas Metro','DALLAS_TX','[\"Texas\"]',NULL,NULL,1,3,60,0.00,75.00,0.00,'[\"1\", \"2\", \"3\", \"4\", \"5\"]','08:00:00','18:00:00','2025-06-10 04:32:10','2025-06-10 04:32:10'),(3,'Houston Metro','HOUSTON_TX','[\"Texas\"]',NULL,NULL,1,3,60,0.00,75.00,0.00,'[\"1\", \"2\", \"3\", \"4\", \"5\"]','08:00:00','18:00:00','2025-06-10 04:32:10','2025-06-10 04:32:10');
/*!40000 ALTER TABLE `installation_service_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_slots`
--

DROP TABLE IF EXISTS `installation_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `installer_id` int NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `service_area` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_installations` int DEFAULT '1',
  `current_installations` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `installer_date_time` (`installer_id`,`date`,`start_time`),
  KEY `installer_id` (`installer_id`),
  CONSTRAINT `installation_slots_ibfk_1` FOREIGN KEY (`installer_id`) REFERENCES `installers` (`installer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_slots`
--

LOCK TABLES `installation_slots` WRITE;
/*!40000 ALTER TABLE `installation_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_technicians`
--

DROP TABLE IF EXISTS `installation_technicians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_technicians` (
  `technician_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'Reference to users table for installer account',
  `employee_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `primary_service_area_id` int NOT NULL,
  `secondary_service_areas` json DEFAULT NULL COMMENT 'Array of additional area_ids',
  `skill_level` enum('trainee','standard','senior','master') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `certifications` json DEFAULT NULL COMMENT 'Array of certification names/codes',
  `specializations` json DEFAULT NULL COMMENT 'Types of installations: blinds, shutters, awnings, etc.',
  `max_jobs_per_day` int DEFAULT '4',
  `preferred_start_time` time DEFAULT '08:00:00',
  `preferred_end_time` time DEFAULT '17:00:00',
  `works_weekends` tinyint(1) DEFAULT '0',
  `average_rating` decimal(3,2) DEFAULT '0.00',
  `total_installations` int DEFAULT '0',
  `completion_rate` decimal(5,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `availability_status` enum('available','busy','off_duty','vacation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `hire_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`technician_id`),
  UNIQUE KEY `unique_technician_user` (`user_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_service_area` (`primary_service_area_id`),
  KEY `idx_active_technicians` (`is_active`,`availability_status`),
  KEY `idx_skill_level` (`skill_level`),
  CONSTRAINT `fk_technician_primary_area` FOREIGN KEY (`primary_service_area_id`) REFERENCES `installation_service_areas` (`area_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_technician_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_technicians`
--

LOCK TABLES `installation_technicians` WRITE;
/*!40000 ALTER TABLE `installation_technicians` DISABLE KEYS */;
/*!40000 ALTER TABLE `installation_technicians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installation_time_slots`
--

DROP TABLE IF EXISTS `installation_time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installation_time_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `slot_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slot_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_hours` decimal(3,1) GENERATED ALWAYS AS ((timestampdiff(MINUTE,`start_time`,`end_time`) / 60.0)) STORED,
  `available_days` json NOT NULL COMMENT 'Array of weekdays [0-6] where 0=Sunday',
  `is_premium` tinyint(1) DEFAULT '0' COMMENT 'Premium time slots cost extra',
  `premium_fee` decimal(10,2) DEFAULT '0.00',
  `max_concurrent_jobs` int DEFAULT '5' COMMENT 'Max number of jobs that can be scheduled in this slot',
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `unique_slot_code` (`slot_code`),
  KEY `idx_time_window` (`start_time`,`end_time`),
  KEY `idx_active_slots` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installation_time_slots`
--

LOCK TABLES `installation_time_slots` WRITE;
/*!40000 ALTER TABLE `installation_time_slots` DISABLE KEYS */;
INSERT INTO `installation_time_slots` (`slot_id`, `slot_name`, `slot_code`, `start_time`, `end_time`, `available_days`, `is_premium`, `premium_fee`, `max_concurrent_jobs`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES (1,'Early Morning','early_morning','07:00:00','10:00:00','[\"1\", \"2\", \"3\", \"4\", \"5\"]',0,0.00,5,1,1,'2025-06-10 04:32:10','2025-06-10 04:32:10'),(2,'Morning','morning','08:00:00','12:00:00','[\"1\", \"2\", \"3\", \"4\", \"5\", \"6\"]',0,0.00,5,1,2,'2025-06-10 04:32:10','2025-06-10 04:32:10'),(3,'Afternoon','afternoon','12:00:00','17:00:00','[\"1\", \"2\", \"3\", \"4\", \"5\", \"6\"]',0,0.00,5,1,3,'2025-06-10 04:32:10','2025-06-10 04:32:10'),(4,'Evening','evening','17:00:00','20:00:00','[\"1\", \"2\", \"3\", \"4\", \"5\"]',0,0.00,5,1,4,'2025-06-10 04:32:10','2025-06-10 04:32:10'),(5,'Weekend Morning','weekend_morning','09:00:00','13:00:00','[\"0\", \"6\"]',0,0.00,5,1,5,'2025-06-10 04:32:10','2025-06-10 04:32:10'),(6,'Weekend Afternoon','weekend_afternoon','13:00:00','17:00:00','[\"0\", \"6\"]',0,0.00,5,1,6,'2025-06-10 04:32:10','2025-06-10 04:32:10');
/*!40000 ALTER TABLE `installation_time_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installer_jobs`
--

DROP TABLE IF EXISTS `installer_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installer_jobs` (
  `job_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `installer_id` int DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `job_type` enum('installation','repair','measurement','consultation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'installation',
  `status` enum('assigned','scheduled','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `scheduled_datetime` datetime NOT NULL,
  `estimated_duration` int NOT NULL DEFAULT '120' COMMENT 'Duration in minutes',
  `special_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `completion_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `customer_satisfaction` tinyint DEFAULT NULL COMMENT '1-5 rating',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`),
  KEY `address_id` (`address_id`),
  KEY `order_id` (`order_id`),
  KEY `idx_installer_schedule` (`installer_id`,`scheduled_datetime`),
  KEY `idx_customer_jobs` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_job_type` (`job_type`),
  CONSTRAINT `installer_jobs_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `installer_jobs_ibfk_2` FOREIGN KEY (`installer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `installer_jobs_ibfk_3` FOREIGN KEY (`address_id`) REFERENCES `user_shipping_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `installer_jobs_ibfk_4` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installer_jobs`
--

LOCK TABLES `installer_jobs` WRITE;
/*!40000 ALTER TABLE `installer_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `installer_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installers`
--

DROP TABLE IF EXISTS `installers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installers` (
  `installer_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `certification_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_area` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialties` json DEFAULT NULL,
  `hourly_rate` decimal(8,2) DEFAULT '0.00',
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_installations` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_certified` tinyint(1) DEFAULT '0',
  `certification_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`installer_id`),
  KEY `user_id` (`user_id`),
  KEY `service_area` (`service_area`),
  CONSTRAINT `installers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installers`
--

LOCK TABLES `installers` WRITE;
/*!40000 ALTER TABLE `installers` DISABLE KEYS */;
INSERT INTO `installers` VALUES (1,5,'CERT-12345','Metro Area',NULL,75.00,4.80,156,1,1,'2023-06-15','2025-06-08 21:13:09','2025-06-08 21:13:09'),(2,5,'CERT-12345','Metro Area',NULL,75.00,4.80,156,1,1,'2023-06-15','2025-06-08 21:14:54','2025-06-08 21:14:54');
/*!40000 ALTER TABLE `installers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_alerts`
--

DROP TABLE IF EXISTS `inventory_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_alerts` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `alert_type` enum('low_stock','out_of_stock','reorder_point') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'low_stock',
  `threshold_quantity` int NOT NULL,
  `current_quantity` int NOT NULL,
  `alert_status` enum('active','resolved','dismissed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `last_triggered` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`alert_id`),
  KEY `product_id` (`product_id`),
  KEY `alert_type` (`alert_type`),
  KEY `alert_status` (`alert_status`),
  CONSTRAINT `inventory_alerts_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_alerts`
--

LOCK TABLES `inventory_alerts` WRITE;
/*!40000 ALTER TABLE `inventory_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_materials`
--

DROP TABLE IF EXISTS `job_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_materials` (
  `job_material_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `material_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT '1',
  `material_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_material_id`),
  KEY `idx_job_materials` (`job_id`),
  CONSTRAINT `job_materials_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `installer_jobs` (`job_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_materials`
--

LOCK TABLES `job_materials` WRITE;
/*!40000 ALTER TABLE `job_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_products`
--

DROP TABLE IF EXISTS `job_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_products` (
  `job_product_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `room_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specifications` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_product_id`),
  KEY `idx_job_products` (`job_id`),
  KEY `idx_product_jobs` (`product_id`),
  CONSTRAINT `job_products_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `installer_jobs` (`job_id`) ON DELETE CASCADE,
  CONSTRAINT `job_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_products`
--

LOCK TABLES `job_products` WRITE;
/*!40000 ALTER TABLE `job_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `lead_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'website',
  `status` enum('new','contacted','qualified','proposal','negotiating','closed_won','closed_lost') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `assigned_to` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_contact` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`lead_id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_points_transactions`
--

DROP TABLE IF EXISTS `loyalty_points_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_points_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `transaction_type` enum('earned','redeemed','expired','adjusted','bonus','referral') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `points_amount` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `review_id` int DEFAULT NULL,
  `referral_user_id` int DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('purchase','review','referral','birthday','signup','social_share','survey','admin_adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `earned_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` timestamp NULL DEFAULT NULL,
  `redeemed_date` timestamp NULL DEFAULT NULL,
  `multiplier_applied` decimal(3,2) DEFAULT '1.00',
  `tier_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_points` (`user_id`,`transaction_type`),
  KEY `idx_expiry` (`expiry_date`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `review_id` (`review_id`),
  KEY `referral_user_id` (`referral_user_id`),
  KEY `tier_id` (`tier_id`),
  KEY `idx_loyalty_points_expiry` (`user_id`,`expiry_date`),
  CONSTRAINT `loyalty_points_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `loyalty_points_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `loyalty_points_transactions_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL,
  CONSTRAINT `loyalty_points_transactions_ibfk_4` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`review_id`) ON DELETE SET NULL,
  CONSTRAINT `loyalty_points_transactions_ibfk_5` FOREIGN KEY (`referral_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `loyalty_points_transactions_ibfk_6` FOREIGN KEY (`tier_id`) REFERENCES `loyalty_tiers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_points_transactions`
--

LOCK TABLES `loyalty_points_transactions` WRITE;
/*!40000 ALTER TABLE `loyalty_points_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_points_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_reward_redemptions`
--

DROP TABLE IF EXISTS `loyalty_reward_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_reward_redemptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reward_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `points_used` int NOT NULL,
  `discount_applied` decimal(10,2) DEFAULT NULL,
  `product_received_id` int DEFAULT NULL,
  `gift_card_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected','fulfilled','expired','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `expiry_date` timestamp NULL DEFAULT NULL,
  `fulfilled_date` timestamp NULL DEFAULT NULL,
  `refund_date` timestamp NULL DEFAULT NULL,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_redemption` (`user_id`,`created_at`),
  KEY `idx_reward` (`reward_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expiry` (`expiry_date`),
  KEY `order_id` (`order_id`),
  KEY `product_received_id` (`product_received_id`),
  CONSTRAINT `loyalty_reward_redemptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `loyalty_reward_redemptions_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `loyalty_rewards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `loyalty_reward_redemptions_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `loyalty_reward_redemptions_ibfk_4` FOREIGN KEY (`product_received_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_reward_redemptions`
--

LOCK TABLES `loyalty_reward_redemptions` WRITE;
/*!40000 ALTER TABLE `loyalty_reward_redemptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_reward_redemptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_rewards`
--

DROP TABLE IF EXISTS `loyalty_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reward_type` enum('discount','free_shipping','free_product','gift_card','service') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `points_cost` int NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `free_product_id` int DEFAULT NULL,
  `gift_card_amount` decimal(10,2) DEFAULT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `min_tier_level` int DEFAULT '0',
  `max_tier_level` int DEFAULT NULL,
  `quantity_available` int DEFAULT NULL,
  `quantity_claimed` int DEFAULT '0',
  `reward_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reward_type` (`reward_type`),
  KEY `idx_points_cost` (`points_cost`),
  KEY `idx_min_tier` (`min_tier_level`),
  KEY `idx_active` (`is_active`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_validity` (`valid_from`,`valid_until`),
  KEY `free_product_id` (`free_product_id`),
  CONSTRAINT `loyalty_rewards_ibfk_1` FOREIGN KEY (`free_product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_rewards`
--

LOCK TABLES `loyalty_rewards` WRITE;
/*!40000 ALTER TABLE `loyalty_rewards` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_tiers`
--

DROP TABLE IF EXISTS `loyalty_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_tiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tier_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier_level` int NOT NULL,
  `minimum_spending` decimal(10,2) NOT NULL,
  `points_multiplier` decimal(3,2) DEFAULT '1.00',
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `free_shipping_threshold` decimal(10,2) DEFAULT NULL,
  `early_access_hours` int DEFAULT '0',
  `exclusive_products` tinyint(1) DEFAULT '0',
  `priority_support` tinyint(1) DEFAULT '0',
  `tier_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#6B7280',
  `tier_icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tier_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tier_name` (`tier_name`),
  UNIQUE KEY `unique_tier_level` (`tier_level`),
  KEY `idx_tier_level` (`tier_level`),
  KEY `idx_minimum_spending` (`minimum_spending`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_tiers`
--

LOCK TABLES `loyalty_tiers` WRITE;
/*!40000 ALTER TABLE `loyalty_tiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_swatches`
--

DROP TABLE IF EXISTS `material_swatches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_swatches` (
  `swatch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `color_code` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hex color code',
  `material_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `texture_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category_id` int DEFAULT NULL,
  `sample_fee` decimal(8,2) DEFAULT '0.00' COMMENT 'Fee to request this sample',
  `is_premium` tinyint(1) DEFAULT '0' COMMENT 'Premium samples have higher fees',
  `is_available` tinyint(1) DEFAULT '1' COMMENT 'Currently available for ordering',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Active in catalog',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'High-res sample image',
  `thumbnail_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thumbnail image',
  `texture_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Close-up texture image',
  `fabric_weight` decimal(8,2) DEFAULT NULL COMMENT 'Weight in oz/sq yard',
  `opacity_level` enum('sheer','semi-sheer','semi-opaque','opaque','blackout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_filtering_percentage` decimal(5,2) DEFAULT NULL COMMENT '0-100% light filtering',
  `uv_protection_percentage` decimal(5,2) DEFAULT NULL COMMENT '0-100% UV protection',
  `care_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fabric_content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Material composition',
  `durability_rating` tinyint DEFAULT '5' COMMENT '1-10 durability scale',
  `fade_resistance` enum('low','medium','high','excellent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer_part_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lead_time_days` int DEFAULT '0' COMMENT 'Lead time for full orders',
  `minimum_order_yards` decimal(8,2) DEFAULT '1.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`swatch_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_material_type` (`material_type`),
  KEY `idx_available` (`is_available`,`is_active`),
  KEY `idx_premium` (`is_premium`),
  KEY `idx_opacity` (`opacity_level`),
  KEY `idx_sku` (`sku`),
  KEY `idx_swatches_search` (`name`,`material_name`,`material_type`),
  KEY `idx_swatches_filtering` (`category_id`,`is_available`,`is_premium`,`opacity_level`),
  CONSTRAINT `fk_swatches_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_swatches`
--

LOCK TABLES `material_swatches` WRITE;
/*!40000 ALTER TABLE `material_swatches` DISABLE KEYS */;
INSERT INTO `material_swatches` VALUES ('SW-001-WHT-ALU','Pure White Aluminum','Classic white aluminum slats with smooth finish','#FFFFFF','Aluminum','Metal',NULL,NULL,0.00,0,1,1,'/images/samples/white-aluminum.jpg',NULL,NULL,NULL,'semi-opaque',75.00,NULL,'Wipe clean with damp cloth','100% Aluminum',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-002-BLK-ALU','Charcoal Black Aluminum','Modern black aluminum with matte finish','#2C2C2C','Aluminum','Metal',NULL,NULL,0.00,0,1,1,'/images/samples/black-aluminum.jpg',NULL,NULL,NULL,'semi-opaque',80.00,NULL,'Wipe clean with damp cloth','100% Aluminum',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-003-WD-FAU','Natural Oak Faux Wood','Realistic oak wood grain pattern','#D2B48C','Faux Wood','Composite',NULL,NULL,2.99,0,1,1,'/images/samples/oak-faux-wood.jpg',NULL,NULL,NULL,'semi-opaque',70.00,NULL,'Dust regularly, wipe with damp cloth','PVC with wood grain finish',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-101-LIN-NAT','Natural Linen Weave','Elegant natural linen with loose weave','#F5F5DC','Linen','Natural Fiber',NULL,NULL,3.99,1,1,1,'/images/samples/natural-linen.jpg',NULL,NULL,NULL,'semi-sheer',30.00,NULL,'Dry clean only','100% Linen',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-102-SLK-CRM','Cream Silk Dupioni','Luxurious silk with subtle sheen','#FFF8DC','Silk','Natural Fiber',NULL,NULL,5.99,1,1,1,'/images/samples/cream-silk.jpg',NULL,NULL,NULL,'semi-opaque',60.00,NULL,'Dry clean only','100% Silk',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-103-COT-NVY','Navy Cotton Canvas','Heavy-duty cotton in rich navy blue','#000080','Cotton','Natural Fiber',NULL,NULL,2.99,0,1,1,'/images/samples/navy-cotton.jpg',NULL,NULL,NULL,'opaque',90.00,NULL,'Machine wash cold, hang dry','100% Cotton',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-201-CEL-WHT','White Cellular Honeycomb','Energy-efficient cellular shade material','#FAFAFA','Cellular Fabric','Synthetic',NULL,NULL,1.99,0,1,1,'/images/samples/white-cellular.jpg',NULL,NULL,NULL,'semi-opaque',65.00,NULL,'Vacuum or dust regularly','Polyester honeycomb',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30'),('SW-202-ROM-BEI','Beige Roman Weave','Classic roman shade with woven texture','#F5DEB3','Roman Weave','Natural Blend',NULL,NULL,3.99,0,1,1,'/images/samples/beige-roman.jpg',NULL,NULL,NULL,'semi-opaque',55.00,NULL,'Spot clean only','70% Cotton, 30% Polyester',5,'medium',NULL,NULL,NULL,0,1.00,'2025-06-09 20:37:30','2025-06-09 20:37:30');
/*!40000 ALTER TABLE `material_swatches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `material_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `texture` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durability_rating` int DEFAULT NULL,
  `care_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`material_id`),
  UNIQUE KEY `name` (`name`),
  KEY `material_type` (`material_type`),
  KEY `is_popular` (`is_popular`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

LOCK TABLES `materials` WRITE;
/*!40000 ALTER TABLE `materials` DISABLE KEYS */;
INSERT INTO `materials` VALUES (1,'Light Filtering','Softly filters light while maintaining privacy','semi-translucent',NULL,NULL,NULL,0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(2,'Blackout','Blocks out light completely for total darkness','opaque',NULL,NULL,NULL,0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(3,'Sheer','Lightweight fabric that gently diffuses light','translucent',NULL,NULL,NULL,0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05'),(4,'Room Darkening','Reduces light significantly without complete blackout','semi-opaque',NULL,NULL,NULL,0,1,'2025-06-16 21:38:05','2025-06-16 21:38:05');
/*!40000 ALTER TABLE `materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `measurement_requests`
--

DROP TABLE IF EXISTS `measurement_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `measurement_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `property_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time` time DEFAULT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `special_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `room_details` json DEFAULT NULL,
  `status` enum('pending','scheduled','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `measurement_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `measurement_requests_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `measurement_requests`
--

LOCK TABLES `measurement_requests` WRITE;
/*!40000 ALTER TABLE `measurement_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `measurement_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mount_types`
--

DROP TABLE IF EXISTS `mount_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mount_types` (
  `mount_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `installation_difficulty` enum('easy','moderate','difficult') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'moderate',
  `tools_required` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`mount_type_id`),
  UNIQUE KEY `name` (`name`),
  KEY `installation_difficulty` (`installation_difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mount_types`
--

LOCK TABLES `mount_types` WRITE;
/*!40000 ALTER TABLE `mount_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `mount_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_cancellation_requests`
--

DROP TABLE IF EXISTS `order_cancellation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_cancellation_requests` (
  `cancellation_request_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `vendor_id` int DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cancellation_request_id`),
  KEY `order_id` (`order_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `order_cancellation_requests_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_cancellation_requests_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_cancellation_requests`
--

LOCK TABLES `order_cancellation_requests` WRITE;
/*!40000 ALTER TABLE `order_cancellation_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_cancellation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_delivery_schedules`
--

DROP TABLE IF EXISTS `order_delivery_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_delivery_schedules` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `delivery_date` date NOT NULL,
  `time_slot_id` int NOT NULL,
  `specific_time_requested` time DEFAULT NULL COMMENT 'If customer requested specific time within slot',
  `customer_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alternative_recipient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_location` enum('front_door','back_door','garage','reception','mailroom','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'front_door',
  `location_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `access_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Gate codes, building access, etc.',
  `notification_preferences` json DEFAULT NULL COMMENT 'How to notify: SMS, email, phone call',
  `notify_on_day_before` tinyint(1) DEFAULT '1',
  `notify_on_delivery_day` tinyint(1) DEFAULT '1',
  `notify_one_hour_before` tinyint(1) DEFAULT '1',
  `status` enum('scheduled','confirmed','in_transit','delivered','failed','rescheduled','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `delivered_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Driver/carrier name',
  `delivery_photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Who actually received the delivery',
  `failure_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `failure_count` int DEFAULT '0',
  `original_delivery_date` date DEFAULT NULL,
  `rescheduled_from` int DEFAULT NULL COMMENT 'Previous schedule_id if rescheduled',
  `reschedule_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  UNIQUE KEY `unique_order_delivery` (`order_id`),
  KEY `fk_delivery_schedule_reschedule` (`rescheduled_from`),
  KEY `idx_delivery_date` (`delivery_date`),
  KEY `idx_time_slot` (`time_slot_id`,`delivery_date`),
  KEY `idx_status` (`status`),
  KEY `idx_delivery_status_date` (`status`,`delivery_date`),
  CONSTRAINT `fk_delivery_schedule_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_schedule_reschedule` FOREIGN KEY (`rescheduled_from`) REFERENCES `order_delivery_schedules` (`schedule_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_delivery_schedule_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `delivery_time_slots` (`slot_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_delivery_schedules`
--

LOCK TABLES `order_delivery_schedules` WRITE;
/*!40000 ALTER TABLE `order_delivery_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_delivery_schedules` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_prevent_overbooking` BEFORE INSERT ON `order_delivery_schedules` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_update_delivery_capacity` AFTER INSERT ON `order_delivery_schedules` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `order_fulfillment`
--

DROP TABLE IF EXISTS `order_fulfillment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_fulfillment` (
  `fulfillment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `tracking_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_delivery` date DEFAULT NULL,
  `installation_scheduled` tinyint(1) DEFAULT '0',
  `installation_date` date DEFAULT NULL,
  `installer_id` int DEFAULT NULL,
  `fulfillment_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fulfillment_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_tracking` (`tracking_number`),
  KEY `installer_id` (`installer_id`),
  CONSTRAINT `order_fulfillment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_fulfillment_ibfk_2` FOREIGN KEY (`installer_id`) REFERENCES `installers` (`installer_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_fulfillment`
--

LOCK TABLES `order_fulfillment` WRITE;
/*!40000 ALTER TABLE `order_fulfillment` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_fulfillment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `product_options` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `configuration_price` decimal(10,2) DEFAULT '0.00' COMMENT 'Additional price from product configuration options',
  `material_surcharge` decimal(10,2) DEFAULT '0.00' COMMENT 'Additional charge for premium materials',
  `price_breakdown` json DEFAULT NULL COMMENT 'Breakdown of base price, discounts, surcharges, etc.',
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,1,125.00,125.00,'{\"width\": 48.5, \"height\": 72, \"color_id\": 1, \"material_id\": 1, \"control_type\": \"cordless\"}','2025-06-16 21:38:05','2025-06-16 21:38:05',0.00,0.00,NULL),(2,1,3,1,125.00,125.00,'{\"width\": 48.5, \"height\": 72, \"color_id\": 1, \"material_id\": 1, \"control_type\": \"cordless\"}','2025-06-16 21:38:05','2025-06-16 21:38:05',0.00,0.00,NULL),(3,2,1,1,125.00,125.00,'{\"width\": 48.5, \"height\": 72, \"color_id\": 1, \"material_id\": 1, \"control_type\": \"cordless\"}','2025-06-16 21:38:05','2025-06-16 21:38:05',0.00,0.00,NULL),(4,2,3,1,125.00,125.00,'{\"width\": 48.5, \"height\": 72, \"color_id\": 1, \"material_id\": 1, \"control_type\": \"cordless\"}','2025-06-16 21:38:05','2025-06-16 21:38:05',0.00,0.00,NULL),(5,3,1,1,125.00,125.00,'{\"width\": 48, \"height\": 72, \"vendor_id\": 2}','2025-06-23 06:41:12','2025-06-23 06:41:12',0.00,0.00,NULL),(6,3,51,2,100.00,200.00,'{\"width\": 36, \"height\": 60, \"vendor_id\": 3}','2025-06-23 06:41:23','2025-06-23 06:41:23',0.00,0.00,NULL),(7,3,3,1,25.00,25.00,'{\"width\": 24, \"height\": 36, \"vendor_id\": 2}','2025-06-23 06:41:23','2025-06-23 06:41:23',0.00,0.00,NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_modifications`
--

DROP TABLE IF EXISTS `order_modifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_modifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `modification_type` enum('item_quantity','add_item','remove_item','shipping_address','shipping_method','special_instructions','cancel_order') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_state` json DEFAULT NULL,
  `new_state` json DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `previous_quantity` int DEFAULT NULL,
  `new_quantity` int DEFAULT NULL,
  `previous_price` decimal(10,2) DEFAULT NULL,
  `new_price` decimal(10,2) DEFAULT NULL,
  `price_difference` decimal(10,2) DEFAULT '0.00',
  `tax_difference` decimal(10,2) DEFAULT '0.00',
  `shipping_difference` decimal(10,2) DEFAULT '0.00',
  `total_difference` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','approved','rejected','applied','payment_required','refund_issued') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reason_for_modification` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `requires_additional_payment` tinyint(1) DEFAULT '0',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `stripe_refund_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `applied_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_modification_type` (`modification_type`),
  KEY `idx_requested_at` (`requested_at`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `order_modifications_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_modifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `order_modifications_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `order_modifications_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_modifications`
--

LOCK TABLES `order_modifications` WRITE;
/*!40000 ALTER TABLE `order_modifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_modifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_notes`
--

DROP TABLE IF EXISTS `order_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_notes` (
  `note_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `is_internal` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `order_notes_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_notes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_notes`
--

LOCK TABLES `order_notes` WRITE;
/*!40000 ALTER TABLE `order_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_refunds`
--

DROP TABLE IF EXISTS `order_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_refunds` (
  `refund_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int NOT NULL,
  `refund_method` enum('original_payment','store_credit','bank_transfer') COLLATE utf8mb4_unicode_ci DEFAULT 'original_payment',
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`refund_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `processed_by` (`processed_by`),
  CONSTRAINT `order_refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_refunds_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_refunds`
--

LOCK TABLES `order_refunds` WRITE;
/*!40000 ALTER TABLE `order_refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status`
--

DROP TABLE IF EXISTS `order_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `color_code` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_final` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status`
--

LOCK TABLES `order_status` WRITE;
/*!40000 ALTER TABLE `order_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_log`
--

DROP TABLE IF EXISTS `order_status_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `order_status_log_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_log_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_log`
--

LOCK TABLES `order_status_log` WRITE;
/*!40000 ALTER TABLE `order_status_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `guest_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `payment_status` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address_id` int DEFAULT NULL,
  `billing_address_id` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `preferred_delivery_date` date DEFAULT NULL COMMENT 'Customer preferred delivery date',
  `preferred_time_slot_id` int DEFAULT NULL COMMENT 'Reference to delivery_time_slots',
  `installation_appointment_id` int DEFAULT NULL COMMENT 'Reference to installation_appointments table',
  `vendor_id` int DEFAULT NULL COMMENT 'Reference to vendor_info table',
  `vendor_discount_id` int DEFAULT NULL COMMENT 'Reference to vendor_discounts table',
  `vendor_discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Vendor discount applied to order',
  `sales_staff_id` int DEFAULT NULL COMMENT 'Sales staff who handled this order',
  `campaign_id` int DEFAULT NULL COMMENT 'Reference to promotional_campaigns table',
  `coupon_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Applied coupon code',
  `volume_discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Volume discount applied',
  `seasonal_discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Amount discounted from seasonal promotions',
  `pricing_calculation_log` json DEFAULT NULL COMMENT 'Detailed log of how the final price was calculated',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `payment_status` (`payment_status`),
  KEY `fk_orders_shipping_address` (`shipping_address_id`),
  KEY `fk_orders_billing_address` (`billing_address_id`),
  KEY `fk_orders_delivery_slot` (`preferred_time_slot_id`),
  KEY `fk_orders_installation_appointment` (`installation_appointment_id`),
  KEY `fk_orders_vendor_discount` (`vendor_discount_id`),
  KEY `fk_orders_sales_staff` (`sales_staff_id`),
  KEY `fk_orders_vendor` (`vendor_id`),
  KEY `fk_orders_campaign` (`campaign_id`),
  CONSTRAINT `fk_orders_billing_address` FOREIGN KEY (`billing_address_id`) REFERENCES `user_shipping_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `promotional_campaigns` (`campaign_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_delivery_slot` FOREIGN KEY (`preferred_time_slot_id`) REFERENCES `delivery_time_slots` (`slot_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_installation_appointment` FOREIGN KEY (`installation_appointment_id`) REFERENCES `installation_appointments` (`appointment_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_sales_staff` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `user_shipping_addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_vendor_discount` FOREIGN KEY (`vendor_discount_id`) REFERENCES `vendor_discounts` (`discount_id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,3,NULL,'ORD-1750109885616-0','pending',399.98,32.00,15.00,0.00,446.98,'USD','paid',NULL,NULL,NULL,NULL,NULL,'2025-06-16 21:38:05','2025-06-16 21:38:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,0.00,0.00,NULL),(2,3,NULL,'ORD-1750109885623-1','processing',249.99,20.00,15.00,0.00,284.99,'USD','paid',NULL,NULL,NULL,NULL,NULL,'2025-06-16 21:38:05','2025-06-16 21:38:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,0.00,0.00,NULL),(3,1,NULL,'ORD-MULTIVENDOR-TEST','pending',350.00,28.00,15.00,0.00,393.00,'USD','pending','stripe',NULL,NULL,NULL,'Multi-vendor test order','2025-06-23 06:41:03','2025-06-23 06:41:03',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,0.00,0.00,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_update_campaign_stats` AFTER INSERT ON `orders` FOR EACH ROW BEGIN
    -- Update promotional campaign stats if campaign was used
    IF NEW.campaign_id IS NOT NULL THEN
        UPDATE promotional_campaigns 
        SET total_orders = total_orders + 1,
            total_revenue = total_revenue + NEW.total_amount,
            total_discount_given = total_discount_given + IFNULL(NEW.discount_amount, 0)
        WHERE campaign_id = NEW.campaign_id;
    END IF;
    
    -- Update coupon usage if coupon was used
    IF NEW.coupon_code IS NOT NULL THEN
        UPDATE coupon_codes 
        SET usage_count = usage_count + 1
        WHERE coupon_code = NEW.coupon_code;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_update_address_usage` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    -- Update shipping address usage if order has shipping address
    IF NEW.shipping_address_id IS NOT NULL AND NEW.shipping_address_id != OLD.shipping_address_id THEN
        UPDATE user_shipping_addresses 
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE address_id = NEW.shipping_address_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `payment_analytics`
--

DROP TABLE IF EXISTS `payment_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_transactions` int DEFAULT '0',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `successful_transactions` int DEFAULT '0',
  `failed_transactions` int DEFAULT '0',
  `average_amount` decimal(10,2) DEFAULT '0.00',
  `conversion_rate` decimal(5,4) DEFAULT '0.0000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date_method` (`date`,`payment_method`,`provider`),
  KEY `idx_date_provider` (`date`,`provider`),
  KEY `idx_method_performance` (`payment_method`,`successful_transactions`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_analytics`
--

LOCK TABLES `payment_analytics` WRITE;
/*!40000 ALTER TABLE `payment_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_disputes`
--

DROP TABLE IF EXISTS `payment_disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_disputes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `dispute_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_type` enum('chargeback','inquiry','retrieval_request','pre_arbitration') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','under_review','accepted','disputed','won','lost') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `reason_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `evidence_due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_dispute` (`provider`,`dispute_id`),
  KEY `payment_id` (`payment_id`),
  KEY `idx_status_due_date` (`status`,`evidence_due_date`),
  CONSTRAINT `payment_disputes_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_disputes`
--

LOCK TABLES `payment_disputes` WRITE;
/*!40000 ALTER TABLE `payment_disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_intents`
--

DROP TABLE IF EXISTS `payment_intents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_intents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `provider` enum('stripe','paypal','klarna','afterpay','affirm') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_order_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `status` enum('pending','completed','failed','cancelled','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `captured_amount` decimal(10,2) DEFAULT NULL,
  `order_data` json DEFAULT NULL,
  `processor_response` json DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_provider_order` (`provider`,`provider_order_id`),
  KEY `idx_user_provider` (`user_id`,`provider`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_intents`
--

LOCK TABLES `payment_intents` WRITE;
/*!40000 ALTER TABLE `payment_intents` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_intents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_method_configurations`
--

DROP TABLE IF EXISTS `payment_method_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_method_configurations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `min_amount` decimal(10,2) DEFAULT '0.01',
  `max_amount` decimal(10,2) DEFAULT '999999.99',
  `supported_currencies` json DEFAULT NULL,
  `supported_countries` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `configuration` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_method` (`provider`,`method_id`),
  KEY `idx_active_methods` (`is_active`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_method_configurations`
--

LOCK TABLES `payment_method_configurations` WRITE;
/*!40000 ALTER TABLE `payment_method_configurations` DISABLE KEYS */;
INSERT INTO `payment_method_configurations` VALUES (1,'stripe','card','Credit/Debit Card','Visa, Mastercard, American Express, Discover',0.50,999999.99,'[\"USD\", \"EUR\", \"GBP\", \"CAD\", \"AUD\"]','[\"US\", \"CA\", \"GB\", \"AU\", \"EU\"]',1,1,'{\"fee_fixed\": 0.3, \"fee_percentage\": 2.9, \"processing_time\": \"instant\"}','2025-06-08 23:39:43','2025-06-10 22:16:47'),(2,'paypal','paypal','PayPal','Pay with your PayPal account or PayPal Credit',0.01,10000.00,'[\"USD\", \"EUR\", \"GBP\", \"CAD\", \"AUD\"]','[\"US\", \"CA\", \"GB\", \"AU\", \"EU\"]',1,5,'{\"fee_fixed\": 0.49, \"fee_percentage\": 3.49, \"processing_time\": \"instant\"}','2025-06-08 23:39:43','2025-06-10 22:16:47'),(3,'klarna','klarna','Klarna','Pay in 4 interest-free installments',1.00,10000.00,'[\"USD\", \"EUR\", \"GBP\", \"SEK\"]','[\"US\", \"CA\", \"GB\", \"SE\", \"DE\", \"AT\"]',1,6,'{\"credit_check\": \"soft\", \"installments\": 4, \"interest_rate\": 0, \"installment_frequency\": \"bi_weekly\"}','2025-06-08 23:39:43','2025-06-10 22:16:47'),(4,'afterpay','afterpay','Afterpay','Pay in 4 installments, always interest-free',1.00,4000.00,'[\"USD\", \"AUD\", \"CAD\", \"GBP\"]','[\"US\", \"CA\", \"AU\", \"GB\"]',1,7,'{\"credit_check\": \"soft\", \"installments\": 4, \"interest_rate\": 0, \"installment_frequency\": \"bi_weekly\"}','2025-06-08 23:39:43','2025-06-10 22:16:47'),(5,'affirm','affirm','Affirm','Monthly payments as low as 0% APR',50.00,17500.00,'[\"USD\", \"CAD\"]','[\"US\", \"CA\"]',1,8,'{\"credit_check\": \"soft\", \"installments\": [3, 6, 12, 18, 24, 36], \"prequalification\": true, \"interest_rate_range\": [0, 36], \"installment_frequency\": \"monthly\"}','2025-06-08 23:39:43','2025-06-10 22:16:47'),(6,'stripe','apple_pay','Apple Pay','Pay securely with Touch ID or Face ID',0.50,999999.99,'[\"USD\", \"EUR\", \"GBP\", \"CAD\"]','[\"US\", \"CA\", \"GB\", \"AU\"]',1,2,'{\"fee_fixed\": 0.3, \"fee_percentage\": 2.9, \"processing_time\": \"instant\", \"device_requirements\": [\"iOS\", \"macOS\", \"Safari\"]}','2025-06-10 22:14:12','2025-06-10 22:16:47'),(7,'stripe','google_pay','Google Pay','Pay quickly with your Google account',0.50,999999.99,'[\"USD\", \"EUR\", \"GBP\", \"CAD\"]','[\"US\", \"CA\", \"GB\", \"AU\"]',1,3,'{\"fee_fixed\": 0.3, \"fee_percentage\": 2.9, \"processing_time\": \"instant\", \"device_requirements\": [\"Android\", \"Chrome\"]}','2025-06-10 22:14:12','2025-06-10 22:16:47'),(8,'stripe','ach','Bank Transfer (ACH)','Direct debit from your US bank account',0.50,500000.00,'[\"USD\"]','[\"US\"]',1,4,'{\"fee_fixed\": 0.8, \"processing_time\": \"3-5 business days\"}','2025-06-10 22:14:12','2025-06-10 22:16:47');
/*!40000 ALTER TABLE `payment_method_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_refunds`
--

DROP TABLE IF EXISTS `payment_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `refund_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `reason` enum('requested_by_customer','duplicate','fraudulent','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'requested_by_customer',
  `reason_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','succeeded','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `processor_response` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_refund` (`provider`,`refund_id`),
  KEY `idx_payment_refunds` (`payment_id`),
  KEY `idx_status_date` (`status`,`created_at`),
  CONSTRAINT `payment_refunds_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_refunds`
--

LOCK TABLES `payment_refunds` WRITE;
/*!40000 ALTER TABLE `payment_refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `payment_method` enum('credit_card','debit_card','paypal','stripe','bank_transfer','klarna','afterpay','affirm','apple_pay','google_pay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','processing','completed','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `order_id` (`order_id`),
  KEY `payment_status` (`payment_status`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payout_requests`
--

DROP TABLE IF EXISTS `payout_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `requested_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected','processed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_status` (`status`),
  KEY `processed_by` (`processed_by`),
  CONSTRAINT `payout_requests_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `payout_requests_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payout_requests`
--

LOCK TABLES `payout_requests` WRITE;
/*!40000 ALTER TABLE `payout_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `payout_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_alerts`
--

DROP TABLE IF EXISTS `price_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_alerts` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `target_price` decimal(10,2) DEFAULT NULL COMMENT 'Alert when price drops to this level',
  `alert_type` enum('price_drop','back_in_stock','price_change') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_checked_price` decimal(10,2) DEFAULT NULL,
  `last_notification_sent` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`alert_id`),
  KEY `idx_price_alerts_user` (`user_id`),
  KEY `idx_price_alerts_product` (`product_id`),
  KEY `idx_active_alerts` (`is_active`),
  CONSTRAINT `fk_price_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_alerts`
--

LOCK TABLES `price_alerts` WRITE;
/*!40000 ALTER TABLE `price_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_matrix`
--

DROP TABLE IF EXISTS `price_matrix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_matrix` (
  `price_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `width_min` decimal(5,2) NOT NULL,
  `width_max` decimal(5,2) NOT NULL,
  `height_min` decimal(5,2) NOT NULL,
  `height_max` decimal(5,2) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `price_per_sqft` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`price_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `price_matrix_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_matrix`
--

LOCK TABLES `price_matrix` WRITE;
/*!40000 ALTER TABLE `price_matrix` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_matrix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_tiers`
--

DROP TABLE IF EXISTS `pricing_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_tiers` (
  `tier_id` int NOT NULL AUTO_INCREMENT,
  `tier_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `minimum_quantity` int DEFAULT '1',
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `customer_type` enum('all','retail','commercial','trade') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `discount_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type of discount: percentage, fixed_amount, price_override, etc.',
  `discount_value` decimal(8,2) NOT NULL,
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Maximum discount cap for percentage discounts',
  `applies_to` enum('product','category','brand','order_total') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_ids` json DEFAULT NULL COMMENT 'Array of product/category/brand IDs this tier applies to',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `priority` int DEFAULT '100',
  `can_stack_with_others` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tier_id`),
  UNIQUE KEY `tier_code` (`tier_code`),
  KEY `idx_tier_code` (`tier_code`),
  KEY `idx_active_tiers` (`is_active`,`priority`),
  KEY `idx_validity_dates` (`valid_from`,`valid_until`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_tiers`
--

LOCK TABLES `pricing_tiers` WRITE;
/*!40000 ALTER TABLE `pricing_tiers` DISABLE KEYS */;
INSERT INTO `pricing_tiers` VALUES (1,'Retail Customer','RETAIL',1,0.00,'all','percentage',0.00,NULL,'order_total',NULL,1,NULL,NULL,100,0,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(2,'Trade Customer - Level 1','TRADE_L1',1,0.00,'all','percentage',10.00,NULL,'order_total',NULL,1,NULL,NULL,100,0,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(3,'Trade Customer - Level 2','TRADE_L2',1,0.00,'all','percentage',15.00,NULL,'order_total',NULL,1,NULL,NULL,100,0,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(4,'Commercial - Small','COMMERCIAL_SM',10,0.00,'all','percentage',12.00,NULL,'order_total',NULL,1,NULL,NULL,100,0,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(5,'Commercial - Large','COMMERCIAL_LG',50,0.00,'all','percentage',20.00,NULL,'order_total',NULL,1,NULL,NULL,100,0,'2025-06-10 22:06:39','2025-06-10 22:06:39');
/*!40000 ALTER TABLE `pricing_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_associations`
--

DROP TABLE IF EXISTS `product_associations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_associations` (
  `association_id` int NOT NULL AUTO_INCREMENT,
  `product_a_id` int NOT NULL,
  `product_b_id` int NOT NULL,
  `association_strength` decimal(5,4) DEFAULT '0.0000' COMMENT 'Confidence score 0-1',
  `times_bought_together` int DEFAULT '1',
  `association_type` enum('frequently_together','substitute','complement','upgrade') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'frequently_together',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`association_id`),
  UNIQUE KEY `unique_product_pair` (`product_a_id`,`product_b_id`),
  KEY `idx_product_a` (`product_a_id`),
  KEY `idx_product_b` (`product_b_id`),
  KEY `idx_association_strength` (`association_strength` DESC),
  KEY `idx_association_type` (`association_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_associations`
--

LOCK TABLES `product_associations` WRITE;
/*!40000 ALTER TABLE `product_associations` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_associations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_bundle_items`
--

DROP TABLE IF EXISTS `product_bundle_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_bundle_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bundle_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `is_required` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bundle_id` (`bundle_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_bundle_items_ibfk_1` FOREIGN KEY (`bundle_id`) REFERENCES `product_bundles` (`bundle_id`) ON DELETE CASCADE,
  CONSTRAINT `product_bundle_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_bundle_items`
--

LOCK TABLES `product_bundle_items` WRITE;
/*!40000 ALTER TABLE `product_bundle_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_bundle_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_bundles`
--

DROP TABLE IF EXISTS `product_bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_bundles` (
  `bundle_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `bundle_price` decimal(10,2) DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`bundle_id`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_bundles`
--

LOCK TABLES `product_bundles` WRITE;
/*!40000 ALTER TABLE `product_bundles` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `product_id` int NOT NULL,
  `category_id` int NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`category_id`),
  KEY `product_id` (`product_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `product_categories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (10,12,0,'2025-07-01 04:29:38'),(10,21,0,'2025-07-01 04:29:38'),(242,1,0,'2025-06-30 19:15:13'),(242,4,0,'2025-06-30 19:15:13'),(243,2,1,'2025-06-20 18:17:20'),(243,21,0,'2025-06-20 18:17:20'),(243,22,0,'2025-06-20 18:17:20');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_dimensions`
--

DROP TABLE IF EXISTS `product_dimensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_dimensions` (
  `dimension_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `dimension_type_id` int NOT NULL,
  `min_value` decimal(8,3) NOT NULL,
  `max_value` decimal(8,3) NOT NULL,
  `increment_value` decimal(8,3) DEFAULT '0.125',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'inches',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dimension_id`),
  UNIQUE KEY `product_dimension_type` (`product_id`,`dimension_type_id`),
  KEY `product_id` (`product_id`),
  KEY `dimension_type_id` (`dimension_type_id`),
  CONSTRAINT `product_dimensions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_dimensions_ibfk_2` FOREIGN KEY (`dimension_type_id`) REFERENCES `dimension_types` (`dimension_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_dimensions`
--

LOCK TABLES `product_dimensions` WRITE;
/*!40000 ALTER TABLE `product_dimensions` DISABLE KEYS */;
INSERT INTO `product_dimensions` VALUES (35,242,1,12.000,95.000,0.125,'inches','2025-06-30 19:15:13','2025-06-30 19:15:13'),(36,242,2,12.000,300.000,0.125,'inches','2025-06-30 19:15:13','2025-06-30 19:15:13'),(37,10,1,12.000,96.000,0.125,'inches','2025-07-01 04:29:38','2025-07-01 04:29:38'),(38,10,2,12.000,120.000,0.125,'inches','2025-07-01 04:29:38','2025-07-01 04:29:38');
/*!40000 ALTER TABLE `product_dimensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_fabric_images`
--

DROP TABLE IF EXISTS `product_fabric_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_fabric_images` (
  `fabric_image_id` int NOT NULL AUTO_INCREMENT,
  `fabric_option_id` int NOT NULL,
  `product_id` int NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_alt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_size` int DEFAULT NULL COMMENT 'File size in bytes',
  `image_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MIME type',
  `display_order` int DEFAULT '0',
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fabric_image_id`),
  KEY `idx_fabric_images` (`fabric_option_id`,`display_order`),
  KEY `idx_primary_image` (`fabric_option_id`,`is_primary`),
  KEY `idx_product_fabric_images` (`product_id`,`fabric_option_id`),
  CONSTRAINT `product_fabric_images_option_fk` FOREIGN KEY (`fabric_option_id`) REFERENCES `product_fabric_options` (`fabric_option_id`) ON DELETE CASCADE,
  CONSTRAINT `product_fabric_images_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_fabric_images`
--

LOCK TABLES `product_fabric_images` WRITE;
/*!40000 ALTER TABLE `product_fabric_images` DISABLE KEYS */;
INSERT INTO `product_fabric_images` VALUES (133,142,242,'/uploads/fabric/vendor-2-1751247643033-lvygrqb3v8s.png','Screenshot 2025-06-27 at 11.13.28 PM.png','Arctic White',0,'image/jpeg',0,1,'2025-06-30 19:15:13','2025-06-30 19:15:13'),(134,143,242,'/uploads/fabric/vendor-2-1751310913198-oduvunwg7v.png','Facebook_Screenshot.png','Midnight Blue',0,'image/jpeg',0,1,'2025-06-30 19:15:13','2025-06-30 19:15:13');
/*!40000 ALTER TABLE `product_fabric_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_fabric_options`
--

DROP TABLE IF EXISTS `product_fabric_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_fabric_options` (
  `fabric_option_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `fabric_type` enum('coloredFabric','sheerFabric','blackoutFabric','colored','sheer','blackout','designer','woven','natural') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fabric_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `texture_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `texture_scale` decimal(5,2) DEFAULT '1.00',
  `material_finish` enum('matte','satin','glossy','metallic') COLLATE utf8mb4_unicode_ci DEFAULT 'matte',
  `opacity` decimal(3,2) DEFAULT '1.00',
  `render_priority` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fabric_option_id`),
  KEY `idx_product_fabric` (`product_id`,`fabric_type`),
  KEY `idx_vendor_fabric` (`vendor_id`,`fabric_type`),
  KEY `idx_fabric_enabled` (`is_enabled`),
  KEY `idx_product_fabric_enabled` (`product_id`,`fabric_type`,`is_enabled`),
  CONSTRAINT `product_fabric_options_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_fabric_options_vendor_fk` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_fabric_options`
--

LOCK TABLES `product_fabric_options` WRITE;
/*!40000 ALTER TABLE `product_fabric_options` DISABLE KEYS */;
INSERT INTO `product_fabric_options` VALUES (142,242,5,'colored','Arctic White',1,NULL,'/textures/fabrics/arctic-white-texture.jpg',1.00,'matte',1.00,0,'2025-06-30 19:15:13','2025-06-30 19:15:13'),(143,242,5,'colored','Midnight Blue',1,NULL,'/textures/fabrics/midnight-blue-texture.jpg',1.00,'matte',1.00,0,'2025-06-30 19:15:13','2025-06-30 19:15:13'),(144,242,5,'blackout','Complete Blackout',1,NULL,'/textures/fabrics/blackout-texture.jpg',1.00,'matte',1.00,0,'2025-06-30 19:15:13','2025-06-30 19:15:13');
/*!40000 ALTER TABLE `product_fabric_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_fabric_pricing`
--

DROP TABLE IF EXISTS `product_fabric_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_fabric_pricing` (
  `fabric_pricing_id` int NOT NULL AUTO_INCREMENT,
  `fabric_option_id` int NOT NULL,
  `product_id` int NOT NULL,
  `min_width` decimal(8,3) NOT NULL COMMENT 'Minimum width in inches',
  `max_width` decimal(8,3) NOT NULL COMMENT 'Maximum width in inches',
  `min_height` decimal(8,3) DEFAULT NULL COMMENT 'Minimum height in inches (for future use)',
  `max_height` decimal(8,3) DEFAULT NULL COMMENT 'Maximum height in inches (for future use)',
  `price_per_sqft` decimal(10,2) NOT NULL COMMENT 'Price per square foot in dollars, standardized to 2 decimal places',
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `effective_date` date DEFAULT NULL,
  `expires_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fabric_pricing_id`),
  KEY `idx_fabric_pricing` (`fabric_option_id`,`is_active`),
  KEY `idx_width_range` (`min_width`,`max_width`),
  KEY `idx_price_dates` (`effective_date`,`expires_date`),
  KEY `idx_product_fabric_pricing` (`product_id`,`fabric_option_id`),
  CONSTRAINT `product_fabric_pricing_option_fk` FOREIGN KEY (`fabric_option_id`) REFERENCES `product_fabric_options` (`fabric_option_id`) ON DELETE CASCADE,
  CONSTRAINT `product_fabric_pricing_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=716 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_fabric_pricing`
--

LOCK TABLES `product_fabric_pricing` WRITE;
/*!40000 ALTER TABLE `product_fabric_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_fabric_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_features`
--

DROP TABLE IF EXISTS `product_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `feature_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_feature` (`product_id`,`feature_id`),
  KEY `product_id` (`product_id`),
  KEY `feature_id` (`feature_id`),
  CONSTRAINT `product_features_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_features_ibfk_2` FOREIGN KEY (`feature_id`) REFERENCES `features` (`feature_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_features`
--

LOCK TABLES `product_features` WRITE;
/*!40000 ALTER TABLE `product_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `product_id` (`product_id`),
  KEY `is_primary` (`is_primary`),
  KEY `display_order` (`display_order`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (22,243,'/uploads/products/product_243_1750195341922_b337o93yu6.png',NULL,0,0,'2025-06-20 18:17:20','2025-06-20 18:17:20'),(27,242,'/uploads/products/vendor-2-1751247995862-5qvak2le7ir.png','242_Screenshot 2025-06-25 at 12.36.55 PM.png',0,0,'2025-06-30 19:15:13','2025-06-30 19:15:13');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_inventory`
--

DROP TABLE IF EXISTS `product_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `stock_quantity` int DEFAULT '0',
  `reserved_quantity` int DEFAULT '0',
  `low_stock_threshold` int DEFAULT '5',
  `allow_backorder` tinyint(1) DEFAULT '0',
  `reorder_point` int DEFAULT '10',
  `reorder_quantity` int DEFAULT '50',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `unique_product` (`product_id`),
  KEY `idx_stock_quantity` (`stock_quantity`),
  KEY `idx_low_stock` (`low_stock_threshold`),
  CONSTRAINT `product_inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_inventory`
--

LOCK TABLES `product_inventory` WRITE;
/*!40000 ALTER TABLE `product_inventory` DISABLE KEYS */;
INSERT INTO `product_inventory` VALUES (1,1,0,0,5,0,10,50,'2025-06-16 18:04:11'),(2,3,0,0,5,0,10,50,'2025-06-16 18:04:11'),(3,4,0,0,5,0,10,50,'2025-06-16 18:04:11'),(4,5,0,0,5,0,10,50,'2025-06-16 18:04:11'),(5,6,0,0,5,0,10,50,'2025-06-16 18:04:11'),(6,7,0,0,5,0,10,50,'2025-06-16 18:04:11'),(7,8,0,0,5,0,10,50,'2025-06-16 18:04:11'),(8,9,0,0,5,0,10,50,'2025-06-16 18:04:11'),(9,10,0,0,5,0,10,50,'2025-06-16 18:04:11'),(10,11,0,0,5,0,10,50,'2025-06-16 18:04:11'),(11,12,0,0,5,0,10,50,'2025-06-16 18:04:11'),(12,13,0,0,5,0,10,50,'2025-06-16 18:04:11'),(13,14,0,0,5,0,10,50,'2025-06-16 18:04:11'),(14,15,0,0,5,0,10,50,'2025-06-16 18:04:11'),(15,16,0,0,5,0,10,50,'2025-06-16 18:04:11'),(16,17,0,0,5,0,10,50,'2025-06-16 18:04:11'),(17,18,0,0,5,0,10,50,'2025-06-16 18:04:11'),(18,19,0,0,5,0,10,50,'2025-06-16 18:04:11'),(19,20,0,0,5,0,10,50,'2025-06-16 18:04:11'),(20,21,0,0,5,0,10,50,'2025-06-16 18:04:11'),(21,22,0,0,5,0,10,50,'2025-06-16 18:04:11'),(22,23,0,0,5,0,10,50,'2025-06-16 18:04:11'),(23,24,0,0,5,0,10,50,'2025-06-16 18:04:11'),(24,25,0,0,5,0,10,50,'2025-06-16 18:04:11'),(25,26,0,0,5,0,10,50,'2025-06-16 18:04:11'),(26,27,0,0,5,0,10,50,'2025-06-16 18:04:11'),(27,28,0,0,5,0,10,50,'2025-06-16 18:04:11'),(28,29,0,0,5,0,10,50,'2025-06-16 18:04:11'),(29,30,0,0,5,0,10,50,'2025-06-16 18:04:11'),(30,31,0,0,5,0,10,50,'2025-06-16 18:04:11'),(31,32,0,0,5,0,10,50,'2025-06-16 18:04:11'),(32,33,0,0,5,0,10,50,'2025-06-16 18:04:11'),(33,34,0,0,5,0,10,50,'2025-06-16 18:04:11'),(34,35,0,0,5,0,10,50,'2025-06-16 18:04:11'),(35,36,0,0,5,0,10,50,'2025-06-16 18:04:11'),(36,37,0,0,5,0,10,50,'2025-06-16 18:04:11'),(37,38,0,0,5,0,10,50,'2025-06-16 18:04:11'),(38,39,0,0,5,0,10,50,'2025-06-16 18:04:11'),(39,40,0,0,5,0,10,50,'2025-06-16 18:04:11'),(40,41,0,0,5,0,10,50,'2025-06-16 18:04:11'),(41,42,0,0,5,0,10,50,'2025-06-16 18:04:11'),(42,43,0,0,5,0,10,50,'2025-06-16 18:04:11'),(43,44,0,0,5,0,10,50,'2025-06-16 18:04:11'),(44,45,0,0,5,0,10,50,'2025-06-16 18:04:11'),(45,46,0,0,5,0,10,50,'2025-06-16 18:04:11'),(46,47,0,0,5,0,10,50,'2025-06-16 18:04:11'),(47,48,0,0,5,0,10,50,'2025-06-16 18:04:11'),(48,49,0,0,5,0,10,50,'2025-06-16 18:04:11'),(49,50,0,0,5,0,10,50,'2025-06-16 18:04:11'),(50,51,0,0,5,0,10,50,'2025-06-16 18:04:11'),(51,52,0,0,5,0,10,50,'2025-06-16 18:04:11'),(52,53,0,0,5,0,10,50,'2025-06-16 18:04:11'),(53,54,0,0,5,0,10,50,'2025-06-16 18:04:11'),(54,55,0,0,5,0,10,50,'2025-06-16 18:04:11'),(55,56,0,0,5,0,10,50,'2025-06-16 18:04:11'),(56,57,0,0,5,0,10,50,'2025-06-16 18:04:11'),(57,58,0,0,5,0,10,50,'2025-06-16 18:04:11'),(58,59,0,0,5,0,10,50,'2025-06-16 18:04:11'),(59,60,0,0,5,0,10,50,'2025-06-16 18:04:11'),(60,61,0,0,5,0,10,50,'2025-06-16 18:04:11'),(61,62,0,0,5,0,10,50,'2025-06-16 18:04:11'),(62,63,0,0,5,0,10,50,'2025-06-16 18:04:11'),(63,64,0,0,5,0,10,50,'2025-06-16 18:04:11'),(64,65,0,0,5,0,10,50,'2025-06-16 18:04:11'),(65,66,0,0,5,0,10,50,'2025-06-16 18:04:11'),(66,67,0,0,5,0,10,50,'2025-06-16 18:04:11'),(67,68,0,0,5,0,10,50,'2025-06-16 18:04:11'),(68,69,0,0,5,0,10,50,'2025-06-16 18:04:11'),(69,70,0,0,5,0,10,50,'2025-06-16 18:04:11'),(70,71,0,0,5,0,10,50,'2025-06-16 18:04:11'),(71,72,0,0,5,0,10,50,'2025-06-16 18:04:11'),(72,73,0,0,5,0,10,50,'2025-06-16 18:04:11'),(73,74,0,0,5,0,10,50,'2025-06-16 18:04:11'),(74,75,0,0,5,0,10,50,'2025-06-16 18:04:11'),(75,76,0,0,5,0,10,50,'2025-06-16 18:04:11'),(76,77,0,0,5,0,10,50,'2025-06-16 18:04:11'),(77,78,0,0,5,0,10,50,'2025-06-16 18:04:11'),(78,79,0,0,5,0,10,50,'2025-06-16 18:04:11'),(79,80,0,0,5,0,10,50,'2025-06-16 18:04:11'),(80,81,0,0,5,0,10,50,'2025-06-16 18:04:11'),(81,82,0,0,5,0,10,50,'2025-06-16 18:04:11'),(82,83,0,0,5,0,10,50,'2025-06-16 18:04:11'),(83,84,0,0,5,0,10,50,'2025-06-16 18:04:11'),(84,85,0,0,5,0,10,50,'2025-06-16 18:04:11'),(85,86,0,0,5,0,10,50,'2025-06-16 18:04:11'),(86,87,0,0,5,0,10,50,'2025-06-16 18:04:11'),(87,88,0,0,5,0,10,50,'2025-06-16 18:04:11'),(88,89,0,0,5,0,10,50,'2025-06-16 18:04:11'),(89,90,0,0,5,0,10,50,'2025-06-16 18:04:11'),(90,91,0,0,5,0,10,50,'2025-06-16 18:04:11'),(91,92,0,0,5,0,10,50,'2025-06-16 18:04:11'),(92,93,0,0,5,0,10,50,'2025-06-16 18:04:11'),(93,94,0,0,5,0,10,50,'2025-06-16 18:04:11'),(94,95,0,0,5,0,10,50,'2025-06-16 18:04:11'),(95,96,0,0,5,0,10,50,'2025-06-16 18:04:11'),(96,97,0,0,5,0,10,50,'2025-06-16 18:04:11'),(97,98,0,0,5,0,10,50,'2025-06-16 18:04:11'),(98,99,0,0,5,0,10,50,'2025-06-16 18:04:11'),(99,100,0,0,5,0,10,50,'2025-06-16 18:04:11'),(100,101,0,0,5,0,10,50,'2025-06-16 18:04:11'),(101,102,0,0,5,0,10,50,'2025-06-16 18:04:11'),(102,103,0,0,5,0,10,50,'2025-06-16 18:04:11'),(103,104,0,0,5,0,10,50,'2025-06-16 18:04:11'),(104,105,0,0,5,0,10,50,'2025-06-16 18:04:11'),(105,106,0,0,5,0,10,50,'2025-06-16 18:04:11'),(106,107,0,0,5,0,10,50,'2025-06-16 18:04:11'),(107,108,0,0,5,0,10,50,'2025-06-16 18:04:11'),(108,109,0,0,5,0,10,50,'2025-06-16 18:04:11'),(109,110,0,0,5,0,10,50,'2025-06-16 18:04:11'),(110,111,0,0,5,0,10,50,'2025-06-16 18:04:11'),(111,112,0,0,5,0,10,50,'2025-06-16 18:04:11'),(112,113,0,0,5,0,10,50,'2025-06-16 18:04:11'),(113,114,0,0,5,0,10,50,'2025-06-16 18:04:11'),(114,115,0,0,5,0,10,50,'2025-06-16 18:04:11'),(115,116,0,0,5,0,10,50,'2025-06-16 18:04:11'),(116,117,0,0,5,0,10,50,'2025-06-16 18:04:11'),(117,118,0,0,5,0,10,50,'2025-06-16 18:04:11'),(118,119,0,0,5,0,10,50,'2025-06-16 18:04:11'),(119,120,0,0,5,0,10,50,'2025-06-16 18:04:11'),(120,121,0,0,5,0,10,50,'2025-06-16 18:04:11'),(121,122,0,0,5,0,10,50,'2025-06-16 18:04:11'),(122,123,0,0,5,0,10,50,'2025-06-16 18:04:11'),(123,124,0,0,5,0,10,50,'2025-06-16 18:04:11'),(124,125,0,0,5,0,10,50,'2025-06-16 18:04:11'),(125,126,0,0,5,0,10,50,'2025-06-16 18:04:11'),(126,127,0,0,5,0,10,50,'2025-06-16 18:04:11'),(127,128,0,0,5,0,10,50,'2025-06-16 18:04:11'),(128,129,0,0,5,0,10,50,'2025-06-16 18:04:11'),(129,130,0,0,5,0,10,50,'2025-06-16 18:04:11'),(130,131,0,0,5,0,10,50,'2025-06-16 18:04:11'),(131,132,0,0,5,0,10,50,'2025-06-16 18:04:11'),(132,133,0,0,5,0,10,50,'2025-06-16 18:04:11'),(133,134,0,0,5,0,10,50,'2025-06-16 18:04:11'),(134,135,0,0,5,0,10,50,'2025-06-16 18:04:11'),(135,136,0,0,5,0,10,50,'2025-06-16 18:04:11'),(136,137,0,0,5,0,10,50,'2025-06-16 18:04:11'),(137,138,0,0,5,0,10,50,'2025-06-16 18:04:11'),(138,139,0,0,5,0,10,50,'2025-06-16 18:04:11'),(139,140,0,0,5,0,10,50,'2025-06-16 18:04:11'),(140,141,0,0,5,0,10,50,'2025-06-16 18:04:11'),(141,142,0,0,5,0,10,50,'2025-06-16 18:04:11'),(142,143,0,0,5,0,10,50,'2025-06-16 18:04:11'),(143,144,0,0,5,0,10,50,'2025-06-16 18:04:11'),(144,145,0,0,5,0,10,50,'2025-06-16 18:04:11'),(145,146,0,0,5,0,10,50,'2025-06-16 18:04:11'),(146,147,0,0,5,0,10,50,'2025-06-16 18:04:11'),(147,148,0,0,5,0,10,50,'2025-06-16 18:04:11'),(148,149,0,0,5,0,10,50,'2025-06-16 18:04:11'),(149,150,0,0,5,0,10,50,'2025-06-16 18:04:11'),(150,151,0,0,5,0,10,50,'2025-06-16 18:04:11'),(151,152,0,0,5,0,10,50,'2025-06-16 18:04:11'),(152,153,0,0,5,0,10,50,'2025-06-16 18:04:11'),(153,154,0,0,5,0,10,50,'2025-06-16 18:04:11'),(154,155,0,0,5,0,10,50,'2025-06-16 18:04:11'),(155,156,0,0,5,0,10,50,'2025-06-16 18:04:11'),(156,157,0,0,5,0,10,50,'2025-06-16 18:04:11'),(157,158,0,0,5,0,10,50,'2025-06-16 18:04:11'),(158,159,0,0,5,0,10,50,'2025-06-16 18:04:11'),(159,160,0,0,5,0,10,50,'2025-06-16 18:04:11'),(160,161,0,0,5,0,10,50,'2025-06-16 18:04:11'),(161,162,0,0,5,0,10,50,'2025-06-16 18:04:11'),(162,163,0,0,5,0,10,50,'2025-06-16 18:04:11'),(163,164,0,0,5,0,10,50,'2025-06-16 18:04:11'),(164,165,0,0,5,0,10,50,'2025-06-16 18:04:11'),(165,166,0,0,5,0,10,50,'2025-06-16 18:04:11'),(166,167,0,0,5,0,10,50,'2025-06-16 18:04:11'),(167,168,0,0,5,0,10,50,'2025-06-16 18:04:11'),(168,169,0,0,5,0,10,50,'2025-06-16 18:04:11'),(169,170,0,0,5,0,10,50,'2025-06-16 18:04:11'),(170,171,0,0,5,0,10,50,'2025-06-16 18:04:11'),(171,172,0,0,5,0,10,50,'2025-06-16 18:04:11'),(172,173,0,0,5,0,10,50,'2025-06-16 18:04:11'),(173,174,0,0,5,0,10,50,'2025-06-16 18:04:11'),(174,175,0,0,5,0,10,50,'2025-06-16 18:04:11'),(175,176,0,0,5,0,10,50,'2025-06-16 18:04:11'),(176,177,0,0,5,0,10,50,'2025-06-16 18:04:11'),(177,178,0,0,5,0,10,50,'2025-06-16 18:04:11'),(178,179,0,0,5,0,10,50,'2025-06-16 18:04:11'),(179,180,0,0,5,0,10,50,'2025-06-16 18:04:11'),(180,181,0,0,5,0,10,50,'2025-06-16 18:04:11'),(181,182,0,0,5,0,10,50,'2025-06-16 18:04:11'),(182,183,0,0,5,0,10,50,'2025-06-16 18:04:11'),(183,184,0,0,5,0,10,50,'2025-06-16 18:04:11'),(184,185,0,0,5,0,10,50,'2025-06-16 18:04:11'),(185,186,0,0,5,0,10,50,'2025-06-16 18:04:11'),(186,187,0,0,5,0,10,50,'2025-06-16 18:04:11'),(187,188,0,0,5,0,10,50,'2025-06-16 18:04:11'),(188,189,0,0,5,0,10,50,'2025-06-16 18:04:11'),(189,190,0,0,5,0,10,50,'2025-06-16 18:04:11'),(190,191,0,0,5,0,10,50,'2025-06-16 18:04:11'),(191,192,0,0,5,0,10,50,'2025-06-16 18:04:11'),(192,193,0,0,5,0,10,50,'2025-06-16 18:04:11'),(193,194,0,0,5,0,10,50,'2025-06-16 18:04:11'),(194,195,0,0,5,0,10,50,'2025-06-16 18:04:11'),(195,196,0,0,5,0,10,50,'2025-06-16 18:04:11'),(196,197,0,0,5,0,10,50,'2025-06-16 18:04:11'),(197,198,0,0,5,0,10,50,'2025-06-16 18:04:11'),(198,199,0,0,5,0,10,50,'2025-06-16 18:04:11'),(199,200,0,0,5,0,10,50,'2025-06-16 18:04:11'),(200,201,0,0,5,0,10,50,'2025-06-16 18:04:11'),(201,202,0,0,5,0,10,50,'2025-06-16 18:04:11'),(202,203,0,0,5,0,10,50,'2025-06-16 18:04:11'),(203,204,0,0,5,0,10,50,'2025-06-16 18:04:11'),(204,205,0,0,5,0,10,50,'2025-06-16 18:04:11'),(205,206,0,0,5,0,10,50,'2025-06-16 18:04:11'),(206,207,0,0,5,0,10,50,'2025-06-16 18:04:11'),(207,208,0,0,5,0,10,50,'2025-06-16 18:04:11'),(208,209,0,0,5,0,10,50,'2025-06-16 18:04:11'),(209,210,0,0,5,0,10,50,'2025-06-16 18:04:11'),(210,211,0,0,5,0,10,50,'2025-06-16 18:04:11'),(211,212,0,0,5,0,10,50,'2025-06-16 18:04:11'),(212,213,0,0,5,0,10,50,'2025-06-16 18:04:11'),(213,214,0,0,5,0,10,50,'2025-06-16 18:04:11'),(214,215,0,0,5,0,10,50,'2025-06-16 18:04:11'),(215,216,0,0,5,0,10,50,'2025-06-16 18:04:11'),(216,217,0,0,5,0,10,50,'2025-06-16 18:04:11'),(217,218,0,0,5,0,10,50,'2025-06-16 18:04:11'),(218,219,0,0,5,0,10,50,'2025-06-16 18:04:11'),(219,220,0,0,5,0,10,50,'2025-06-16 18:04:11'),(220,221,0,0,5,0,10,50,'2025-06-16 18:04:11'),(221,222,0,0,5,0,10,50,'2025-06-16 18:04:11'),(222,223,0,0,5,0,10,50,'2025-06-16 18:04:11'),(223,224,0,0,5,0,10,50,'2025-06-16 18:04:11'),(224,225,0,0,5,0,10,50,'2025-06-16 18:04:11'),(225,226,0,0,5,0,10,50,'2025-06-16 18:04:11'),(226,227,0,0,5,0,10,50,'2025-06-16 18:04:11'),(227,228,0,0,5,0,10,50,'2025-06-16 18:04:11'),(228,229,0,0,5,0,10,50,'2025-06-16 18:04:11'),(229,230,0,0,5,0,10,50,'2025-06-16 18:04:11'),(230,231,0,0,5,0,10,50,'2025-06-16 18:04:11'),(231,232,0,0,5,0,10,50,'2025-06-16 18:04:11'),(232,233,0,0,5,0,10,50,'2025-06-16 18:04:11'),(233,234,0,0,5,0,10,50,'2025-06-16 18:04:11'),(234,235,0,0,5,0,10,50,'2025-06-16 18:04:11'),(235,236,0,0,5,0,10,50,'2025-06-16 18:04:11'),(236,237,0,0,5,0,10,50,'2025-06-16 18:04:11'),(237,238,0,0,5,0,10,50,'2025-06-16 18:04:11'),(238,239,0,0,5,0,10,50,'2025-06-16 18:04:11');
/*!40000 ALTER TABLE `product_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_pricing_history`
--

DROP TABLE IF EXISTS `product_pricing_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_pricing_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `previous_price` decimal(10,2) DEFAULT NULL,
  `new_price` decimal(10,2) NOT NULL,
  `price_change_amount` decimal(10,2) GENERATED ALWAYS AS ((`new_price` - ifnull(`previous_price`,0))) STORED,
  `price_change_percent` decimal(5,2) DEFAULT NULL,
  `change_reason` enum('manual_update','dynamic_pricing','promotional_campaign','volume_discount','system_adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User ID, system process, rule ID, etc.',
  `effective_from` datetime NOT NULL,
  `effective_until` datetime DEFAULT NULL,
  `campaign_id` int DEFAULT NULL,
  `rule_id` int DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `fk_pricing_history_user` (`changed_by`),
  KEY `fk_pricing_history_campaign` (`campaign_id`),
  KEY `idx_product_pricing_history` (`product_id`,`effective_from`),
  KEY `idx_change_reason` (`change_reason`),
  KEY `idx_effective_dates` (`effective_from`,`effective_until`),
  CONSTRAINT `fk_pricing_history_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `promotional_campaigns` (`campaign_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pricing_history_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pricing_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_pricing_history`
--

LOCK TABLES `product_pricing_history` WRITE;
/*!40000 ALTER TABLE `product_pricing_history` DISABLE KEYS */;
INSERT INTO `product_pricing_history` (`history_id`, `product_id`, `previous_price`, `new_price`, `price_change_percent`, `change_reason`, `change_source`, `effective_from`, `effective_until`, `campaign_id`, `rule_id`, `changed_by`, `notes`, `created_at`) VALUES (1,243,179.99,29.99,NULL,'manual_update','system','2025-06-18 19:59:03',NULL,NULL,NULL,NULL,NULL,'2025-06-19 02:59:03'),(2,242,399.99,29.99,NULL,'manual_update','system','2025-06-29 17:40:53',NULL,NULL,NULL,NULL,NULL,'2025-06-30 00:40:53');
/*!40000 ALTER TABLE `product_pricing_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_pricing_matrix`
--

DROP TABLE IF EXISTS `product_pricing_matrix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_pricing_matrix` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `width_min` decimal(8,2) NOT NULL,
  `width_max` decimal(8,2) NOT NULL,
  `height_min` decimal(8,2) NOT NULL,
  `height_max` decimal(8,2) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `price_per_sqft` decimal(10,2) DEFAULT '0.00',
  `effective_date` date DEFAULT NULL,
  `expires_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `dimensions` (`width_min`,`width_max`,`height_min`,`height_max`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `product_pricing_matrix_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=238 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_pricing_matrix`
--

LOCK TABLES `product_pricing_matrix` WRITE;
/*!40000 ALTER TABLE `product_pricing_matrix` DISABLE KEYS */;
INSERT INTO `product_pricing_matrix` VALUES (141,243,11.00,20.00,11.00,20.00,10.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(142,243,31.00,40.00,21.00,30.00,20.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(143,243,51.00,60.00,31.00,40.00,30.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(144,243,61.00,70.00,101.00,110.00,80.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(145,243,71.00,80.00,41.00,50.00,50.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(146,243,91.00,100.00,61.00,70.00,60.00,0.00,NULL,NULL,1,'2025-06-20 18:17:20'),(231,242,11.00,20.00,11.00,20.00,20.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(232,242,51.00,60.00,31.00,40.00,30.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(233,242,71.00,80.00,41.00,50.00,31.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(234,242,81.00,90.00,51.00,60.00,32.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(235,242,91.00,100.00,61.00,70.00,33.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(236,242,101.00,110.00,71.00,80.00,34.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13'),(237,242,111.00,120.00,81.00,90.00,35.00,0.00,NULL,NULL,1,'2025-06-30 19:15:13');
/*!40000 ALTER TABLE `product_pricing_matrix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_relations`
--

DROP TABLE IF EXISTS `product_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `related_product_id` int NOT NULL,
  `relation_type` enum('accessory','complement','upgrade','alternative') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `strength_score` tinyint DEFAULT '5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_relation` (`product_id`,`related_product_id`,`relation_type`),
  KEY `product_id` (`product_id`),
  KEY `related_product_id` (`related_product_id`),
  KEY `relation_type` (`relation_type`),
  CONSTRAINT `product_relations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_relations_ibfk_2` FOREIGN KEY (`related_product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_relations`
--

LOCK TABLES `product_relations` WRITE;
/*!40000 ALTER TABLE `product_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int DEFAULT NULL COMMENT 'NULL for guest reviews',
  `guest_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `review_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `idx_product_reviews` (`product_id`),
  KEY `idx_user_reviews` (`user_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_approved` (`is_approved`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `chk_rating` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,1,1,NULL,NULL,5,'Excellent Quality','These cellular shades are perfect for our bedroom. Great light control and energy savings.',1,1,0,'2025-06-10 22:26:20','2025-06-10 22:26:20'),(2,2,2,NULL,NULL,4,'Beautiful Wood Blinds','Love the natural wood finish. Installation was easy and they look amazing.',1,1,0,'2025-06-10 22:26:20','2025-06-10 22:26:20'),(3,3,1,NULL,NULL,5,'Perfect for Modern Decor','Exactly what we needed for our contemporary living room. Highly recommended!',1,1,0,'2025-06-10 22:26:20','2025-06-10 22:26:20'),(4,4,2,NULL,NULL,5,'Worth Every Penny','Premium quality shutters that transformed our home. Professional installation included.',1,1,0,'2025-06-10 22:26:20','2025-06-10 22:26:20'),(5,242,1,NULL,NULL,5,'Perfect Fit!','These custom blinds fit perfectly in my living room windows. The motorization works flawlessly!',1,1,0,'2025-06-26 03:53:18','2025-07-01 03:53:18'),(6,243,2,NULL,NULL,5,'Excellent Quality','The quality exceeded my expectations. Installation was straightforward and they look amazing.',1,1,0,'2025-06-21 03:53:18','2025-07-01 03:53:18'),(7,244,3,NULL,NULL,4,'Great Value','Good quality for the price. The blackout feature works really well in our bedroom.',1,1,0,'2025-06-16 03:53:18','2025-07-01 03:53:18'),(8,245,NULL,'Sarah Johnson',NULL,5,'Love These Shades!','Transformed our home office. The light filtering is perfect for video calls.',0,1,0,'2025-06-11 03:53:18','2025-07-01 04:26:17'),(9,246,NULL,'Michael Chen',NULL,5,'Highly Recommend','Customer service was excellent and the product quality is outstanding. Worth every penny!',0,1,0,'2025-06-06 03:53:18','2025-07-01 04:26:17'),(10,247,NULL,'Emily Davis',NULL,4,'Beautiful Design','The wood texture looks so realistic. Really happy with how they complement our decor.',0,1,0,'2025-06-01 03:53:18','2025-07-01 04:26:17');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_rooms`
--

DROP TABLE IF EXISTS `product_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `room_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `suitability_score` tinyint DEFAULT '5',
  `special_considerations` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `room_type` (`room_type`),
  CONSTRAINT `product_rooms_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_rooms`
--

LOCK TABLES `product_rooms` WRITE;
/*!40000 ALTER TABLE `product_rooms` DISABLE KEYS */;
INSERT INTO `product_rooms` VALUES (15,243,'Media Room',1,'dsd','2025-06-20 18:17:20');
/*!40000 ALTER TABLE `product_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_specifications`
--

DROP TABLE IF EXISTS `product_specifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_specifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `spec_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `spec_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `spec_unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spec_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_key_spec` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `spec_category` (`spec_category`),
  KEY `is_key_spec` (`is_key_spec`),
  CONSTRAINT `product_specifications_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_specifications`
--

LOCK TABLES `product_specifications` WRITE;
/*!40000 ALTER TABLE `product_specifications` DISABLE KEYS */;
INSERT INTO `product_specifications` VALUES (136,242,'mount_type','{\"name\":\"Inside Mount\",\"price_adjustment\":0,\"enabled\":true}',NULL,'mount_type',0,0,'2025-06-30 19:15:13'),(137,242,'mount_type','{\"name\":\"Outside Mount\",\"price_adjustment\":0,\"enabled\":true}',NULL,'mount_type',1,0,'2025-06-30 19:15:13'),(138,242,'lift_system','{\"name\":\"Cordless\",\"price_adjustment\":0,\"enabled\":true}',NULL,'lift_system',0,0,'2025-06-30 19:15:13'),(139,242,'lift_system','{\"name\":\"Continuous Loop\",\"price_adjustment\":25,\"enabled\":true}',NULL,'lift_system',1,0,'2025-06-30 19:15:13'),(140,242,'wand_system','{\"name\":\"Standard Wand\",\"price_adjustment\":15,\"enabled\":true}',NULL,'wand_system',0,0,'2025-06-30 19:15:13'),(141,242,'wand_system','{\"name\":\"Extended Wand\",\"price_adjustment\":30,\"enabled\":true}',NULL,'wand_system',1,0,'2025-06-30 19:15:13'),(142,242,'string_system','{\"name\":\"String Lift\",\"price_adjustment\":10,\"enabled\":true}',NULL,'string_system',0,0,'2025-06-30 19:15:13'),(143,242,'string_system','{\"name\":\"Chain System\",\"price_adjustment\":20,\"enabled\":true}',NULL,'string_system',1,0,'2025-06-30 19:15:13'),(144,242,'remote_control','{\"name\":\"Basic Remote\",\"price_adjustment\":150,\"enabled\":true}',NULL,'remote_control',0,0,'2025-06-30 19:15:13'),(145,242,'remote_control','{\"name\":\"Smart Home Compatible\",\"price_adjustment\":250,\"enabled\":true}',NULL,'remote_control',1,0,'2025-06-30 19:15:13'),(146,242,'valance_option','{\"name\":\"Circular (With Fabric Insert)\",\"price_adjustment\":45,\"enabled\":true}',NULL,'valance_option',0,0,'2025-06-30 19:15:13'),(147,242,'valance_option','{\"name\":\"Square (Without Fabric)\",\"price_adjustment\":35,\"enabled\":true}',NULL,'valance_option',1,0,'2025-06-30 19:15:13'),(148,242,'valance_option','{\"name\":\"Fabric Wrapped\",\"price_adjustment\":55,\"enabled\":false}',NULL,'valance_option',2,0,'2025-06-30 19:15:13'),(149,242,'bottom_rail_option','{\"name\":\"Fabric Wrapped\",\"price_adjustment\":25,\"enabled\":true}',NULL,'bottom_rail_option',0,0,'2025-06-30 19:15:13'),(150,242,'bottom_rail_option','{\"name\":\"Just a Rail\",\"price_adjustment\":0,\"enabled\":true}',NULL,'bottom_rail_option',1,0,'2025-06-30 19:15:13');
/*!40000 ALTER TABLE `product_specifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_types`
--

DROP TABLE IF EXISTS `product_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_types` (
  `product_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `features` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_type_id`),
  UNIQUE KEY `name` (`name`),
  KEY `category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_types`
--

LOCK TABLES `product_types` WRITE;
/*!40000 ALTER TABLE `product_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `variant_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_adjustment` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int DEFAULT '0',
  `weight` decimal(8,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`variant_id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `product_id` (`product_id`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_warranties`
--

DROP TABLE IF EXISTS `product_warranties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_warranties` (
  `warranty_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `order_id` int DEFAULT NULL COMMENT 'Original purchase order',
  `serial_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Product serial number',
  `model_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warranty_type` enum('manufacturer','extended','service_plan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'manufacturer',
  `warranty_duration_months` int NOT NULL DEFAULT '12',
  `purchase_date` date NOT NULL,
  `warranty_start_date` date NOT NULL,
  `warranty_end_date` date GENERATED ALWAYS AS ((`warranty_start_date` + interval `warranty_duration_months` month)) STORED,
  `status` enum('active','expired','voided','transferred') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `is_transferable` tinyint(1) DEFAULT '0',
  `coverage_details` json DEFAULT NULL COMMENT 'What is covered under warranty',
  `exclusions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'What is not covered',
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `registration_method` enum('online','mail','phone','auto') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'online',
  `installation_date` date DEFAULT NULL,
  `installer_company` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installer_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `internal_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`warranty_id`),
  UNIQUE KEY `unique_serial_customer` (`serial_number`,`customer_id`),
  KEY `idx_product_warranty` (`product_id`),
  KEY `idx_customer_warranty` (`customer_id`),
  KEY `idx_order_warranty` (`order_id`),
  KEY `idx_serial_number` (`serial_number`),
  KEY `idx_warranty_dates` (`warranty_start_date`,`warranty_end_date`),
  KEY `idx_status` (`status`),
  KEY `idx_registration_date` (`registration_date`),
  CONSTRAINT `fk_warranties_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranties_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warranties_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_warranties`
--

LOCK TABLES `product_warranties` WRITE;
/*!40000 ALTER TABLE `product_warranties` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_warranties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `full_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rating` decimal(3,2) DEFAULT NULL,
  `review_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `stock_status` enum('in_stock','out_of_stock','limited_stock') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'in_stock',
  `stock_quantity` int DEFAULT '0',
  `low_stock_threshold` int DEFAULT '5',
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `primary_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `featured` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive','draft') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `cost_price` decimal(10,2) DEFAULT NULL,
  `finish` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `room_types` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mount_types` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `control_types` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_filtering` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `energy_efficiency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `child_safety_certified` tinyint(1) DEFAULT '0',
  `warranty_years` int DEFAULT '1',
  `custom_width_min` decimal(8,3) DEFAULT NULL,
  `custom_width_max` decimal(8,3) DEFAULT NULL,
  `custom_height_min` decimal(8,3) DEFAULT NULL,
  `custom_height_max` decimal(8,3) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_modified_by` int DEFAULT NULL,
  `headrail_id` int DEFAULT NULL,
  `bottom_rail_id` int DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `sku_2` (`sku`),
  KEY `is_active` (`is_active`),
  KEY `stock_status` (`stock_status`),
  KEY `fk_products_category` (`category_id`),
  KEY `fk_products_headrail` (`headrail_id`),
  KEY `fk_products_bottom_rail` (`bottom_rail_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_product_pricing_lookup` (`product_id`,`base_price`),
  CONSTRAINT `fk_products_bottom_rail` FOREIGN KEY (`bottom_rail_id`) REFERENCES `bottom_rail_options` (`bottom_rail_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_headrail` FOREIGN KEY (`headrail_id`) REFERENCES `headrail_options` (`headrail_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE SET NULL,
  CONSTRAINT `products_chk_1` CHECK ((`base_price` >= 0)),
  CONSTRAINT `products_chk_2` CHECK (((`cost_price` is null) or (`cost_price` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,6,'Premium Blackout Solid Fabric Roller Shades','premium-blackout-solid-fabric-roller-shades','<p>Premium Blackout Solid Fabric Roller Shades</p>','<p>Premium Blackout Solid Fabric Roller Shades</p>',125.00,NULL,0,1,1,'in_stock',50,5,NULL,'2025-01-15 07:21:07','2025-07-01 16:13:39',NULL,0,'/uploads/products/product_243_1750195341922_b337o93yu6.png',1,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,6,'Natural Woven Shades','natural-woven-shades','Natural Woven Shades','Woven Wood Shades',125.00,NULL,0,1,1,'in_stock',50,5,NULL,'2025-06-02 01:25:45','2025-07-01 16:13:39',1,0,'/uploads/products/product_243_1750195341922_b337o93yu6.png',1,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,6,'Premium Light Filtering Vertical Cell Shades','premium-light-filtering-vertical-cell-shades','Premium Light Filtering Vertical Cell Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:47','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/c4fe3cc1-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,6,'Vertical Vanes','vertical-vanes','Vertical Vanes','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:48','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/ec67a313-ad70-e811-946d-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,6,'Designer Blackout Vertical Cellular Shades','designer-blackout-vertical-cellular-shades','Designer Blackout Vertical Cellular Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:50','2025-07-01 16:13:39',6,0,'https://www.smartblindshub.com/images/79d6318c-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,6,'Flat Sheer Shades','flat-sheer-shades','Flat Sheer Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:51','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/6895a463-dda1-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,6,'Wrought Iron C-Rings with Eyelets','wrought-iron-c-rings-with-eyelets','Wrought Iron C-Rings with Eyelets','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:52','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/13a42847-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,6,'2 Inch Wood Blinds','2-inch-wood-blinds','2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:54','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/dec5d8ee-00b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,6,'Premium Light Filtering Cellular Arch','premium-light-filtering-cellular-arch','Premium Light Filtering Cellular Arch','Arches',125.00,NULL,0,1,1,'in_stock',50,5,'','2025-06-02 01:25:55','2025-07-01 16:13:39',21,0,'https://www.smartblindshub.com/images/1e1ddf69-35be-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,9,'Room Darkening Sheer Shades','room-darkening-sheer-shades','Room Darkening Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:57','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/3ba63cdf-df9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,9,'Motorized Zebra Shades','motorized-zebra-shades','Motorized Zebra Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:58','2025-07-01 16:13:39',9,0,'https://www.smartblindshub.com/images/0dce6352-a788-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,9,'Perceptions Sheer Vertical Shades','perceptions-sheer-vertical-shades','Perceptions Sheer Vertical Shades','Sheer Vertical Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:25:59','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/a7b91d47-fa64-e411-9457-0e6de736083d.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,9,'Roman Shades','roman-shades','Roman Shades','Roman Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:01','2025-07-01 16:13:39',3,0,'https://www.smartblindshub.com/images/1a947400-3d0f-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,9,'Light Filtering Sheer Shades','light-filtering-sheer-shades','Light Filtering Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:02','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/3ee51246-d008-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,9,'Light Filtering Cellular Arch','light-filtering-cellular-arch','Light Filtering Cellular Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:04','2025-07-01 16:13:39',6,0,'https://www.smartblindshub.com/images/f0ec1177-8e88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,9,'Vertical Blind Headrail Only','vertical-blind-headrail-only','Vertical Blind Headrail Only','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:05','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/25c2c49b-db6c-e911-9476-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,9,'2 Inch Faux Wood Blinds','2-inch-faux-wood-blinds','2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:07','2025-07-01 16:13:39',1,0,'https://www.smartblindshub.com/images/9c16e2db-b131-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,NULL,'Premium 2 Inch Mini Blinds','premium-2-inch-mini-blinds','Premium 2 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:08','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9035f001-cc92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,NULL,'Basic Cordless Blackout Cellular Shades','basic-cordless-blackout-cellular-shades','Basic Cordless Blackout Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:10','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/db52c7ef-b531-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(21,NULL,'2 Inch Aluminum Blinds','2-inch-aluminum-blinds','2 Inch Aluminum Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:11','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a1e0784b-75cc-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,NULL,'Blackout Cellular Shades','blackout-cellular-shades','Blackout Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:12','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/df7d5231-7736-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,NULL,'Solar Sliding Panels','solar-sliding-panels','Solar Sliding Panels','Sliding Panels',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:14','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/7cf093e3-e79d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,NULL,'Designer Blackout Skylight Cellular Shades','designer-blackout-skylight-cellular-shades','Designer Blackout Skylight Cellular Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:15','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/fbab3d2e-f992-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,NULL,'Pacific Composite Shutters','pacific-composite-shutters','Pacific Composite Shutters','Faux Wood Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:17','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/36b5eac1-9931-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(26,NULL,'Wrought Iron Orb Tieback','wrought-iron-orb-tieback','Wrought Iron Orb Tieback','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:18','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4b27425a-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(27,NULL,'9/16 Inch Cellular Shades','9-16-inch-cellular-shades','9/16 Inch Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:20','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/5355009c-4637-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(28,NULL,'Deluxe Custom Wood Traversing Drapery Hardware','deluxe-custom-wood-traversing-drapery-hardware','Deluxe Custom Wood Traversing Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:21','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8b2bcdf4-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(29,NULL,'Premium Blackout Cellular Arch','premium-blackout-cellular-arch','Premium Blackout Cellular Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:23','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/f39e8a19-8701-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,NULL,'1 Inch Angle Top or Bottom Mini Blinds','1-inch-angle-top-or-bottom-mini-blinds','1 Inch Angle Top or Bottom Mini Blinds','Angle Tops',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:24','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/6e346825-8e88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,NULL,'Motorized Solar Roller Shades','motorized-solar-roller-shades','Motorized Solar Roller Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:26','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/197c28ee-ec9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,NULL,'Motorized Blackout Roller Shades','motorized-blackout-roller-shades','Motorized Blackout Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:27','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f048beb8-d292-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,NULL,' 2 Inch Premier Wood Blinds','2-inch-premier-wood-blinds',' 2 Inch Premier Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:29','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a6c09ed4-d900-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,NULL,'Vertical Fabric Blinds','vertical-fabric-blinds','Vertical Fabric Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:30','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/08ee9dff-b770-e811-946d-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,NULL,'Sliding Panels','sliding-panels','Sliding Panels','Sliding Panels',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:32','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/0bc655d2-df65-e411-9457-0e6de736083d.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,NULL,'1 Inch Adjustable Metal Drapery Hardware','1-inch-adjustable-metal-drapery-hardware','1 Inch Adjustable Metal Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:33','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/bfd3cc0c-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(37,NULL,' Basic Cordless Light Filtering Cell Shades','basic-cordless-light-filtering-cell-shades',' Basic Cordless Light Filtering Cell Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:34','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4cbaaa53-ab31-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(38,NULL,'Exterior Roller Shades','exterior-roller-shades','Exterior Roller Shades','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:36','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/2eca78b8-ae22-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(39,NULL,'Motorized Woven Wood Shades','motorized-woven-wood-shades','Motorized Woven Wood Shades','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:37','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8314686b-02b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(40,NULL,'Premium Room Darkening Sheer Shades','premium-room-darkening-sheer-shades','Premium Room Darkening Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:39','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/2c5c110d-3bf9-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(41,NULL,'Traditional Shutters','traditional-shutters','Traditional Shutters','Faux Wood Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:40','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c3c46477-c592-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(42,NULL,'2 Inch Premium Wood Blinds','2-inch-premium-wood-blinds','2 Inch Premium Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/49404e11-e631-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(43,NULL,'Motorized Sheer Shades','motorized-sheer-shades','Motorized Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:44','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/d05c8435-e19d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(44,NULL,'Premium 1 Inch Mini Blinds','premium-1-inch-mini-blinds','Premium 1 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:45','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/81e762f7-0338-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(45,NULL,'Cordless Light Filtering Cellular Shades','cordless-light-filtering-cellular-shades','Cordless Light Filtering Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:46','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/fe29a17d-d131-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,NULL,'2 1/2 Inch Light Filtering Fabric Blinds','2-1-2-inch-light-filtering-fabric-blinds','2 1/2 Inch Light Filtering Fabric Blinds','Fabric Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:50','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fcc13fc1-b992-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(47,NULL,'Roller Shades','roller-shades','Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:51','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/90ddcab5-103b-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,NULL,'Deluxe Custom Wrought Iron 1 3/16 Inch Pole','deluxe-custom-wrought-iron-1-3-16-inch-pole','Deluxe Custom Wrought Iron 1 3/16 Inch Pole','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:53','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/db811f48-a688-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(49,NULL,'Riviera Complete 1 Inch Cordless Mini Blinds','riviera-complete-1-inch-cordless-mini-blinds','Riviera Complete 1 Inch Cordless Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:54','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/cc1a53f5-43f8-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,NULL,'Faux Wood Valance Only','faux-wood-valance-only','Faux Wood Valance Only','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:55','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9cfcea42-b8c9-e911-9476-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(51,NULL,'Woven Wood Shades','woven-wood-shades','Woven Wood Shades','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:57','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/eadf217d-e2cd-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(52,NULL,'2 Inch Room Darkening Fabric Blinds','2-inch-room-darkening-fabric-blinds','2 Inch Room Darkening Fabric Blinds','Fabric Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:26:58','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/35346a9c-b992-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(53,NULL,'2 Inch Vinyl Blinds','2-inch-vinyl-blinds','2 Inch Vinyl Blinds','Vinyl Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:00','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b70fe112-ffb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(54,NULL,'Pleated Shade','pleated-shade','Pleated Shade','Pleated Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:01','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/92eca16b-cd92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(55,NULL,'Rod Top & Bottom Drapery','rod-top-bottom-drapery','Rod Top & Bottom Drapery','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:02','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/228ad533-4ecc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(56,NULL,'Sheer Vertical Shades','sheer-vertical-shades','Sheer Vertical Shades','Sheer Vertical Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:04','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/1350aeac-7134-e511-9465-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(57,NULL,'Blackout Vertical Cellular Shades','blackout-vertical-cellular-shades','Blackout Vertical Cellular Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:05','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/29556f11-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(58,NULL,'Patio Sun Shades','patio-sun-shades','Patio Sun Shades','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:07','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/aef4519c-b892-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(59,NULL,'Designer Light Filtering Cellular Arches','designer-light-filtering-cellular-arches','Designer Light Filtering Cellular Arches','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:08','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/02647884-9088-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(60,NULL,'Economy Vinyl Vertical Blinds','economy-vinyl-vertical-blinds','Economy Vinyl Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:10','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/eee24289-ee9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(61,NULL,'Woven Wood Bi-Fold Doors','woven-wood-bi-fold-doors','Woven Wood Bi-Fold Doors','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:11','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f437d021-2d6a-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(62,NULL,'1 Inch Custom Wrought Iron Traversing Drapery Hardware','1-inch-custom-wrought-iron-traversing-drapery-hardware','1 Inch Custom Wrought Iron Traversing Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:14','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b14c21ae-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(63,NULL,'NoBrainer™ Wrought Iron Post Tieback','nobrainer-wrought-iron-post-tieback','NoBrainer™ Wrought Iron Post Tieback','Specialized Products',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:15','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a876c738-ed9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(64,NULL,'Solar Shades','solar-shades','Solar Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:17','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/6672e383-8236-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(65,NULL,'Designer Light Filtering Cellular Shades','designer-light-filtering-cellular-shades','Designer Light Filtering Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:18','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/5952159e-cd31-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(66,NULL,'Classic 1 Inch Mini Blinds','classic-1-inch-mini-blinds','Classic 1 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:20','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ff081f61-fa08-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(67,NULL,'3 1/2 Inch PVC Vertical Blinds','3-1-2-inch-pvc-vertical-blinds','3 1/2 Inch PVC Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:21','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f5f72f82-a800-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(68,NULL,'Cordless 2 Inch Faux Wood Blinds','cordless-2-inch-faux-wood-blinds','Cordless 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:23','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/90f9fa85-d330-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(69,NULL,'2 Inch Real Wood Blinds','2-inch-real-wood-blinds','2 Inch Real Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:24','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/84f2cfa8-00b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(70,NULL,'Classic Light Filtering Cellular Shades','classic-light-filtering-cellular-shades','Classic Light Filtering Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:25','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/f15eef03-8c32-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(71,NULL,'Cordless 2 Inch Classic Faux Wood Blind','cordless-2-inch-classic-faux-wood-blind','Cordless 2 Inch Classic Faux Wood Blind','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:27','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4b8a29cb-9035-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(72,NULL,'Deluxe 2 Inch Wood Blinds','deluxe-2-inch-wood-blinds','Deluxe 2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:28','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9dacf696-e037-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(73,NULL,'Layered Shades','layered-shades','Layered Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:30','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/efef98a1-bfff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(74,NULL,'Heavy Duty Outdoor Solar Shades','heavy-duty-outdoor-solar-shades','Heavy Duty Outdoor Solar Shades','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:31','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/48cde971-b892-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(75,NULL,'Easy Classic Pleat Drapery','easy-classic-pleat-drapery','Easy Classic Pleat Drapery','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:32','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/0b32ae0e-147e-e711-9468-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(76,NULL,'1 3/8 Inch Wood Blinds','1-3-8-inch-wood-blinds','1 3/8 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:34','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/2940e00a-16af-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(77,NULL,'Designer 2 1/2 Inch Faux Wood Blinds','designer-2-1-2-inch-faux-wood-blinds','Designer 2 1/2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:37','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/479446f2-9e35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(78,NULL,'1 Inch Arch Mini Blinds','1-inch-arch-mini-blinds','1 Inch Arch Mini Blinds','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:38','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ef818fe8-8e88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(79,NULL,'Designer Vertical Blinds','designer-vertical-blinds','Designer Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/1796ad76-fa92-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(80,NULL,'Blackout Cellular Arch','blackout-cellular-arch','Blackout Cellular Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:43','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/a64777fe-8f88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(81,NULL,'2 1/2 Inch Wood Blinds','2-1-2-inch-wood-blinds','2 1/2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:45','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e565fa71-84b5-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(82,NULL,'Premium Cordless 2 1/2 Inch Faux Wood Blinds','premium-cordless-2-1-2-inch-faux-wood-blinds','Premium Cordless 2 1/2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:46','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/14b1c050-a435-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(83,NULL,'Motorized Roman Shades','motorized-roman-shades','Motorized Roman Shades','Roman Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:48','2025-06-26 06:03:10',3,0,'https://www.smartblindshub.com/images/6ff1c7f2-b34e-ef11-9593-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(84,NULL,'Classic Roller Shades','classic-roller-shades','Classic Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:50','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/733f87b2-ea3c-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(85,NULL,'Studio Layered Shades','studio-layered-shades','Studio Layered Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:51','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f5e3185d-c0ff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(86,NULL,'Premier Woven Roller Shades','premier-woven-roller-shades','Premier Woven Roller Shades','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:52','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/71bd9fa1-1792-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(87,NULL,'Pleated Arch','pleated-arch','Pleated Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:54','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/79e18503-8f88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(88,NULL,'Motorized Solar Shades','motorized-solar-shades','Motorized Solar Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:55','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3dd359b3-ec9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(89,NULL,'Cordless Pleated Shades','cordless-pleated-shades','Cordless Pleated Shades','Pleated Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:57','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/bad862bf-cc92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(90,NULL,'Light Filtering VertiCell Shades','light-filtering-verticell-shades','Light Filtering VertiCell Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:27:58','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/cbfd078b-fdb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(91,NULL,'Light Filtering Cellular Arches','light-filtering-cellular-arches','Light Filtering Cellular Arches','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:00','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/1b03da16-ec12-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(92,NULL,'Budget Cordless Light Filtering Cellular Shades','budget-cordless-light-filtering-cellular-shades','Budget Cordless Light Filtering Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:01','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/32b993da-e208-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(93,NULL,'LightBlocker 1/2 Inch Mini Blinds','lightblocker-1-2-inch-mini-blinds','LightBlocker 1/2 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:02','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b2ade174-ca92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(94,NULL,'Light Filtering Cellular Skylight Shades','light-filtering-cellular-skylight-shades','Light Filtering Cellular Skylight Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:04','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/4ea33c20-e39d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(95,NULL,'Vinyl Vertical Blinds','vinyl-vertical-blinds','Vinyl Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:05','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/20b2cc50-882f-e411-9457-0e6de736083d.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(96,NULL,'Studio Woven Wood Drapery','studio-woven-wood-drapery','Studio Woven Wood Drapery','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:07','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/07b48f2c-03b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(97,NULL,'Premium Woven Roller Shades','premium-woven-roller-shades','Premium Woven Roller Shades','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:08','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/06288105-eacd-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(98,NULL,'Wrought Iron Rod Eyelet Ring for 1 Inch Rod','wrought-iron-rod-eyelet-ring-for-1-inch-rod','Wrought Iron Rod Eyelet Ring for 1 Inch Rod','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:10','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/7b20d733-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(99,NULL,'1 Inch Classics Cordless Blinds','1-inch-classics-cordless-blinds','1 Inch Classics Cordless Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:12','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/bef8738a-2333-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(100,NULL,'Light Filtering Cellular Skylight','light-filtering-cellular-skylight','Light Filtering Cellular Skylight','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:13','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/f1a7359c-ec12-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(101,NULL,'DualDrape Sheer Vertical Blinds','dualdrape-sheer-vertical-blinds','DualDrape Sheer Vertical Blinds','Sheer Vertical Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:15','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3c59604c-fa92-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(102,NULL,'Wood and Faux Wood Valances','wood-and-faux-wood-valances','Wood and Faux Wood Valances','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:16','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/219f2b95-1765-e411-9457-0e6de736083d.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(103,NULL,'Premium Roller Shades','premium-roller-shades','Premium Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:19','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fb3cafad-a731-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(104,NULL,'Cordless Blackout Cellular Shades','cordless-blackout-cellular-shades','Cordless Blackout Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:20','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/e066ee0e-5e32-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(105,NULL,'Premium 1 Inch Vinyl Mini Blinds','premium-1-inch-vinyl-mini-blinds','Premium 1 Inch Vinyl Mini Blinds','Vinyl Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:22','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3d770c01-2f0b-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(106,NULL,'Premium Blackout Cellular Skylight Shades','premium-blackout-cellular-skylight-shades','Premium Blackout Cellular Skylight Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:23','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/8b1d4889-32be-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(107,NULL,'1 Inch Custom Wrought Iron Drapery Hardware','1-inch-custom-wrought-iron-drapery-hardware','1 Inch Custom Wrought Iron Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:25','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/84cb1ff5-a488-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(108,NULL,'Riviera Complete 2 Inch Cordless Mini Blinds','riviera-complete-2-inch-cordless-mini-blinds','Riviera Complete 2 Inch Cordless Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:27','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/63c77ffb-44f8-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(109,NULL,'Premium 1/2 Inch Mini Blinds','premium-1-2-inch-mini-blinds','Premium 1/2 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:28','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/89a55fb3-6218-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(110,NULL,'Faux Wood Vertical Blinds','faux-wood-vertical-blinds','Faux Wood Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:30','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/1754fdbb-7cc7-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(111,NULL,'Basic Outdoor Solar Shade','basic-outdoor-solar-shade','Basic Outdoor Solar Shade','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:31','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ac82eb55-c287-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(112,NULL,'Solar Zebra Shades','solar-zebra-shades','Solar Zebra Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:37','2025-06-26 06:03:10',9,0,'https://www.smartblindshub.com/images/04da602c-ce8c-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(113,NULL,'Designer Room Darkening Sheer Shades','designer-room-darkening-sheer-shades','Designer Room Darkening Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:38','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3d8183ec-f992-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(114,NULL,'Motorized Light Filtering Roller Shades','motorized-light-filtering-roller-shades','Motorized Light Filtering Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:40','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/bae195da-d292-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(115,NULL,'Easy Rod Pocket Drapery','easy-rod-pocket-drapery','Easy Rod Pocket Drapery','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:41','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/823821d3-4ecc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(116,NULL,'Designer 2 Inch Wood Blinds','designer-2-inch-wood-blinds','Designer 2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b362fc82-9a98-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(117,NULL,'Banded Shades','banded-shades','Banded Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:44','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4ba3afe6-9c7a-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(118,NULL,'Deluxe 1 3/16 Inch Custom Modern Metal Drapery Hardware','deluxe-1-3-16-inch-custom-modern-metal-drapery-hardware','Deluxe 1 3/16 Inch Custom Modern Metal Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:45','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ace2d52b-a688-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(119,NULL,'Natural Sliding Panels','natural-sliding-panels','Natural Sliding Panels','Sliding Panels',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:47','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b470ebcb-e99d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(120,NULL,'Composite Wood Shutters','composite-wood-shutters','Composite Wood Shutters','Plantation Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:48','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a9e78059-c592-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(121,NULL,'Simplicity Wood Shutters','simplicity-wood-shutters','Simplicity Wood Shutters','Plantation Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:49','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/909c4b6a-cc92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(122,NULL,'Designer Solar Roller Shades','designer-solar-roller-shades','Designer Solar Roller Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:51','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/010e98a2-034a-ef11-9593-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(123,NULL,'S-Shaped Vinyl Vertical Blinds','s-shaped-vinyl-vertical-blinds','S-Shaped Vinyl Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:52','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/2b2f0082-04a5-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(124,NULL,'Cellular Shades','cellular-shades','Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:54','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/b2dfb445-bb34-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(125,NULL,'Vertical Louvers','vertical-louvers','Vertical Louvers','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:56','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/1876fd57-d76d-e911-9476-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(126,NULL,'Woven Wood Drapes','woven-wood-drapes','Woven Wood Drapes','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:58','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c04a01c4-02b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(127,NULL,'Economy Blackout Vinyl Roller Shades','economy-blackout-vinyl-roller-shades','Economy Blackout Vinyl Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:28:59','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/39b86e7c-833d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(128,NULL,'Blackout Cellular Skylight','blackout-cellular-skylight','Blackout Cellular Skylight','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:00','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/b83d0dc2-e69d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(129,NULL,'Riviera Select 1 Inch Cordless Mini Blinds','riviera-select-1-inch-cordless-mini-blinds','Riviera Select 1 Inch Cordless Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:05','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/dda8fcb6-42f8-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(130,NULL,'Fabric Cornices','fabric-cornices','Fabric Cornices','Cornices',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:08','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/2034f6ab-a488-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(131,NULL,'Premium Blackout Vertical Cell Shades','premium-blackout-vertical-cell-shades','Premium Blackout Vertical Cell Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:11','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b55046ec-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(132,NULL,'Northern Heights 2 Inch Wood Blinds','northern-heights-2-inch-wood-blinds','Northern Heights 2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:13','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fe0e43a2-dbb0-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(133,NULL,'Blackout VertiCell Shades','blackout-verticell-shades','Blackout VertiCell Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:14','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e08849ae-fdb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(134,NULL,'Budget Cordless Blackout Cellular Shades','budget-cordless-blackout-cellular-shades','Budget Cordless Blackout Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:16','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/089d1851-c931-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(135,NULL,'Palladian Shelf','palladian-shelf','Palladian Shelf','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:17','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/0ff86864-9088-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(136,NULL,'Cordless 1 Inch Mini Blinds','cordless-1-inch-mini-blinds','Cordless 1 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:19','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/97b1f3c8-867d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(137,NULL,'Classic Solar Shades','classic-solar-shades','Classic Solar Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:20','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/33238045-5c3d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(138,NULL,'Woven Wood Sliding Panels','woven-wood-sliding-panels','Woven Wood Sliding Panels','Sliding Panels',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:22','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c59beb27-3a6a-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(139,NULL,'Designer Blackout Cellular Shades','designer-blackout-cellular-shades','Designer Blackout Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:23','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/8d278741-ce31-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(140,NULL,'Outdoor Solar Shades','outdoor-solar-shades','Outdoor Solar Shades','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:25','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/754381f1-b792-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(141,NULL,'Deluxe 2 Inch Custom Wood Drapery Hardware','deluxe-2-inch-custom-wood-drapery-hardware','Deluxe 2 Inch Custom Wood Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:26','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e9469462-a688-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(142,NULL,'Cordless Woven Wood Shades','cordless-woven-wood-shades','Cordless Woven Wood Shades','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:27','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f902f47f-8306-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(143,NULL,'Clip Rings for 1 Inch Rod','clip-rings-for-1-inch-rod','Clip Rings for 1 Inch Rod','Specialized Products',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:29','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9af0f6f5-eb44-e511-9465-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(144,NULL,'Sheer Shades','sheer-shades','Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:30','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/859f3941-bfff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(145,NULL,'Studio Sheer Shades ','studio-sheer-shades','Studio Sheer Shades ','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:32','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9847951e-c1ff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(146,NULL,'Classic 2 Inch Faux Wood Blinds','classic-2-inch-faux-wood-blinds','Classic 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:33','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/383bea8a-9735-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(147,NULL,'Designer Blackout Cellular Arch','designer-blackout-cellular-arch','Designer Blackout Cellular Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:34','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/f4d3240b-f992-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(148,NULL,'Light Filtering Cellular Verticals','light-filtering-cellular-verticals','Light Filtering Cellular Verticals','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:38','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/01a32a69-e512-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(149,NULL,'1 Inch Mini Blinds','1-inch-mini-blinds','1 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:39','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/1ebcbb4b-3a30-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(150,NULL,'Skylight 1 Inch Mini Blinds','skylight-1-inch-mini-blinds','Skylight 1 Inch Mini Blinds','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/6eaaedb6-e49d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(151,NULL,'Light Filtering Vertical Cellular Shades','light-filtering-vertical-cellular-shades','Light Filtering Vertical Cellular Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:45','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/4c7c4f3d-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(152,NULL,'Easy Grommet Drapery','easy-grommet-drapery','Easy Grommet Drapery','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:46','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/d0e23e69-4ecc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(153,NULL,'Riviera Classic 1 Inch Cordless Mini Blinds','riviera-classic-1-inch-cordless-mini-blinds','Riviera Classic 1 Inch Cordless Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:49','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4acf9a52-40f8-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(154,NULL,'Blackout Cellular Arches','blackout-cellular-arches','Blackout Cellular Arches','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:52','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/63077275-ec12-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(155,NULL,'Sheer Enchantment Vertical Sheer Shades','sheer-enchantment-vertical-sheer-shades','Sheer Enchantment Vertical Sheer Shades','Sheer Vertical Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:53','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/cd82da6d-e19d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(156,NULL,'Zebra Shades','zebra-shades','Zebra Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:29:58','2025-06-26 06:03:10',9,0,'https://www.smartblindshub.com/images/c27c53cd-27e3-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(157,NULL,'French Door Shutters','french-door-shutters','French Door Shutters','Faux Wood Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:01','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e3f1c591-c992-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(158,NULL,'Premium Fabric Vertical Blinds','premium-fabric-vertical-blinds','Premium Fabric Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:02','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/132d7db3-ee9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(159,NULL,'S-Shaped Vertical Blinds','s-shaped-vertical-blinds','S-Shaped Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:04','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3f0b331b-ee9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(160,NULL,'Cordless S-Curve 2 Inch Faux Wood Vinyl Blinds','cordless-s-curve-2-inch-faux-wood-vinyl-blinds','Cordless S-Curve 2 Inch Faux Wood Vinyl Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:05','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/af9e73d1-a735-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(161,NULL,'Studio 2 Inch Faux Wood Blinds','studio-2-inch-faux-wood-blinds','Studio 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:07','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a299e573-ab35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(162,NULL,'Trademark 2 Inch Faux Wood Blinds','trademark-2-inch-faux-wood-blinds','Trademark 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:08','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/bfda011e-ab35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(163,NULL,'Designer Cordless 2 Inch Faux Wood Blinds','designer-cordless-2-inch-faux-wood-blinds','Designer Cordless 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:10','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c9a0960a-aa35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(164,NULL,'Custom Draperies','custom-draperies','Custom Draperies','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:15','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8b9ca302-4ecc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(165,NULL,'Designer Light Filtering Vertical Cellular Shades','designer-light-filtering-vertical-cellular-shades','Designer Light Filtering Vertical Cellular Shades','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:18','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/41f39e65-feb3-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(166,NULL,'Light Filtering Angle Top or Bottom Cellular Shades','light-filtering-angle-top-or-bottom-cellular-shades','Light Filtering Angle Top or Bottom Cellular Shades','Angle Tops',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:20','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/1c7a7490-8d88-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(167,NULL,'Decorative Side Panels','decorative-side-panels','Decorative Side Panels','Curtains and Drapes',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:21','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/84269afb-4ecc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(168,NULL,'Basic Solar Roller Shades','basic-solar-roller-shades','Basic Solar Roller Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:23','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/4bf0816b-02a6-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(169,NULL,'Blackout Roller Shades','blackout-roller-shades','Blackout Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:24','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fdaa6c26-643d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(170,NULL,'Vertical Headrails Only','vertical-headrails-only','Vertical Headrails Only','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:25','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3438cef4-d86c-e911-9476-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(171,NULL,'Classic Zebra Shades','classic-zebra-shades','Classic Zebra Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:27','2025-06-26 06:03:10',9,0,'https://www.smartblindshub.com/images/f2b77f42-e637-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(172,NULL,'Designer Roman Shades','designer-roman-shades','Designer Roman Shades','Roman Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:30','2025-06-26 06:03:10',3,0,'https://www.smartblindshub.com/images/5448a4be-1e3c-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(173,NULL,'Studio Solar Shades','studio-solar-shades','Studio Solar Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:31','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/530b3352-8c3d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(174,NULL,'Designer 2 1/2 Inch Ultra Faux Wood Blinds','designer-2-1-2-inch-ultra-faux-wood-blinds','Designer 2 1/2 Inch Ultra Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:32','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/af253b0a-af35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(175,NULL,'Designer 2 Inch Faux Wood Blinds','designer-2-inch-faux-wood-blinds','Designer 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:34','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/0b690d3f-9d35-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(176,NULL,'Premium Vertical Sheer Shades','premium-vertical-sheer-shades','Premium Vertical Sheer Shades','Sheer Vertical Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:35','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b9a60a5a-f2c9-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(177,NULL,'Fabric Sliding Panels','fabric-sliding-panels','Fabric Sliding Panels','Sliding Panels',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:37','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8a231251-e89d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(178,NULL,'Premium Wood Shutters','premium-wood-shutters','Premium Wood Shutters','Plantation Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:38','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ab04bfa9-448e-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(179,NULL,'Wood Cornice','wood-cornice','Wood Cornice','Cornices',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:39','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fd2898dc-a488-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(180,NULL,'Premium Light Filtering Cellular Skylight Shades','premium-light-filtering-cellular-skylight-shades','Premium Light Filtering Cellular Skylight Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:41','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/93d37492-37be-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(181,NULL,'Designer Light Filtering Roller Shades','designer-light-filtering-roller-shades','Designer Light Filtering Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c2ab76a5-b34a-ef11-9593-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(182,NULL,'Woven Wood Drapery','woven-wood-drapery','Woven Wood Drapery','Woven Wood Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:44','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ea4a97b2-e5af-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(183,NULL,'Light Dimming Sheer Shades','light-dimming-sheer-shades','Light Dimming Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:45','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/132f6d07-b293-eb11-948b-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(184,NULL,'2 Inch Light Filtering Fabric Blinds','2-inch-light-filtering-fabric-blinds','2 Inch Light Filtering Fabric Blinds','Fabric Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:46','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/3734e557-b992-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(185,NULL,'Blackout Cellular Skylights','blackout-cellular-skylights','Blackout Cellular Skylights','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:48','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/0a7951b9-ec12-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(186,NULL,'Classic 1 Inch Cordless Vinyl Blinds','classic-1-inch-cordless-vinyl-blinds','Classic 1 Inch Cordless Vinyl Blinds','Vinyl Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:52','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b6ba4d75-3abe-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(187,NULL,'Premier Flat Sheer Shades','premier-flat-sheer-shades','Premier Flat Sheer Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:56','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fecc0e9e-34be-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(188,NULL,'Premium Zebra Shades','premium-zebra-shades','Premium Zebra Shades','Dual Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:58','2025-06-26 06:03:10',9,0,'https://www.smartblindshub.com/images/fb40b91d-a788-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(189,NULL,'Heritage 2 Inch Aluminum Blinds','heritage-2-inch-aluminum-blinds','Heritage 2 Inch Aluminum Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:30:59','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/d722531b-cb92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(190,NULL,'Custom Composite Wood Arch','custom-composite-wood-arch','Custom Composite Wood Arch','Arches',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:00','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/9b59dc19-9088-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(191,NULL,'Designer Room Darkening Roller Shades','designer-room-darkening-roller-shades','Designer Room Darkening Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:02','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/7a95e9f8-e249-ef11-9593-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(192,NULL,'Blackout Cellular Verticals','blackout-cellular-verticals','Blackout Cellular Verticals','Vertical Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:03','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/2c222d15-ed12-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(193,NULL,'Light Filtering Cellular Shades','light-filtering-cellular-shades','Light Filtering Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:05','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/91d76edd-2d0b-f011-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(194,NULL,'Northern Heights 2 3/8 Inch Wood Blinds','northern-heights-2-3-8-inch-wood-blinds','Northern Heights 2 3/8 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:06','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b34dabeb-918a-e811-9470-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(195,NULL,'Pleated Skylight Shades','pleated-skylight-shades','Pleated Skylight Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:09','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/47661d1c-e59d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(196,NULL,'Sky Pole','sky-pole','Sky Pole','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:10','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c311b8b0-e3cb-e311-81dc-a395478499aa.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(197,NULL,'Designer Light Filtering Skylight Cellular Shades','designer-light-filtering-skylight-cellular-shades','Designer Light Filtering Skylight Cellular Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:11','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/5b2d2349-e59d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(198,NULL,'Blackout Angle Top or Bottom Cellular Shades','blackout-angle-top-or-bottom-cellular-shades','Blackout Angle Top or Bottom Cellular Shades','Angle Tops',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:16','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/a2c31513-c407-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(199,NULL,'Premium Cellular Shades','premium-cellular-shades','Premium Cellular Shades','Cellular Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:20','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/147d2b46-a432-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(200,NULL,'Panel Track Headrails','panel-track-headrails','Panel Track Headrails','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:21','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c7f2ed6e-150a-ea11-9476-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(201,NULL,'Designer Light Filtering Sheer Shades','designer-light-filtering-sheer-shades','Designer Light Filtering Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:22','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f9845120-d14d-ef11-9593-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(202,NULL,'Fabric Vertical Blinds','fabric-vertical-blinds','Fabric Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:25','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/6a94909e-fc03-ef11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(203,NULL,'2 1/2 Inch Faux Wood','2-1-2-inch-faux-wood','2 1/2 Inch Faux Wood','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:28','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/6fae2c1c-a735-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(204,NULL,'Woodcore Shutters','woodcore-shutters','Woodcore Shutters','Plantation Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:30','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/d30eab17-c592-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(205,NULL,'Premium Solar Roller Shades','premium-solar-roller-shades','Premium Solar Roller Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:31','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/562c659b-20e3-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(206,NULL,'Blackout Cellular Skylight Shades','blackout-cellular-skylight-shades','Blackout Cellular Skylight Shades','Skylights',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:35','2025-06-26 06:03:10',6,0,'https://www.smartblindshub.com/images/ae6923f3-e29d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(207,NULL,'2 1/2 Inch Real Wood Blinds','2-1-2-inch-real-wood-blinds','2 1/2 Inch Real Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:38','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e3939458-00b4-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(208,NULL,'Classic Cordless 2 1/2 Inch Faux Wood Blinds','classic-cordless-2-1-2-inch-faux-wood-blinds','Classic Cordless 2 1/2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:41','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/e991a717-9835-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(209,NULL,'Premium Light Filtering Sheer Shades','premium-light-filtering-sheer-shades','Premium Light Filtering Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:42','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8e6cd2ba-3af9-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(210,NULL,'Dual Roller Shade','dual-roller-shade','Dual Roller Shade','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:44','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8a8b8c00-c0ff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(211,NULL,'Economy Faux Wood Shutters','economy-faux-wood-shutters','Economy Faux Wood Shutters','Plantation Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:47','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/17c476f4-c492-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(212,NULL,'S Curved PVC Vertical Blinds','s-curved-pvc-vertical-blinds','S Curved PVC Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:48','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/0ee7eeae-ef9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(213,NULL,'2 Inch Pleated Shades ','2-inch-pleated-shades','2 Inch Pleated Shades ','Pleated Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:49','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a1a801f0-bdff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(214,NULL,'Studio Northern Heights 2 Inch Wood Blinds','studio-northern-heights-2-inch-wood-blinds','Studio Northern Heights 2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:52','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/a424e81a-e6af-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(215,NULL,'Vertical and Panels Track Valances','vertical-and-panels-track-valances','Vertical and Panels Track Valances','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:55','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/7648579e-e129-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(216,NULL,'Basic Custom Traversing Drapery Hardware','basic-custom-traversing-drapery-hardware','Basic Custom Traversing Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:56','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/fc8f18dd-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(217,NULL,'Premium 2 1/2 Inch Wood Blinds','premium-2-1-2-inch-wood-blinds','Premium 2 1/2 Inch Wood Blinds','Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:58','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/deaca44c-c387-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(218,NULL,'Outdoor Drapery Panel','outdoor-drapery-panel','Outdoor Drapery Panel','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:31:59','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/ad3bf1c2-b892-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(219,NULL,'Premium Cordless 2 Inch Faux Wood Blinds','premium-cordless-2-inch-faux-wood-blinds','Premium Cordless 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:01','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/f234fa5d-6c36-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(220,NULL,'Track Faux Wood Shutters','track-faux-wood-shutters','Track Faux Wood Shutters','Specialized Products',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:02','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/b358186f-8051-e511-9465-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(221,NULL,'LightBlocker 1 Inch Mini Blinds','lightblocker-1-inch-mini-blinds','LightBlocker 1 Inch Mini Blinds','Mini Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:03','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/88b336e4-ca92-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(222,NULL,'Light Filtering Roller Shades','light-filtering-roller-shades','Light Filtering Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:05','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/cdc7ee8e-773d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(223,NULL,'Board Mounted Valance','board-mounted-valance','Board Mounted Valance','Custom Valances',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:08','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/d721f08f-a488-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(224,NULL,'By-Pass Shutters','by-pass-shutters','By-Pass Shutters','Faux Wood Shutters',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:09','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/be0208c0-c992-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(225,NULL,'Manhattan 2 Inch Sheer Shades','manhattan-2-inch-sheer-shades','Manhattan 2 Inch Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:10','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/c9314122-df9d-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(226,NULL,'Signature+ with HeatShield Exterior Roller Shades','signature-with-heatshield-exterior-roller-shades','Signature+ with HeatShield Exterior Roller Shades','Exterior Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:12','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/8884e7f6-9d1f-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(227,5,'Classic Roman Shades','classic-roman-shades','Classic Roman Shades','Roman Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:14','2025-07-01 16:11:10',3,0,'https://www.smartblindshub.com/images/5850500e-a110-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(228,NULL,'Faux Woven Roller Shades','faux-woven-roller-shades','Faux Woven Roller Shades','Roller Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:15','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/88902d22-d292-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(229,5,'Solar Roller Shades','solar-roller-shades','Solar Roller Shades','Solar Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:18','2025-07-01 16:11:10',1,0,'https://www.smartblindshub.com/images/9bc854bb-593d-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(230,NULL,'Motorization Parts','motorization-parts','Motorization Parts','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:19','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/57fe65ac-50cc-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(231,NULL,'2 Inch PVC Vertical Blinds','2-inch-pvc-vertical-blinds','2 Inch PVC Vertical Blinds','Vertical Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:21','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/5d253b1b-08ce-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(232,5,'Classic Light Filtering Sheer Shades','classic-light-filtering-sheer-shades','Classic Light Filtering Sheer Shades','Sheer Shades | Horizontal Sheer Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:22','2025-07-01 16:11:10',1,0,'https://www.smartblindshub.com/images/8b9fd135-c687-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(233,NULL,'PVC Vertical Valance Only','pvc-vertical-valance-only','PVC Vertical Valance Only','Parts and Accessories',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:24','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/10a666b4-f339-e511-9465-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(234,5,'Casual Classics Roman Shades','casual-classics-roman-shades','Casual Classics Roman Shades','Roman Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:25','2025-07-01 16:11:10',3,0,'https://www.smartblindshub.com/images/9e62d33d-bcff-ef11-848c-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(235,NULL,'Custom Modern Metal Traversing Drapery Hardware','custom-modern-metal-traversing-drapery-hardware','Custom Modern Metal Traversing Drapery Hardware','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:26','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/44f0ea11-a688-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(236,5,'1 Inch Pleated Shades','1-inch-pleated-shades','1 Inch Pleated Shades','Pleated Shades',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:28','2025-07-01 16:11:10',1,0,'https://www.smartblindshub.com/images/efb4e6f6-f51a-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(237,NULL,'Deluxe Custom Drapery Rings','deluxe-custom-drapery-rings','Deluxe Custom Drapery Rings','Drapery Hardware',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:31','2025-06-26 06:03:10',1,0,'https://www.smartblindshub.com/images/262866bd-a588-ee11-94a4-0a986990730e.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(238,5,'Basic Cordless 2 Inch Faux Wood Blinds','basic-cordless-2-inch-faux-wood-blinds','Basic Cordless 2 Inch Faux Wood Blinds','Faux Wood Blinds',125.00,NULL,0,0,1,'in_stock',50,5,NULL,'2025-06-02 01:32:33','2025-07-01 16:11:10',1,0,'https://www.smartblindshub.com/images/aa9e955d-a335-f011-848d-0afffee37a07.jpg',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(239,5,'Roller Blinds Collection','roller-blinds','Premium roller blinds for modern homes','Our roller blinds collection offers sleek, modern window treatments perfect for any contemporary space.',79.99,NULL,0,0,1,'in_stock',50,5,'RB-COLLECTION-001','2025-06-14 21:42:08','2025-07-01 16:11:10',NULL,0,NULL,0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(240,5,'Premium Roller Shade','premium-roller-shade','High-quality roller shade for modern homes','Premium roller shade with advanced light filtering technology and smooth operation mechanism',199.99,NULL,0,0,1,'in_stock',50,5,'PRS-001','2025-06-16 21:38:05','2025-07-01 16:11:10',2,0,NULL,0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(241,5,'Cellular Shade Deluxe','cellular-shade','Energy-efficient cellular shades','Honeycomb cellular shades providing excellent insulation and light control',249.99,NULL,0,0,1,'in_stock',50,5,'CSD-001','2025-06-16 21:38:05','2025-07-01 16:11:10',21,0,NULL,0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(242,5,'Motorized Smart Blind','motorized-smart-blind','High-quality honeycomb blinds for modern homes','These honeycomb blinds offer superior insulation and light control. Perfect for bedrooms, living rooms, and offices. Available in multiple colors and sizes.',29.99,NULL,0,1,1,'in_stock',50,5,'MSB-001','2025-06-16 21:38:05','2025-07-01 16:11:10',4,0,'/uploads/products/vendor-2-1751247968540-8w6fyzpqhgu.png',0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(243,5,'Vendor A Roller Shade','vendor-a-roller-shade','Vendor A specialty roller shade','Custom roller shade from Vendor A with unique design patterns',29.99,NULL,0,1,1,'in_stock',50,5,'VAS-001','2025-06-16 21:38:05','2025-07-01 16:11:10',2,0,'/uploads/products/product_243_1750195341922_b337o93yu6.png',0,'active','approved',NULL,NULL,NULL,NULL,'Inside Mount','liftSystems:Cordless,liftSystems:Continuous Loop;wandSystem:Standard Wand,wandSystem:Extended Wand;stringSystem:String Lift,stringSystem:Chain System;remoteControl:Basic Remote,remoteControl:Smart Home Compatible',NULL,NULL,0,1,10.000,100.000,18.000,200.000,NULL,NULL,NULL,NULL),(244,5,'Vendor B Cellular Shade','vendor-b-cellular-shade','Vendor B energy-efficient shade','Premium cellular shade from Vendor B with superior insulation properties',229.99,NULL,0,0,1,'in_stock',50,5,'VBS-001','2025-06-16 21:38:05','2025-07-01 16:11:10',21,0,NULL,0,'active','approved',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_track_pricing_changes` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    IF NEW.base_price != OLD.base_price THEN
        INSERT INTO product_pricing_history (
            product_id, previous_price, new_price, change_reason, 
            change_source, effective_from
        ) VALUES (
            NEW.product_id, OLD.base_price, NEW.base_price, 'manual_update', 
            'system', NOW()
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `promotional_campaigns`
--

DROP TABLE IF EXISTS `promotional_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotional_campaigns` (
  `campaign_id` int NOT NULL AUTO_INCREMENT,
  `campaign_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_type` enum('percentage_off','fixed_amount_off','buy_x_get_y','free_shipping','bundle_deal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL,
  `buy_quantity` int DEFAULT NULL,
  `get_quantity` int DEFAULT NULL,
  `get_discount_percent` decimal(5,2) DEFAULT NULL,
  `applies_to` enum('all_products','specific_products','categories','brands') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_products',
  `target_product_ids` json DEFAULT NULL,
  `target_category_ids` json DEFAULT NULL,
  `target_brand_ids` json DEFAULT NULL,
  `excluded_product_ids` json DEFAULT NULL,
  `customer_segments` json DEFAULT NULL COMMENT 'Array of customer segments: new, returning, vip, etc.',
  `customer_types` json DEFAULT NULL COMMENT 'Array of customer types: retail, commercial, trade',
  `min_previous_orders` int DEFAULT NULL,
  `min_customer_lifetime_value` decimal(10,2) DEFAULT NULL,
  `target_regions` json DEFAULT NULL COMMENT 'Array of state/region codes',
  `excluded_regions` json DEFAULT NULL COMMENT 'Array of excluded regions',
  `is_active` tinyint(1) DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `usage_limit_total` int DEFAULT NULL,
  `usage_limit_per_customer` int DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `can_stack_with_volume_discounts` tinyint(1) DEFAULT '1',
  `can_stack_with_coupons` tinyint(1) DEFAULT '0',
  `priority` int DEFAULT '100',
  `total_orders` int DEFAULT '0',
  `total_revenue` decimal(12,2) DEFAULT '0.00',
  `total_discount_given` decimal(12,2) DEFAULT '0.00',
  `conversion_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`campaign_id`),
  UNIQUE KEY `campaign_code` (`campaign_code`),
  KEY `idx_campaign_code` (`campaign_code`),
  KEY `idx_active_campaigns` (`is_active`,`starts_at`,`ends_at`),
  KEY `idx_campaign_type` (`campaign_type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotional_campaigns`
--

LOCK TABLES `promotional_campaigns` WRITE;
/*!40000 ALTER TABLE `promotional_campaigns` DISABLE KEYS */;
INSERT INTO `promotional_campaigns` VALUES (1,'Spring Sale 2024','SPRING2024','percentage_off',NULL,NULL,15.00,NULL,100.00,NULL,NULL,NULL,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2024-03-01 00:00:00','2024-05-31 23:59:59','UTC',NULL,NULL,0,1,0,100,0,0.00,0.00,0.00,'2025-06-10 22:06:39','2025-06-10 22:06:39'),(2,'New Customer Welcome','WELCOME20','percentage_off',NULL,NULL,20.00,NULL,50.00,NULL,NULL,NULL,NULL,'all_products',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2024-01-01 00:00:00','2024-12-31 23:59:59','UTC',NULL,NULL,0,1,0,100,0,0.00,0.00,0.00,'2025-06-10 22:06:39','2025-06-10 22:06:39');
/*!40000 ALTER TABLE `promotional_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_replies`
--

DROP TABLE IF EXISTS `question_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_replies` (
  `reply_id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `reply_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff_reply` tinyint(1) DEFAULT '0',
  `helpful_votes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reply_id`),
  KEY `question_id` (`question_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `question_replies_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `customer_questions` (`question_id`) ON DELETE CASCADE,
  CONSTRAINT `question_replies_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_replies`
--

LOCK TABLES `question_replies` WRITE;
/*!40000 ALTER TABLE `question_replies` DISABLE KEYS */;
/*!40000 ALTER TABLE `question_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recently_viewed`
--

DROP TABLE IF EXISTS `recently_viewed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recently_viewed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int NOT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_viewed_at` (`viewed_at`),
  KEY `idx_user_viewed` (`user_id`,`viewed_at` DESC),
  KEY `idx_session_viewed` (`session_id`,`viewed_at` DESC),
  KEY `idx_cleanup` (`viewed_at`),
  CONSTRAINT `fk_recently_viewed_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recently_viewed_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_user_or_session` CHECK (((`user_id` is not null) or (`session_id` is not null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recently_viewed`
--

LOCK TABLES `recently_viewed` WRITE;
/*!40000 ALTER TABLE `recently_viewed` DISABLE KEYS */;
/*!40000 ALTER TABLE `recently_viewed` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `cleanup_old_recently_viewed` BEFORE INSERT ON `recently_viewed` FOR EACH ROW BEGIN
    -- Delete records older than 90 days
    DELETE FROM recently_viewed 
    WHERE viewed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `cleanup_recently_viewed` AFTER INSERT ON `recently_viewed` FOR EACH ROW BEGIN
    -- Clean up old records for authenticated users (keep last 50)
    IF NEW.user_id IS NOT NULL THEN
        DELETE rv FROM recently_viewed rv
        WHERE rv.user_id = NEW.user_id
        AND rv.id NOT IN (
            SELECT id FROM (
                SELECT id FROM recently_viewed 
                WHERE user_id = NEW.user_id 
                ORDER BY viewed_at DESC 
                LIMIT 50
            ) AS keep_recent
        );
    END IF;
    
    -- Clean up old records for guest sessions (keep last 20)
    IF NEW.session_id IS NOT NULL THEN
        DELETE rv FROM recently_viewed rv
        WHERE rv.session_id = NEW.session_id
        AND rv.id NOT IN (
            SELECT id FROM (
                SELECT id FROM recently_viewed 
                WHERE session_id = NEW.session_id 
                ORDER BY viewed_at DESC 
                LIMIT 20
            ) AS keep_recent
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `review_helpfulness`
--

DROP TABLE IF EXISTS `review_helpfulness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_helpfulness` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For guest users',
  `is_helpful` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_review` (`review_id`,`user_id`),
  UNIQUE KEY `unique_session_review` (`review_id`,`session_id`),
  KEY `idx_review_helpfulness` (`review_id`),
  KEY `idx_user_helpfulness` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_helpfulness`
--

LOCK TABLES `review_helpfulness` WRITE;
/*!40000 ALTER TABLE `review_helpfulness` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_helpfulness` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_images`
--

DROP TABLE IF EXISTS `review_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_alt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `idx_review_images` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_images`
--

LOCK TABLES `review_images` WRITE;
/*!40000 ALTER TABLE `review_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_measurements`
--

DROP TABLE IF EXISTS `room_measurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_measurements` (
  `measurement_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_dimensions` json DEFAULT NULL,
  `window_measurements` json NOT NULL,
  `measurement_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `measurement_images` json DEFAULT NULL,
  `is_professional_measured` tinyint(1) DEFAULT '0',
  `measured_by` int DEFAULT NULL,
  `measurement_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`measurement_id`),
  KEY `user_id` (`user_id`),
  KEY `measured_by` (`measured_by`),
  KEY `room_type` (`room_type`),
  CONSTRAINT `room_measurements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `room_measurements_ibfk_2` FOREIGN KEY (`measured_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_measurements`
--

LOCK TABLES `room_measurements` WRITE;
/*!40000 ALTER TABLE `room_measurements` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_measurements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_shopping_list_items`
--

DROP TABLE IF EXISTS `room_shopping_list_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_shopping_list_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `list_id` int NOT NULL,
  `product_id` int NOT NULL,
  `window_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `configuration_data` json DEFAULT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_purchased` tinyint(1) DEFAULT '0',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `list_id` (`list_id`),
  KEY `product_id` (`product_id`),
  KEY `is_purchased` (`is_purchased`),
  CONSTRAINT `room_shopping_list_items_ibfk_1` FOREIGN KEY (`list_id`) REFERENCES `room_shopping_lists` (`list_id`) ON DELETE CASCADE,
  CONSTRAINT `room_shopping_list_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_shopping_list_items`
--

LOCK TABLES `room_shopping_list_items` WRITE;
/*!40000 ALTER TABLE `room_shopping_list_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_shopping_list_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_shopping_lists`
--

DROP TABLE IF EXISTS `room_shopping_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_shopping_lists` (
  `list_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `list_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_measurement_id` int DEFAULT NULL,
  `estimated_total` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`list_id`),
  KEY `user_id` (`user_id`),
  KEY `room_measurement_id` (`room_measurement_id`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `room_shopping_lists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `room_shopping_lists_ibfk_2` FOREIGN KEY (`room_measurement_id`) REFERENCES `room_measurements` (`measurement_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_shopping_lists`
--

LOCK TABLES `room_shopping_lists` WRITE;
/*!40000 ALTER TABLE `room_shopping_lists` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_shopping_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_types`
--

DROP TABLE IF EXISTS `room_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_types` (
  `room_type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `typical_humidity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_exposure` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `privacy_requirements` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommended_products` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_type_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_types`
--

LOCK TABLES `room_types` WRITE;
/*!40000 ALTER TABLE `room_types` DISABLE KEYS */;
INSERT INTO `room_types` VALUES (1,'Living Room','The heart of your home where family and guests gather','/uploads/rooms/room_1_1750374943992_jyk8qlwlg9.jpg','Medium','High','Medium','Cellular shades, Roman shades, or motorized blinds for easy light control',1,'2025-06-19 23:12:57','2025-06-19 23:15:46'),(2,'Bedroom','Your personal sanctuary for rest and relaxation','/uploads/rooms/room_1_1750374862154_fbpfeyl2rou.jpeg','Low','Medium','High','Blackout shades, cellular shades for insulation, or room darkening roller shades',1,'2025-06-19 23:12:57','2025-06-19 23:14:31'),(3,'Kitchen','The bustling center of meal preparation and casual dining','/images/rooms/kitchen.jpg','High','High','Low','Faux wood blinds, vinyl blinds, or moisture-resistant roller shades',1,'2025-06-19 23:12:57','2025-06-19 23:12:57'),(4,'Bathroom','Private space requiring moisture-resistant treatments','/images/rooms/bathroom.jpg','High','Medium','High','Vinyl blinds, faux wood blinds, or moisture-resistant cellular shades',1,'2025-06-19 23:12:57','2025-06-19 23:12:57'),(5,'Dining Room','Formal space for meals and entertaining','/uploads/rooms/room_1_1750374912306_mh3uexfskco.jpg','Medium','Medium','Medium','Roman shades, sheer shades, or elegant drapery with blinds',1,'2025-06-19 23:12:57','2025-06-19 23:15:18'),(6,'Home Office','Productive workspace requiring glare control','/images/rooms/home-office.jpg','Low','Medium','Medium','Cellular shades, solar shades, or adjustable blinds for screen glare reduction',1,'2025-06-19 23:12:57','2025-06-19 23:12:57'),(7,'Nursery','Safe and comfortable space for your little ones','/images/rooms/nursery.jpg','Medium','Low','High','Cordless cellular shades, blackout shades, or motorized blinds for safety',0,'2025-06-19 23:12:57','2025-06-19 23:18:24'),(8,'Media Room','Entertainment space requiring precise light control','/images/rooms/media-room.jpg','Low','Low','High','Blackout shades, motorized blinds, or room darkening cellular shades',1,'2025-06-19 23:12:57','2025-06-19 23:12:57');
/*!40000 ALTER TABLE `room_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_visualizations`
--

DROP TABLE IF EXISTS `room_visualizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_visualizations` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `room_image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `result_image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `placement` json DEFAULT NULL COMMENT 'Stores window placement data: x, y, width, height, scale, rotation',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_visualizations` (`user_id`,`created_at`),
  KEY `idx_product_visualizations` (`product_id`,`created_at`),
  CONSTRAINT `room_visualizations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `room_visualizations_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_visualizations`
--

LOCK TABLES `room_visualizations` WRITE;
/*!40000 ALTER TABLE `room_visualizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_visualizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_assistance_sessions`
--

DROP TABLE IF EXISTS `sales_assistance_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_assistance_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `customer_user_id` int NOT NULL,
  `sales_staff_id` int DEFAULT NULL,
  `access_pin` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_type` enum('cart_assistance','consultation','general_support') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cart_assistance',
  `status` enum('pending','active','completed','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `customer_cart_id` int DEFAULT NULL,
  `permissions` json DEFAULT NULL COMMENT 'What sales staff can do: view_cart, modify_cart, apply_discounts, etc.',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `unique_active_pin` (`access_pin`,`status`),
  KEY `customer_user_id` (`customer_user_id`),
  KEY `sales_staff_id` (`sales_staff_id`),
  KEY `customer_cart_id` (`customer_cart_id`),
  KEY `idx_pin_status` (`access_pin`,`status`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `sales_assistance_sessions_ibfk_1` FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_assistance_sessions_ibfk_2` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_assistance_sessions_ibfk_3` FOREIGN KEY (`customer_cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_assistance_sessions`
--

LOCK TABLES `sales_assistance_sessions` WRITE;
/*!40000 ALTER TABLE `sales_assistance_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_assistance_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_cart_access_log`
--

DROP TABLE IF EXISTS `sales_cart_access_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_cart_access_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `assistance_session_id` int NOT NULL,
  `sales_staff_id` int NOT NULL,
  `customer_user_id` int NOT NULL,
  `cart_id` int NOT NULL,
  `action_type` enum('view_cart','add_item','remove_item','modify_item','apply_discount','remove_discount','add_coupon','remove_coupon') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  CONSTRAINT `sales_cart_access_log_ibfk_1` FOREIGN KEY (`assistance_session_id`) REFERENCES `sales_assistance_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_2` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_3` FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_cart_access_log_ibfk_4` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_cart_access_log`
--

LOCK TABLES `sales_cart_access_log` WRITE;
/*!40000 ALTER TABLE `sales_cart_access_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_cart_access_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_staff`
--

DROP TABLE IF EXISTS `sales_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_staff` (
  `sales_staff_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `territory` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `availability_schedule` json DEFAULT NULL,
  `hourly_rate` decimal(8,2) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `total_consultations` int DEFAULT '0',
  `commission_rate` decimal(5,2) DEFAULT '0.00',
  `target_sales` decimal(10,2) DEFAULT '0.00',
  `total_sales` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` date DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sales_staff_id`),
  KEY `user_id` (`user_id`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_sales_staff_vendor` (`vendor_id`),
  CONSTRAINT `fk_sales_staff_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_staff_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_staff`
--

LOCK TABLES `sales_staff` WRITE;
/*!40000 ALTER TABLE `sales_staff` DISABLE KEYS */;
INSERT INTO `sales_staff` VALUES (1,4,NULL,'North Region',NULL,NULL,NULL,NULL,NULL,0,5.00,100000.00,45000.00,1,'2024-01-01',NULL,'2025-06-08 21:13:09','2025-06-08 21:13:09'),(2,4,NULL,'North Region',NULL,NULL,NULL,NULL,NULL,0,5.00,100000.00,45000.00,1,'2024-01-01',NULL,'2025-06-08 21:14:54','2025-06-08 21:14:54');
/*!40000 ALTER TABLE `sales_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_staff_online_status`
--

DROP TABLE IF EXISTS `sales_staff_online_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `sales_staff_online_status_ibfk_1` FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff` (`sales_staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_staff_online_status`
--

LOCK TABLES `sales_staff_online_status` WRITE;
/*!40000 ALTER TABLE `sales_staff_online_status` DISABLE KEYS */;
INSERT INTO `sales_staff_online_status` VALUES (1,1,1,1,0,5,'2025-06-14 19:41:14',NULL,'2025-06-13 20:45:10','2025-06-14 19:41:14');
/*!40000 ALTER TABLE `sales_staff_online_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sample_inventory`
--

DROP TABLE IF EXISTS `sample_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `swatch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_stock` int DEFAULT '0' COMMENT 'Current sample pieces in stock',
  `reserved_stock` int DEFAULT '0' COMMENT 'Reserved for pending orders',
  `available_stock` int GENERATED ALWAYS AS ((`current_stock` - `reserved_stock`)) STORED,
  `minimum_stock_level` int DEFAULT '5' COMMENT 'Reorder threshold',
  `reorder_quantity` int DEFAULT '20' COMMENT 'How many to reorder',
  `supplier_id` int DEFAULT NULL COMMENT 'Primary supplier for this swatch',
  `supplier_lead_time_days` int DEFAULT '14',
  `cost_per_sample` decimal(8,2) DEFAULT '0.00',
  `last_reorder_date` date DEFAULT NULL,
  `last_reorder_quantity` int DEFAULT NULL,
  `last_reorder_cost` decimal(10,2) DEFAULT NULL,
  `storage_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Warehouse location',
  `storage_bin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `unique_swatch_inventory` (`swatch_id`),
  KEY `idx_available_stock` (`available_stock`),
  KEY `idx_minimum_stock` (`minimum_stock_level`,`available_stock`),
  KEY `idx_supplier` (`supplier_id`),
  KEY `idx_storage_location` (`storage_location`,`storage_bin`),
  KEY `idx_inventory_alerts` (`available_stock`,`minimum_stock_level`),
  CONSTRAINT `fk_sample_inventory_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sample_inventory_swatch` FOREIGN KEY (`swatch_id`) REFERENCES `material_swatches` (`swatch_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_inventory`
--

LOCK TABLES `sample_inventory` WRITE;
/*!40000 ALTER TABLE `sample_inventory` DISABLE KEYS */;
INSERT INTO `sample_inventory` (`inventory_id`, `swatch_id`, `current_stock`, `reserved_stock`, `minimum_stock_level`, `reorder_quantity`, `supplier_id`, `supplier_lead_time_days`, `cost_per_sample`, `last_reorder_date`, `last_reorder_quantity`, `last_reorder_cost`, `storage_location`, `storage_bin`, `last_updated`) VALUES (1,'SW-001-WHT-ALU',25,0,5,20,NULL,14,0.50,NULL,NULL,NULL,'Warehouse A - Bin A1',NULL,'2025-06-09 20:37:30'),(2,'SW-002-BLK-ALU',30,0,5,20,NULL,14,0.50,NULL,NULL,NULL,'Warehouse A - Bin A2',NULL,'2025-06-09 20:37:30'),(3,'SW-003-WD-FAU',20,0,5,15,NULL,14,1.25,NULL,NULL,NULL,'Warehouse A - Bin B1',NULL,'2025-06-09 20:37:30'),(4,'SW-101-LIN-NAT',15,0,3,10,NULL,14,2.50,NULL,NULL,NULL,'Warehouse B - Bin C1',NULL,'2025-06-09 20:37:30'),(5,'SW-102-SLK-CRM',8,0,3,10,NULL,14,3.75,NULL,NULL,NULL,'Warehouse B - Bin C2',NULL,'2025-06-09 20:37:30'),(6,'SW-103-COT-NVY',22,0,5,15,NULL,14,1.50,NULL,NULL,NULL,'Warehouse B - Bin C3',NULL,'2025-06-09 20:37:30'),(7,'SW-201-CEL-WHT',35,0,8,25,NULL,14,0.75,NULL,NULL,NULL,'Warehouse A - Bin D1',NULL,'2025-06-09 20:37:30'),(8,'SW-202-ROM-BEI',18,0,5,15,NULL,14,2.00,NULL,NULL,NULL,'Warehouse A - Bin D2',NULL,'2025-06-09 20:37:30');
/*!40000 ALTER TABLE `sample_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sample_order_items`
--

DROP TABLE IF EXISTS `sample_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_order_items` (
  `sample_item_id` int NOT NULL AUTO_INCREMENT,
  `sample_order_id` int NOT NULL,
  `swatch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT '1' COMMENT 'Usually 1 for samples',
  `sample_fee` decimal(8,2) DEFAULT '0.00' COMMENT 'Fee for this specific sample',
  `item_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Customer notes for this specific sample',
  `fulfillment_status` enum('pending','picked','packed','shipped') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `fulfillment_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sample_item_id`),
  KEY `idx_sample_order` (`sample_order_id`),
  KEY `idx_swatch` (`swatch_id`),
  KEY `idx_fulfillment_status` (`fulfillment_status`),
  KEY `idx_sample_items_fulfillment` (`sample_order_id`,`fulfillment_status`),
  CONSTRAINT `fk_sample_items_order` FOREIGN KEY (`sample_order_id`) REFERENCES `sample_orders` (`sample_order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sample_items_swatch` FOREIGN KEY (`swatch_id`) REFERENCES `material_swatches` (`swatch_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_order_items`
--

LOCK TABLES `sample_order_items` WRITE;
/*!40000 ALTER TABLE `sample_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sample_order_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `reserve_sample_inventory` AFTER INSERT ON `sample_order_items` FOR EACH ROW BEGIN
    UPDATE sample_inventory 
    SET reserved_stock = reserved_stock + NEW.quantity
    WHERE swatch_id = NEW.swatch_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `ship_sample_inventory` AFTER UPDATE ON `sample_order_items` FOR EACH ROW BEGIN
    IF OLD.fulfillment_status != 'shipped' AND NEW.fulfillment_status = 'shipped' THEN
        UPDATE sample_inventory 
        SET current_stock = current_stock - NEW.quantity,
            reserved_stock = reserved_stock - NEW.quantity
        WHERE swatch_id = NEW.swatch_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `sample_order_management`
--

DROP TABLE IF EXISTS `sample_order_management`;
/*!50001 DROP VIEW IF EXISTS `sample_order_management`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `sample_order_management` AS SELECT 
 1 AS `sample_order_id`,
 1 AS `order_id`,
 1 AS `email`,
 1 AS `shipping_name`,
 1 AS `status`,
 1 AS `priority`,
 1 AS `sample_count`,
 1 AS `total_amount`,
 1 AS `created_at`,
 1 AS `estimated_delivery`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `items_count`,
 1 AS `items_shipped`,
 1 AS `fully_shipped`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `sample_orders`
--

DROP TABLE IF EXISTS `sample_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_orders` (
  `sample_order_id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'External order ID for tracking',
  `user_id` int DEFAULT NULL COMMENT 'Registered user ID, null for guests',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_zip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'United States',
  `shipping_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('STANDARD','EXPRESS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'STANDARD',
  `sample_count` int NOT NULL DEFAULT '0',
  `sample_fees` decimal(10,2) DEFAULT '0.00' COMMENT 'Total fees for samples',
  `shipping_fee` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','processing','shipped','delivered','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `tracking_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_carrier` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_delivery` date DEFAULT NULL,
  `actual_delivery_date` date DEFAULT NULL,
  `customer_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `internal_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fulfillment_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `processed_at` timestamp NULL DEFAULT NULL,
  `processed_by` int DEFAULT NULL COMMENT 'Staff member who processed order',
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sample_order_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_date` (`created_at`),
  KEY `idx_processing` (`status`,`priority`,`created_at`),
  KEY `idx_tracking` (`tracking_number`),
  KEY `idx_delivery_date` (`estimated_delivery`,`actual_delivery_date`),
  KEY `fk_sample_orders_processor` (`processed_by`),
  KEY `idx_orders_fulfillment` (`status`,`priority`,`created_at`),
  KEY `idx_orders_customer_lookup` (`email`,`user_id`,`created_at` DESC),
  CONSTRAINT `fk_sample_orders_processor` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sample_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_orders`
--

LOCK TABLES `sample_orders` WRITE;
/*!40000 ALTER TABLE `sample_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sample_orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `release_sample_inventory` AFTER UPDATE ON `sample_orders` FOR EACH ROW BEGIN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE sample_inventory si
        JOIN sample_order_items soi ON si.swatch_id = soi.swatch_id
        SET si.reserved_stock = si.reserved_stock - soi.quantity
        WHERE soi.sample_order_id = NEW.sample_order_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `sample_request_history`
--

DROP TABLE IF EXISTS `sample_request_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_request_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_type` enum('swatch','sample','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','shipped','delivered','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `request_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_date` timestamp NULL DEFAULT NULL,
  `shipped_date` timestamp NULL DEFAULT NULL,
  `tracking_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_count` int NOT NULL DEFAULT '1',
  `product_ids` json NOT NULL,
  `color_ids` json NOT NULL,
  `custom_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `guest_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address_id` int DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_user_tracking` (`user_id`,`request_date`),
  KEY `idx_session_tracking` (`session_id`,`request_date`),
  KEY `idx_status` (`status`),
  KEY `shipping_address_id` (`shipping_address_id`),
  CONSTRAINT `sample_request_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `sample_request_history_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_request_history`
--

LOCK TABLES `sample_request_history` WRITE;
/*!40000 ALTER TABLE `sample_request_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `sample_request_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sample_request_limits`
--

DROP TABLE IF EXISTS `sample_request_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_request_limits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_type` enum('guest','registered','designer','trade') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_monthly_requests` int NOT NULL DEFAULT '5',
  `max_total_requests` int NOT NULL DEFAULT '15',
  `max_active_requests` int NOT NULL DEFAULT '3',
  `cool_down_days` int NOT NULL DEFAULT '30',
  `max_samples_per_request` int NOT NULL DEFAULT '5',
  `requires_approval` tinyint(1) DEFAULT '0',
  `is_free` tinyint(1) DEFAULT '1',
  `cost_per_sample` decimal(10,2) DEFAULT '0.00',
  `free_shipping_threshold` decimal(10,2) DEFAULT NULL,
  `can_request_custom_sizes` tinyint(1) DEFAULT '0',
  `can_request_large_samples` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_type` (`user_type`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `sample_request_limits_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `sample_request_limits_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_request_limits`
--

LOCK TABLES `sample_request_limits` WRITE;
/*!40000 ALTER TABLE `sample_request_limits` DISABLE KEYS */;
INSERT INTO `sample_request_limits` VALUES (1,'registered',5,15,3,30,5,0,1,0.00,NULL,0,0,'2025-06-17 14:54:16','2025-06-17 14:54:16',NULL,NULL);
/*!40000 ALTER TABLE `sample_request_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sample_reviews`
--

DROP TABLE IF EXISTS `sample_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `sample_order_id` int NOT NULL,
  `swatch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` tinyint NOT NULL COMMENT '1-5 star rating',
  `review_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `would_recommend` tinyint(1) DEFAULT NULL,
  `color_accuracy_rating` tinyint DEFAULT NULL COMMENT '1-5 rating for color accuracy',
  `texture_rating` tinyint DEFAULT NULL COMMENT '1-5 rating for texture representation',
  `quality_rating` tinyint DEFAULT NULL COMMENT '1-5 rating for sample quality',
  `feedback_for_business` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Private feedback not shown publicly',
  `is_approved` tinyint(1) DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `moderated_by` int DEFAULT NULL,
  `moderated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `idx_sample_order_reviews` (`sample_order_id`),
  KEY `idx_swatch_reviews` (`swatch_id`),
  KEY `idx_user_reviews` (`user_id`),
  KEY `idx_email_reviews` (`email`),
  KEY `idx_rating` (`rating`),
  KEY `idx_approved` (`is_approved`,`is_featured`),
  KEY `idx_moderation` (`moderated_by`,`moderated_at`),
  KEY `idx_reviews_display` (`swatch_id`,`is_approved`,`rating` DESC),
  CONSTRAINT `fk_sample_reviews_moderator` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sample_reviews_order` FOREIGN KEY (`sample_order_id`) REFERENCES `sample_orders` (`sample_order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sample_reviews_swatch` FOREIGN KEY (`swatch_id`) REFERENCES `material_swatches` (`swatch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sample_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_reviews`
--

LOCK TABLES `sample_reviews` WRITE;
/*!40000 ALTER TABLE `sample_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `sample_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_cart_items`
--

DROP TABLE IF EXISTS `saved_cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_cart_items` (
  `saved_item_id` int NOT NULL AUTO_INCREMENT,
  `saved_cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `configuration` json DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `priority` enum('low','medium','high') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `room_assignment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`saved_item_id`),
  KEY `idx_saved_cart_items` (`saved_cart_id`),
  KEY `idx_product_saved` (`product_id`),
  CONSTRAINT `fk_saved_cart_items_cart` FOREIGN KEY (`saved_cart_id`) REFERENCES `saved_carts` (`saved_cart_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_cart_items`
--

LOCK TABLES `saved_cart_items` WRITE;
/*!40000 ALTER TABLE `saved_cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_carts`
--

DROP TABLE IF EXISTS `saved_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_carts` (
  `saved_cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `cart_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `project_type` enum('residential','commercial','renovation','new_construction','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'residential',
  `is_template` tinyint(1) DEFAULT '0',
  `is_favorite` tinyint(1) DEFAULT '0',
  `total_items` int DEFAULT '0',
  `estimated_total` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`saved_cart_id`),
  KEY `idx_user_saved_carts` (`user_id`),
  KEY `idx_project_type` (`project_type`),
  KEY `idx_is_template` (`is_template`),
  CONSTRAINT `fk_saved_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_carts`
--

LOCK TABLES `saved_carts` WRITE;
/*!40000 ALTER TABLE `saved_carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_payment_methods`
--

DROP TABLE IF EXISTS `saved_payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stripe_payment_method_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_type` enum('card','bank_account','digital_wallet') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'card',
  `card_brand` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_last_four` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_exp_month` int DEFAULT NULL,
  `card_exp_year` int DEFAULT NULL,
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_last_four` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_type` enum('checking','savings') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wallet_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wallet_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_address_line1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_address_line2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_state` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_country` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'US',
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'stripe',
  `external_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_data` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_stripe_pm` (`stripe_payment_method_id`),
  KEY `idx_user_default` (`user_id`,`is_default`),
  KEY `idx_user_active` (`user_id`,`is_active`),
  KEY `idx_saved_payment_provider` (`user_id`,`provider`),
  KEY `idx_saved_payment_external` (`provider`,`external_id`),
  CONSTRAINT `fk_saved_payment_methods_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_payment_methods`
--

LOCK TABLES `saved_payment_methods` WRITE;
/*!40000 ALTER TABLE `saved_payment_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `search_suggestions`
--

DROP TABLE IF EXISTS `search_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_suggestions` (
  `suggestion_id` int NOT NULL AUTO_INCREMENT,
  `suggestion_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `suggestion_type` enum('product','category','brand','feature','room') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `search_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`suggestion_id`),
  UNIQUE KEY `suggestion_text` (`suggestion_text`),
  KEY `suggestion_type` (`suggestion_type`),
  KEY `search_count` (`search_count`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_suggestions`
--

LOCK TABLES `search_suggestions` WRITE;
/*!40000 ALTER TABLE `search_suggestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `search_suggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `expires` timestamp NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uk_sessions_session_token` (`session_token`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_expires` (`expires`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shared_carts`
--

DROP TABLE IF EXISTS `shared_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shared_carts` (
  `share_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cart_id` int NOT NULL,
  `shared_by` int NOT NULL,
  `share_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `share_type` enum('view','edit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'view',
  `expires_at` timestamp NULL DEFAULT NULL,
  `access_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`share_id`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `idx_cart_shares` (`cart_id`),
  KEY `idx_share_token` (`share_token`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `fk_shared_carts_user` (`shared_by`),
  CONSTRAINT `fk_shared_carts_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shared_carts_user` FOREIGN KEY (`shared_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shared_carts`
--

LOCK TABLES `shared_carts` WRITE;
/*!40000 ALTER TABLE `shared_carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shared_carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_rates`
--

DROP TABLE IF EXISTS `shipping_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_rates` (
  `rate_id` int NOT NULL AUTO_INCREMENT,
  `zone_id` int NOT NULL,
  `service_type` enum('standard','expedited','overnight','weekend','white_glove') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name like "Standard Ground", "Next Day Air"',
  `carrier` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UPS, FedEx, USPS, etc.',
  `base_rate` decimal(10,2) NOT NULL COMMENT 'Base shipping cost',
  `per_pound_rate` decimal(10,2) DEFAULT '0.00',
  `per_item_rate` decimal(10,2) DEFAULT '0.00',
  `minimum_rate` decimal(10,2) DEFAULT '0.00',
  `maximum_rate` decimal(10,2) DEFAULT NULL,
  `free_shipping_threshold` decimal(10,2) DEFAULT NULL COMMENT 'Order amount for free shipping',
  `weight_threshold_lbs` decimal(8,2) DEFAULT NULL COMMENT 'Weight where different pricing applies',
  `estimated_days_min` int NOT NULL DEFAULT '1',
  `estimated_days_max` int NOT NULL DEFAULT '7',
  `business_days_only` tinyint(1) DEFAULT '1',
  `requires_signature` tinyint(1) DEFAULT '0',
  `requires_adult_signature` tinyint(1) DEFAULT '0',
  `includes_insurance` tinyint(1) DEFAULT '0',
  `max_insurance_value` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `effective_from` date DEFAULT NULL,
  `effective_until` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rate_id`),
  KEY `idx_zone_rates` (`zone_id`,`service_type`),
  KEY `idx_active_rates` (`is_active`,`effective_from`,`effective_until`),
  KEY `idx_free_shipping` (`free_shipping_threshold`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_carrier` (`carrier`),
  CONSTRAINT `fk_shipping_rates_zone` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones` (`zone_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_rates`
--

LOCK TABLES `shipping_rates` WRITE;
/*!40000 ALTER TABLE `shipping_rates` DISABLE KEYS */;
INSERT INTO `shipping_rates` VALUES (1,1,'standard','Standard Ground','UPS',9.99,0.50,0.00,0.00,NULL,100.00,NULL,3,7,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38'),(2,1,'expedited','2-Day Express','UPS',19.99,1.00,0.00,0.00,NULL,NULL,NULL,2,2,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38'),(3,1,'overnight','Next Day Air','UPS',39.99,2.00,0.00,0.00,NULL,NULL,NULL,1,1,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38'),(4,1,'standard','Standard Ground','UPS',9.99,0.50,0.00,0.00,NULL,100.00,NULL,3,7,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:06','2025-06-10 03:47:06'),(5,1,'expedited','2-Day Express','UPS',19.99,1.00,0.00,0.00,NULL,NULL,NULL,2,2,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:06','2025-06-10 03:47:06'),(6,1,'overnight','Next Day Air','UPS',39.99,2.00,0.00,0.00,NULL,NULL,NULL,1,1,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:06','2025-06-10 03:47:06'),(7,1,'standard','Standard Ground','UPS',9.99,0.50,0.00,0.00,NULL,100.00,NULL,3,7,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:21','2025-06-10 03:47:21'),(8,1,'expedited','2-Day Express','UPS',19.99,1.00,0.00,0.00,NULL,NULL,NULL,2,2,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:21','2025-06-10 03:47:21'),(9,1,'overnight','Next Day Air','UPS',39.99,2.00,0.00,0.00,NULL,NULL,NULL,1,1,1,0,0,0,NULL,1,NULL,NULL,'2025-06-10 03:47:21','2025-06-10 03:47:21');
/*!40000 ALTER TABLE `shipping_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_zones`
--

DROP TABLE IF EXISTS `shipping_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_zones` (
  `zone_id` int NOT NULL AUTO_INCREMENT,
  `zone_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `zone_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `countries` json NOT NULL COMMENT 'Array of supported countries',
  `states_provinces` json DEFAULT NULL COMMENT 'Array of supported states/provinces if country-specific',
  `postal_code_patterns` json DEFAULT NULL COMMENT 'Regex patterns for postal codes',
  `is_active` tinyint(1) DEFAULT '1',
  `priority` int DEFAULT '0' COMMENT 'Zone matching priority (higher = checked first)',
  `supports_standard` tinyint(1) DEFAULT '1',
  `supports_expedited` tinyint(1) DEFAULT '1',
  `supports_overnight` tinyint(1) DEFAULT '0',
  `supports_weekend` tinyint(1) DEFAULT '0',
  `max_weight_lbs` decimal(8,2) DEFAULT NULL COMMENT 'Maximum package weight for this zone',
  `max_dimensions_inches` json DEFAULT NULL COMMENT 'Max length/width/height in inches',
  `restricted_items` json DEFAULT NULL COMMENT 'Product categories not allowed in this zone',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`zone_id`),
  UNIQUE KEY `zone_code` (`zone_code`),
  KEY `idx_zone_code` (`zone_code`),
  KEY `idx_active_zones` (`is_active`,`priority`),
  KEY `idx_zone_priority` (`priority` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_zones`
--

LOCK TABLES `shipping_zones` WRITE;
/*!40000 ALTER TABLE `shipping_zones` DISABLE KEYS */;
INSERT INTO `shipping_zones` VALUES (1,'United States Domestic','US_DOMESTIC','[\"United States\"]',NULL,NULL,1,100,1,1,1,0,NULL,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38'),(2,'Canada','CANADA','[\"Canada\"]',NULL,NULL,1,90,1,1,0,0,NULL,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38'),(3,'International','INTERNATIONAL','[\"*\"]',NULL,NULL,1,10,1,0,0,0,NULL,NULL,NULL,'2025-06-10 03:46:38','2025-06-10 03:46:38');
/*!40000 ALTER TABLE `shipping_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_accounts`
--

DROP TABLE IF EXISTS `social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_accounts` (
  `social_account_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Social provider name',
  `provider_account_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Account ID from provider',
  `provider_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'oauth' COMMENT 'Provider type',
  `refresh_token` text COLLATE utf8mb4_unicode_ci COMMENT 'Refresh token from provider',
  `access_token` text COLLATE utf8mb4_unicode_ci COMMENT 'Access token from provider',
  `expires_at` int DEFAULT NULL COMMENT 'Token expiration timestamp',
  `token_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Token type',
  `scope` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Token scope',
  `id_token` text COLLATE utf8mb4_unicode_ci COMMENT 'ID token from provider',
  `session_state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Session state',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`social_account_id`),
  UNIQUE KEY `uk_social_accounts_provider` (`provider`,`provider_account_id`),
  KEY `idx_social_accounts_user_id` (`user_id`),
  KEY `idx_social_accounts_provider` (`provider`),
  CONSTRAINT `social_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_accounts`
--

LOCK TABLES `social_accounts` WRITE;
/*!40000 ALTER TABLE `social_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_media_accounts`
--

DROP TABLE IF EXISTS `social_media_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_media_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `platform` enum('facebook','instagram','twitter','linkedin','youtube','pinterest','tiktok') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `auto_post` tinyint(1) DEFAULT '0',
  `post_schedule` json DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `show_in_footer` tinyint(1) DEFAULT '1',
  `show_in_header` tinyint(1) DEFAULT '0',
  `icon_class` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_platform_account` (`platform`,`account_name`),
  KEY `idx_platform` (`platform`),
  KEY `idx_active` (`is_active`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_media_accounts`
--

LOCK TABLES `social_media_accounts` WRITE;
/*!40000 ALTER TABLE `social_media_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_media_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_media_posts`
--

DROP TABLE IF EXISTS `social_media_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_media_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `post_type` enum('product_showcase','room_inspiration','customer_review','promotion','educational','company_news','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_urls` json DEFAULT NULL,
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `review_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `post_status` enum('draft','scheduled','published','failed','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `scheduled_time` timestamp NULL DEFAULT NULL,
  `published_time` timestamp NULL DEFAULT NULL,
  `platform_post_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engagement_metrics` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_post_type` (`post_type`),
  KEY `idx_status` (`post_status`),
  KEY `idx_scheduled` (`scheduled_time`),
  KEY `idx_product` (`product_id`),
  KEY `order_id` (`order_id`),
  KEY `review_id` (`review_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `social_media_posts_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `social_media_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `social_media_posts_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL,
  CONSTRAINT `social_media_posts_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `social_media_posts_ibfk_4` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`review_id`) ON DELETE SET NULL,
  CONSTRAINT `social_media_posts_ibfk_5` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_media_posts`
--

LOCK TABLES `social_media_posts` WRITE;
/*!40000 ALTER TABLE `social_media_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_media_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialty_options`
--

DROP TABLE IF EXISTS `specialty_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialty_options` (
  `specialty_option_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_adjustment` decimal(10,2) DEFAULT '0.00',
  `compatibility_requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `installation_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`specialty_option_id`),
  UNIQUE KEY `name` (`name`),
  KEY `category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialty_options`
--

LOCK TABLES `specialty_options` WRITE;
/*!40000 ALTER TABLE `specialty_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `specialty_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_alerts`
--

DROP TABLE IF EXISTS `stock_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_alerts` (
  `stock_alert_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `configuration` json DEFAULT NULL COMMENT 'Specific variant configuration',
  `email_when_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`stock_alert_id`),
  UNIQUE KEY `unique_user_product_config` (`user_id`,`product_id`),
  KEY `idx_stock_alerts_user` (`user_id`),
  KEY `idx_stock_alerts_product` (`product_id`),
  KEY `idx_stock_alerts_active` (`notified_at`),
  CONSTRAINT `fk_stock_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_alerts`
--

LOCK TABLES `stock_alerts` WRITE;
/*!40000 ALTER TABLE `stock_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `swatch_categories`
--

DROP TABLE IF EXISTS `swatch_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `swatch_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  KEY `idx_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `swatch_categories`
--

LOCK TABLES `swatch_categories` WRITE;
/*!40000 ALTER TABLE `swatch_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `swatch_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_rates`
--

DROP TABLE IF EXISTS `tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_rates` (
  `tax_rate_id` int NOT NULL AUTO_INCREMENT,
  `zip_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `county` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_tax_rate` decimal(6,4) DEFAULT '0.0000',
  `county_tax_rate` decimal(6,4) DEFAULT '0.0000',
  `city_tax_rate` decimal(6,4) DEFAULT '0.0000',
  `special_district_tax_rate` decimal(6,4) DEFAULT '0.0000',
  `total_tax_rate` decimal(6,4) NOT NULL,
  `tax_jurisdiction` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effective_date` date DEFAULT (curdate()),
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tax_rate_id`),
  KEY `idx_zip_code` (`zip_code`),
  KEY `idx_state_code` (`state_code`),
  KEY `idx_total_rate` (`total_tax_rate`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_rates`
--

LOCK TABLES `tax_rates` WRITE;
/*!40000 ALTER TABLE `tax_rates` DISABLE KEYS */;
INSERT INTO `tax_rates` VALUES (38,'78701','Austin','Travis County','TX','Texas',6.2500,2.0000,0.0000,0.0000,8.2500,'Austin','2025-06-20',1,'2025-06-21 04:25:39','2025-06-21 04:25:39'),(39,'10001','New York','New York County','NY','New York',4.0000,4.2500,0.0000,0.0000,8.2500,'New York City','2025-06-20',1,'2025-06-21 04:25:39','2025-06-21 04:25:39'),(40,'90210','Beverly Hills','Los Angeles County','CA','California',7.2500,2.2500,0.0000,0.0000,9.5000,'Los Angeles County','2025-06-20',1,'2025-06-21 04:25:39','2025-06-21 04:25:39'),(41,'60601','Chicago','Cook County','IL','Illinois',6.2500,1.7500,2.2500,0.0000,10.2500,'Chicago','2025-06-20',1,'2025-06-21 04:25:39','2025-06-21 04:25:39'),(42,'99999','Unknown','Unknown','US','United States',6.0000,2.0000,0.0000,0.0000,8.0000,'US Average Tax Rate','2025-06-20',1,'2025-06-21 04:25:39','2025-06-21 04:25:39');
/*!40000 ALTER TABLE `tax_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `technician_availability`
--

DROP TABLE IF EXISTS `technician_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `technician_availability` (
  `availability_id` int NOT NULL AUTO_INCREMENT,
  `technician_id` int NOT NULL,
  `availability_date` date NOT NULL,
  `time_slot_id` int NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `unavailable_reason` enum('booked','vacation','sick','training','maintenance','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `custom_start_time` time DEFAULT NULL COMMENT 'Override slot start time',
  `custom_end_time` time DEFAULT NULL COMMENT 'Override slot end time',
  `max_jobs_override` int DEFAULT NULL COMMENT 'Override max jobs for this slot',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  UNIQUE KEY `unique_technician_date_slot` (`technician_id`,`availability_date`,`time_slot_id`),
  KEY `fk_availability_slot` (`time_slot_id`),
  KEY `idx_date_availability` (`availability_date`,`is_available`),
  KEY `idx_technician_calendar` (`technician_id`,`availability_date`),
  CONSTRAINT `fk_availability_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `installation_time_slots` (`slot_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_availability_technician` FOREIGN KEY (`technician_id`) REFERENCES `installation_technicians` (`technician_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `technician_availability`
--

LOCK TABLES `technician_availability` WRITE;
/*!40000 ALTER TABLE `technician_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `technician_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trade_applications`
--

DROP TABLE IF EXISTS `trade_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trade_applications` (
  `application_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_type` enum('interior_designer','contractor','architect','decorator','retailer','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_in_business` int DEFAULT NULL,
  `annual_volume_estimate` decimal(12,2) DEFAULT NULL,
  `business_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `business_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_references` json DEFAULT NULL,
  `portfolio_links` json DEFAULT NULL,
  `application_status` enum('pending','under_review','approved','denied','additional_info_needed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trade_discount_percentage` decimal(5,2) DEFAULT '15.00',
  `net_payment_terms` int DEFAULT '30',
  `credit_limit` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`application_id`),
  KEY `user_id` (`user_id`),
  KEY `application_status` (`application_status`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `trade_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `trade_applications_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trade_applications`
--

LOCK TABLES `trade_applications` WRITE;
/*!40000 ALTER TABLE `trade_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `trade_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trade_projects`
--

DROP TABLE IF EXISTS `trade_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trade_projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `client_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_type` enum('residential','commercial','hospitality','healthcare','education','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estimated_budget` decimal(12,2) DEFAULT NULL,
  `project_timeline` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `status` enum('planning','quoted','approved','in_progress','completed','cancelled','on_hold') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'planning',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `room_count` int DEFAULT NULL,
  `window_count` int DEFAULT NULL,
  `project_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `start_date` (`start_date`),
  CONSTRAINT `trade_projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trade_projects`
--

LOCK TABLES `trade_projects` WRITE;
/*!40000 ALTER TABLE `trade_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `trade_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upload_security_config`
--

DROP TABLE IF EXISTS `upload_security_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upload_security_config` (
  `config_id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_type` enum('string','integer','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `idx_config_key` (`config_key`),
  KEY `idx_active` (`is_active`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `upload_security_config_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=334 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upload_security_config`
--

LOCK TABLES `upload_security_config` WRITE;
/*!40000 ALTER TABLE `upload_security_config` DISABLE KEYS */;
INSERT INTO `upload_security_config` VALUES (1,'general_site_name','Smart Blinds Hub','string','Website name',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(2,'general_site_description','Premium window treatments and smart home solutions','string','Website description',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(3,'general_contact_email','sales@smartblindshub.com','string','Contact email',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(4,'general_phone','(316) 530-2635','string','Contact phone',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(5,'general_currency','USD','string','Default currency',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(6,'general_tax_rate','10.25','string','Default tax rate',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(7,'payments_stripe_enabled','true','boolean','Enable Stripe payments',1,1,'2025-06-10 22:44:48','2025-06-25 18:08:59'),(8,'payments_paypal_enabled','false','boolean','Enable PayPal payments',1,1,'2025-06-10 22:44:48','2025-06-25 18:08:59'),(9,'payments_klarna_enabled','false','boolean','Enable Klarna payments',1,1,'2025-06-10 22:44:48','2025-06-25 18:08:59'),(10,'payments_minimum_order_amount','25.00','string','Minimum order amount',1,1,'2025-06-10 22:44:48','2025-06-25 18:08:59'),(11,'security_session_timeout_minutes','30','string','Session timeout in minutes',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(12,'security_login_attempts_limit','5','string','Max login attempts',1,1,'2025-06-10 22:44:48','2025-06-25 05:24:50'),(17,'general_address','15326 Old Redmond Road','string','General setting: address',1,1,'2025-06-10 22:45:34','2025-06-25 05:24:50'),(18,'general_timezone','America/Los_Angeles','string','General setting: timezone',1,1,'2025-06-10 22:45:34','2025-06-25 05:24:50'),(21,'general_maintenance_mode','false','boolean','General setting: maintenance mode',1,1,'2025-06-10 22:45:34','2025-06-25 05:24:50'),(30,'integrations_google_analytics_id','','string','Integrations setting: google analytics id',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(31,'integrations_facebook_pixel_id','','string','Integrations setting: facebook pixel id',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(32,'integrations_mailchimp_api_key','','string','Integrations setting: mailchimp api key',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(33,'integrations_twilio_account_sid','','string','Integrations setting: twilio account sid',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(34,'integrations_aws_s3_bucket','','string','Integrations setting: aws s3 bucket',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(35,'integrations_smtp_server','smtp.spacemail.com','string','Integrations setting: smtp server',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(36,'integrations_smtp_port','587','string','Integrations setting: smtp port',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(37,'integrations_smtp_username','sales@smartblindshub.com','string','Integrations setting: smtp username',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(38,'integrations_taxjar_api_key','7EdhjI6dKJhFM8BiULkK3Iyw0zEfsdq+eRR+OoJ/c9xjc9p9vCnjb5yHKhEeEgag9yfvyKvLtBfwHYsonEgFaQ==','string','Integrations setting: taxjar api key',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(39,'integrations_taxjar_environment','production','string','Integrations setting: taxjar environment',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(40,'integrations_use_taxjar_api','true','boolean','Integrations setting: use taxjar api',1,1,'2025-06-21 06:12:57','2025-06-25 05:24:50'),(44,'payments_afterpay_enabled','false','boolean','Payments setting: afterpay enabled',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(45,'payments_affirm_enabled','false','boolean','Payments setting: affirm enabled',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(46,'payments_braintree_enabled','false','boolean','Payments setting: braintree enabled',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(47,'payments_payment_processing_fee','2.9','string','Payments setting: payment processing fee',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(49,'payments_free_shipping_threshold','100.00','string','Payments setting: free shipping threshold',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(50,'payments_vendor_commission_rate','15.0','string','Payments setting: vendor commission rate',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(51,'payments_stripe_secret_key','HvAALLxBQG8mUaFiBsJIt2GYMnsRmVWWi6sgyxSidVBY47x8D29XHtHIzhkgyhCVv8JolnPjyAs0b2qb08maqbU1I8aDWXYi+XUFHTek0b2BciWQUOGlaqsSiNqLp46NovO0X+spKdDMtIdEFHkR0z2UpQbqgKSk4XITl/RKygKb/mZ/sldTslNJ6Q==','string','Payments setting: stripe secret key',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(52,'payments_stripe_publishable_key','','string','Payments setting: stripe publishable key',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(53,'payments_stripe_webhook_secret','','string','Payments setting: stripe webhook secret',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(54,'payments_paypal_client_id','','string','Payments setting: paypal client id',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(55,'payments_paypal_client_secret','','string','Payments setting: paypal client secret',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(56,'payments_braintree_merchant_id','','string','Payments setting: braintree merchant id',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(57,'payments_braintree_public_key','','string','Payments setting: braintree public key',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(58,'payments_braintree_private_key','','string','Payments setting: braintree private key',1,1,'2025-06-23 00:49:46','2025-06-25 18:08:59'),(68,'notifications_email_notifications','true','boolean','Notifications setting: email notifications',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(69,'notifications_sms_notifications','false','boolean','Notifications setting: sms notifications',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(70,'notifications_push_notifications','false','boolean','Notifications setting: push notifications',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(71,'notifications_order_notifications','false','boolean','Notifications setting: order notifications',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(72,'notifications_inventory_alerts','false','boolean','Notifications setting: inventory alerts',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(73,'notifications_vendor_notifications','true','boolean','Notifications setting: vendor notifications',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(74,'notifications_customer_service_alerts','true','boolean','Notifications setting: customer service alerts',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(75,'notifications_system_alerts','true','boolean','Notifications setting: system alerts',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(94,'security_two_factor_required','false','boolean','Security setting: two factor required',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(95,'security_password_expiry_days','90','string','Security setting: password expiry days',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(98,'security_ip_whitelist_enabled','false','boolean','Security setting: ip whitelist enabled',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(99,'security_audit_logs_retention_days','365','string','Security setting: audit logs retention days',1,1,'2025-06-23 00:53:12','2025-06-25 05:24:50'),(179,'payments_klarna_api_key','8GHCIpdXW5Rxboo2EIaZ+qKBPUSZ7x65pdBNOOgpK0xZXbdSoXfjHvzFnY+2vnqHELmTrqw=','string','Klarna API Key',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(180,'payments_klarna_username','gopal.panda@gmail.com','string','Klarna Username',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(181,'payments_klarna_password','XxEQPW0r3O5SqhBZ','string','Klarna Password',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(182,'payments_afterpay_merchant_id','','string','Afterpay Merchant ID',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(183,'payments_afterpay_secret_key','','string','Afterpay Secret Key',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(184,'payments_affirm_public_api_key','','string','Affirm Public API Key',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59'),(185,'payments_affirm_private_api_key','','string','Affirm Private API Key',1,1,'2025-06-23 06:01:07','2025-06-25 18:08:59');
/*!40000 ALTER TABLE `upload_security_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_loyalty_accounts`
--

DROP TABLE IF EXISTS `user_loyalty_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_loyalty_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `current_tier_id` int NOT NULL,
  `total_points_earned` int DEFAULT '0',
  `available_points` int DEFAULT '0',
  `points_redeemed` int DEFAULT '0',
  `points_expired` int DEFAULT '0',
  `lifetime_spending` decimal(10,2) DEFAULT '0.00',
  `current_year_spending` decimal(10,2) DEFAULT '0.00',
  `last_purchase_date` timestamp NULL DEFAULT NULL,
  `tier_anniversary_date` date DEFAULT NULL,
  `next_tier_progress` decimal(5,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tier_id` (`current_tier_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_anniversary` (`tier_anniversary_date`),
  CONSTRAINT `user_loyalty_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_loyalty_accounts_ibfk_2` FOREIGN KEY (`current_tier_id`) REFERENCES `loyalty_tiers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_loyalty_accounts`
--

LOCK TABLES `user_loyalty_accounts` WRITE;
/*!40000 ALTER TABLE `user_loyalty_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_loyalty_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notifications`
--

DROP TABLE IF EXISTS `user_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('order','promotion','system','reminder') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `action_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `is_read` (`is_read`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notifications`
--

LOCK TABLES `user_notifications` WRITE;
/*!40000 ALTER TABLE `user_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `preference_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `preference_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preference_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`preference_id`),
  UNIQUE KEY `user_preference` (`user_id`,`preference_key`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_shipping_addresses`
--

DROP TABLE IF EXISTS `user_shipping_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_shipping_addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User-friendly name like "Home", "Office", "Mom''s House"',
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional company name',
  `address_line_1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line_2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Apartment, suite, etc.',
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'United States',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional different email for this address',
  `is_default` tinyint(1) DEFAULT '0' COMMENT 'Default shipping address for this user',
  `is_billing_address` tinyint(1) DEFAULT '0' COMMENT 'Can this address be used for billing',
  `delivery_instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Special delivery notes for this address',
  `delivery_preference` enum('standard','signature_required','leave_at_door','front_desk') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `access_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Building access code',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT 'Has this address been validated by shipping service',
  `verification_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'UPS, FedEx, USPS address validation',
  `last_verified_at` timestamp NULL DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT 'When this address was last used for an order',
  `usage_count` int DEFAULT '0' COMMENT 'How many times this address has been used',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_user_addresses` (`user_id`),
  KEY `idx_default_address` (`user_id`,`is_default`),
  KEY `idx_active_addresses` (`user_id`,`is_active`),
  KEY `idx_address_name` (`user_id`,`address_name`),
  KEY `idx_last_used` (`last_used_at`),
  KEY `idx_verification` (`is_verified`,`verification_source`),
  CONSTRAINT `fk_shipping_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_shipping_addresses`
--

LOCK TABLES `user_shipping_addresses` WRITE;
/*!40000 ALTER TABLE `user_shipping_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_shipping_addresses` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_ensure_single_default_address` BEFORE INSERT ON `user_shipping_addresses` FOR EACH ROW BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE user_shipping_addresses 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND is_default = TRUE;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_update_default_address` BEFORE UPDATE ON `user_shipping_addresses` FOR EACH ROW BEGIN
    IF NEW.is_default = TRUE AND OLD.is_default = FALSE THEN
        UPDATE user_shipping_addresses 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND address_id != NEW.address_id AND is_default = TRUE;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('customer','admin','vendor','installer','sales','super_admin','trade_professional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'customer',
  `is_admin` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_verified` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_listing_active` tinyint(1) DEFAULT '1',
  `social_provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Social login provider (google, facebook, apple, twitter)',
  `social_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique ID from social provider',
  `profile_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Profile image URL from social provider',
  `email_verified` tinyint(1) DEFAULT '0' COMMENT 'Email verification status',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uk_users_social_provider_id` (`social_provider`,`social_id`),
  KEY `idx_users_social_provider` (`social_provider`),
  KEY `idx_users_social_id` (`social_id`),
  KEY `idx_users_email_verified` (`email_verified`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Admin User','555-000-0001','admin',1,1,1,'2025-07-02 19:39:23','2025-06-08 21:13:09','2025-07-02 19:39:23',1,NULL,NULL,NULL,0),(2,'vendor@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Vendor User','555-000-0002','vendor',0,1,1,'2025-07-02 19:46:22','2025-06-08 21:13:09','2025-07-02 19:46:22',1,NULL,NULL,NULL,0),(3,'customer@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Customer User','555-000-0003','customer',0,1,1,'2025-07-02 19:56:16','2025-06-08 21:13:09','2025-07-02 19:56:16',1,NULL,NULL,NULL,0),(4,'sales@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Sales Representative','555-000-0004','sales',0,1,1,'2025-06-14 20:23:01','2025-06-08 21:13:09','2025-06-16 21:38:05',1,NULL,NULL,NULL,0),(5,'installer@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Installer User','555-000-0005','installer',0,1,1,'2025-06-14 20:22:46','2025-06-08 21:13:09','2025-06-16 21:38:05',1,NULL,NULL,NULL,0),(6,'superadmin@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Super','Admin',NULL,'super_admin',0,1,1,'2025-06-20 21:47:38','2025-06-16 17:50:05','2025-06-20 21:47:38',1,NULL,NULL,NULL,0),(12,'vendor2@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Second','Test Vendor','555-000-0006','vendor',0,1,0,NULL,'2025-06-16 21:38:05','2025-06-16 21:38:05',1,NULL,NULL,NULL,0),(13,'vendor3@smartblindshub.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Third','Vendor',NULL,'vendor',0,1,0,NULL,'2025-06-23 06:45:27','2025-07-01 04:31:30',1,NULL,NULL,NULL,0),(14,'testcustomer1750695386@example.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Customer','1234567890','customer',0,1,0,'2025-06-23 16:16:37','2025-06-23 16:16:26','2025-07-01 04:31:30',1,NULL,NULL,NULL,0),(15,'testvendor@bulktest.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Test','Vendor','555-0123','customer',0,1,0,NULL,'2025-06-23 16:36:51','2025-07-01 04:31:30',1,NULL,NULL,NULL,0),(16,'bulktest@vendor.com','$2b$10$/XmWXnvEefUgkFzJwrhLMeFF8f7EEadQPvn0FWnZMPiP315TYtXDm','Bulk','Test Vendor','555-0001','vendor',0,1,0,'2025-06-23 16:44:07','2025-06-23 16:37:43','2025-07-01 04:31:30',1,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_approval_log`
--

DROP TABLE IF EXISTS `vendor_approval_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_approval_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `action` enum('approved','rejected','suspended','reactivated') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `admin_user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_action` (`action`),
  KEY `admin_user_id` (`admin_user_id`),
  CONSTRAINT `vendor_approval_log_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_approval_log_ibfk_2` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_approval_log`
--

LOCK TABLES `vendor_approval_log` WRITE;
/*!40000 ALTER TABLE `vendor_approval_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_approval_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_catalog_products`
--

DROP TABLE IF EXISTS `vendor_catalog_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_catalog_products` (
  `catalog_product_id` int NOT NULL AUTO_INCREMENT,
  `catalog_id` int NOT NULL,
  `product_id` int NOT NULL,
  `display_order` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`catalog_product_id`),
  UNIQUE KEY `catalog_product` (`catalog_id`,`product_id`),
  KEY `catalog_id` (`catalog_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `vendor_catalog_products_ibfk_1` FOREIGN KEY (`catalog_id`) REFERENCES `vendor_catalogs` (`catalog_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_catalog_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_catalog_products`
--

LOCK TABLES `vendor_catalog_products` WRITE;
/*!40000 ALTER TABLE `vendor_catalog_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_catalog_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_catalogs`
--

DROP TABLE IF EXISTS `vendor_catalogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_catalogs` (
  `catalog_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `catalog_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catalog_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `is_public` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`catalog_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `is_active` (`is_active`),
  KEY `is_public` (`is_public`),
  CONSTRAINT `vendor_catalogs_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_catalogs`
--

LOCK TABLES `vendor_catalogs` WRITE;
/*!40000 ALTER TABLE `vendor_catalogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_catalogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_commissions`
--

DROP TABLE IF EXISTS `vendor_commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_commissions` (
  `commission_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `order_id` int NOT NULL,
  `order_item_id` int DEFAULT NULL,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `commission_status` enum('pending','approved','paid','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`commission_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `order_id` (`order_id`),
  KEY `order_item_id` (`order_item_id`),
  KEY `commission_status` (`commission_status`),
  CONSTRAINT `vendor_commissions_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_commissions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_commissions_ibfk_3` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`order_item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_commissions`
--

LOCK TABLES `vendor_commissions` WRITE;
/*!40000 ALTER TABLE `vendor_commissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_coupons`
--

DROP TABLE IF EXISTS `vendor_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_coupons` (
  `coupon_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `coupon_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coupon_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('percentage','fixed_amount','free_shipping','upgrade') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(8,2) NOT NULL,
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL,
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `minimum_quantity` int DEFAULT '1',
  `applies_to` enum('all_vendor_products','specific_products','specific_categories') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_vendor_products',
  `target_ids` json DEFAULT NULL COMMENT 'Array of product/category IDs',
  `excluded_ids` json DEFAULT NULL COMMENT 'Array of excluded product/category IDs',
  `customer_types` json DEFAULT NULL COMMENT 'Array: retail, trade, commercial',
  `customer_groups` json DEFAULT NULL COMMENT 'Array of customer group IDs',
  `first_time_customers_only` tinyint(1) DEFAULT '0',
  `existing_customers_only` tinyint(1) DEFAULT '0',
  `allowed_regions` json DEFAULT NULL COMMENT 'Array of state/region codes',
  `excluded_regions` json DEFAULT NULL COMMENT 'Array of excluded regions',
  `usage_limit_total` int DEFAULT NULL,
  `usage_limit_per_customer` int DEFAULT '1',
  `usage_count` int DEFAULT '0',
  `valid_from` datetime NOT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `auto_activate` tinyint(1) DEFAULT '0',
  `auto_deactivate` tinyint(1) DEFAULT '0',
  `stackable_with_discounts` tinyint(1) DEFAULT '1',
  `stackable_with_other_coupons` tinyint(1) DEFAULT '0',
  `priority` int DEFAULT '0' COMMENT 'Higher number = higher priority',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int NOT NULL COMMENT 'Vendor user who created',
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `unique_vendor_coupon_code` (`vendor_id`,`coupon_code`),
  KEY `idx_vendor_coupon_active` (`vendor_id`,`is_active`,`valid_from`,`valid_until`),
  KEY `idx_coupon_code_lookup` (`coupon_code`),
  KEY `fk_vendor_coupon_vendor` (`vendor_id`),
  KEY `fk_vendor_coupon_creator` (`created_by`),
  CONSTRAINT `fk_vendor_coupon_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vendor_coupon_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_coupons`
--

LOCK TABLES `vendor_coupons` WRITE;
/*!40000 ALTER TABLE `vendor_coupons` DISABLE KEYS */;
INSERT INTO `vendor_coupons` VALUES (13,5,'SAVE10','Save 10 Percent','Save 10% on your order','Use code SAVE10 for 10% off',NULL,'percentage',10.00,NULL,0.00,1,'all_vendor_products',NULL,NULL,NULL,NULL,0,0,NULL,NULL,100,1,0,'2025-06-27 19:10:11','2025-07-27 19:10:11',1,0,0,1,0,0,'2025-06-28 02:10:11','2025-06-28 02:10:11',2);
/*!40000 ALTER TABLE `vendor_coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_discount_usage`
--

DROP TABLE IF EXISTS `vendor_discount_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_discount_usage` (
  `usage_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `discount_id` int DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `cart_id` int DEFAULT NULL,
  `usage_type` enum('discount','coupon') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `quantity` int DEFAULT '1',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `order_completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`usage_id`),
  KEY `idx_vendor_usage` (`vendor_id`,`usage_type`,`applied_at`),
  KEY `idx_discount_usage` (`discount_id`),
  KEY `idx_coupon_usage` (`coupon_id`),
  KEY `idx_user_usage` (`user_id`),
  KEY `idx_order_usage` (`order_id`),
  CONSTRAINT `fk_vendor_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `vendor_coupons` (`coupon_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_discount` FOREIGN KEY (`discount_id`) REFERENCES `vendor_discounts` (`discount_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vendor_usage_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_discount_usage`
--

LOCK TABLES `vendor_discount_usage` WRITE;
/*!40000 ALTER TABLE `vendor_discount_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_discount_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_discounts`
--

DROP TABLE IF EXISTS `vendor_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_discounts` (
  `discount_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `discount_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `discount_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type of discount: percentage, fixed_amount, tiered, bulk_pricing, seasonal, etc.',
  `is_automatic` tinyint(1) DEFAULT '1',
  `stackable_with_coupons` tinyint(1) DEFAULT '1',
  `priority` int DEFAULT '0' COMMENT 'Higher number = higher priority',
  `discount_value` decimal(8,2) NOT NULL,
  `volume_tiers` json DEFAULT NULL COMMENT 'Array of {min_qty, max_qty, discount_percent, discount_amount}',
  `minimum_order_value` decimal(10,2) DEFAULT '0.00',
  `maximum_discount_amount` decimal(10,2) DEFAULT NULL,
  `minimum_quantity` int DEFAULT '1',
  `applies_to` enum('all_vendor_products','specific_products','specific_categories') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_vendor_products',
  `target_ids` json DEFAULT NULL COMMENT 'Array of product/category IDs',
  `customer_types` json DEFAULT NULL COMMENT 'Array of customer types: retail, trade, commercial',
  `customer_groups` json DEFAULT NULL COMMENT 'Array of specific customer group IDs',
  `allowed_regions` json DEFAULT NULL COMMENT 'Array of state/region codes where discount applies',
  `excluded_regions` json DEFAULT NULL COMMENT 'Array of excluded regions',
  `valid_from` datetime NOT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `usage_count` int DEFAULT '0',
  `usage_limit_total` int DEFAULT NULL,
  `usage_limit_per_customer` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`discount_id`),
  UNIQUE KEY `unique_vendor_discount_code` (`vendor_id`,`discount_code`),
  KEY `idx_vendor_discounts` (`vendor_id`,`is_active`),
  KEY `idx_validity_dates` (`valid_from`,`valid_until`),
  KEY `idx_vendor_discount_active` (`vendor_id`,`is_active`,`valid_from`,`valid_until`),
  KEY `idx_discount_code` (`discount_code`),
  CONSTRAINT `fk_vendor_discount_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_discounts`
--

LOCK TABLES `vendor_discounts` WRITE;
/*!40000 ALTER TABLE `vendor_discounts` DISABLE KEYS */;
INSERT INTO `vendor_discounts` VALUES (21,5,'Summer Sale','Summer Sale - 20% Off','Get 20% off on all products',NULL,NULL,'percentage',1,1,0,20.00,NULL,0.00,NULL,1,'all_vendor_products',NULL,NULL,NULL,NULL,NULL,'2025-06-27 19:09:03','2025-07-27 19:09:03',1,0,NULL,NULL,'2025-06-28 02:09:03','2025-06-28 02:09:03');
/*!40000 ALTER TABLE `vendor_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_files`
--

DROP TABLE IF EXISTS `vendor_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_files` (
  `file_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor_id` int NOT NULL COMMENT 'References vendor_info.vendor_info_id',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_type` enum('productImages','productVideos','csvFiles','documents') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `file_format` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `scan_result` enum('clean','suspicious','malicious') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'clean',
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  PRIMARY KEY (`file_id`),
  KEY `idx_vendor_files` (`vendor_id`,`category`),
  KEY `idx_file_hash` (`file_hash`),
  KEY `idx_upload_type` (`upload_type`),
  KEY `idx_scan_result` (`scan_result`),
  KEY `idx_approval_status` (`approval_status`),
  CONSTRAINT `fk_vendor_files_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_files`
--

LOCK TABLES `vendor_files` WRITE;
/*!40000 ALTER TABLE `vendor_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_info`
--

DROP TABLE IF EXISTS `vendor_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_info` (
  `vendor_info_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_established` int DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_date` timestamp NULL DEFAULT NULL,
  `approval_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `is_approved` tinyint(1) DEFAULT '0',
  `tax_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_address_line1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_address_line2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'United States',
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `rating` decimal(3,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commission_rate` decimal(5,2) DEFAULT '15.00' COMMENT 'Commission percentage for this vendor',
  `payment_terms` enum('weekly','bi_weekly','monthly','quarterly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'monthly' COMMENT 'How often vendor gets paid',
  `minimum_payout` decimal(8,2) DEFAULT '50.00' COMMENT 'Minimum amount before payout',
  `payment_method` enum('bank_transfer','paypal','check','stripe') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'bank_transfer',
  `bank_account_info` json DEFAULT NULL COMMENT 'Encrypted bank account details',
  `paypal_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_form_submitted` tinyint(1) DEFAULT '0',
  `auto_payout_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`vendor_info_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `vendor_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_info`
--

LOCK TABLES `vendor_info` WRITE;
/*!40000 ALTER TABLE `vendor_info` DISABLE KEYS */;
INSERT INTO `vendor_info` VALUES (5,2,'Vendor Business 2','Levolor','vendor@smartblindshub.com',NULL,NULL,NULL,NULL,NULL,1,NULL,'approved',0,NULL,NULL,NULL,NULL,NULL,NULL,'United States',0.00,0.00,1,'2025-06-16 21:38:05','2025-07-01 04:38:06',15.00,'monthly',50.00,'bank_transfer',NULL,NULL,0,0),(6,12,'Vendor Business 12',NULL,'vendor12@smartblindshub.com',NULL,NULL,NULL,NULL,NULL,0,NULL,'pending',0,NULL,NULL,NULL,NULL,NULL,NULL,'United States',0.00,0.00,1,'2025-06-16 21:38:05','2025-06-16 21:38:05',15.00,'monthly',50.00,'bank_transfer',NULL,NULL,0,0),(9,16,'Bulk Test Vendor',NULL,'bulktest@vendor.com','555-0001','Test vendor for bulk upload testing',NULL,NULL,NULL,0,NULL,'pending',0,NULL,NULL,NULL,NULL,NULL,NULL,'United States',0.00,0.00,1,'2025-06-23 16:38:14','2025-06-23 16:38:14',15.00,'monthly',50.00,'bank_transfer',NULL,NULL,0,0);
/*!40000 ALTER TABLE `vendor_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_inventory`
--

DROP TABLE IF EXISTS `vendor_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity_on_hand` int DEFAULT '0',
  `quantity_committed` int DEFAULT '0',
  `quantity_available` int GENERATED ALWAYS AS ((`quantity_on_hand` - `quantity_committed`)) STORED,
  `reorder_point` int DEFAULT '0',
  `reorder_quantity` int DEFAULT '0',
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `last_restocked_date` timestamp NULL DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `vendor_product_inventory` (`vendor_id`,`product_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `product_id` (`product_id`),
  KEY `quantity_available` (`quantity_available`),
  CONSTRAINT `vendor_inventory_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_inventory`
--

LOCK TABLES `vendor_inventory` WRITE;
/*!40000 ALTER TABLE `vendor_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_payments`
--

DROP TABLE IF EXISTS `vendor_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `payment_type` enum('commission','bonus','refund','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `payment_method` enum('bank_transfer','paypal','stripe','check') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','processing','completed','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reference_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `commission_ids` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `payment_status` (`payment_status`),
  KEY `payment_date` (`payment_date`),
  KEY `idx_payment_processing` (`vendor_id`,`payment_status`),
  CONSTRAINT `vendor_payments_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_payments`
--

LOCK TABLES `vendor_payments` WRITE;
/*!40000 ALTER TABLE `vendor_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_payouts`
--

DROP TABLE IF EXISTS `vendor_payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_payouts` (
  `payout_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `payout_amount` decimal(10,2) NOT NULL,
  `commission_period_start` date NOT NULL,
  `commission_period_end` date NOT NULL,
  `payout_status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payout_method` enum('bank_transfer','paypal','check','stripe') COLLATE utf8mb4_unicode_ci DEFAULT 'bank_transfer',
  `payout_date` timestamp NULL DEFAULT NULL,
  `transaction_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payout_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_status` (`payout_status`),
  KEY `idx_payout_date` (`payout_date`),
  CONSTRAINT `vendor_payouts_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_payouts`
--

LOCK TABLES `vendor_payouts` WRITE;
/*!40000 ALTER TABLE `vendor_payouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_performance`
--

DROP TABLE IF EXISTS `vendor_performance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_performance` (
  `performance_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_orders` int DEFAULT '0',
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `total_commission` decimal(12,2) DEFAULT '0.00',
  `avg_order_value` decimal(10,2) DEFAULT '0.00',
  `customer_satisfaction_score` decimal(3,2) DEFAULT NULL,
  `on_time_delivery_rate` decimal(5,2) DEFAULT NULL,
  `return_rate` decimal(5,2) DEFAULT NULL,
  `response_time_hours` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`performance_id`),
  UNIQUE KEY `vendor_period` (`vendor_id`,`period_start`,`period_end`),
  KEY `vendor_id` (`vendor_id`),
  KEY `period_start` (`period_start`),
  CONSTRAINT `vendor_performance_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_performance`
--

LOCK TABLES `vendor_performance` WRITE;
/*!40000 ALTER TABLE `vendor_performance` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_performance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_products`
--

DROP TABLE IF EXISTS `vendor_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_products` (
  `vendor_product_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `product_id` int NOT NULL,
  `vendor_sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_price` decimal(10,2) DEFAULT NULL,
  `quantity_available` int DEFAULT '0',
  `minimum_order_qty` int DEFAULT '1',
  `lead_time_days` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_primary` tinyint(1) DEFAULT '0',
  `vendor_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `vendor_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_product_id`),
  UNIQUE KEY `vendor_product` (`vendor_id`,`product_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `product_id` (`product_id`),
  KEY `vendor_sku` (`vendor_sku`),
  KEY `is_active` (`is_active`),
  KEY `idx_vendor_pricing` (`product_id`,`vendor_id`,`vendor_price`),
  CONSTRAINT `vendor_products_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_products`
--

LOCK TABLES `vendor_products` WRITE;
/*!40000 ALTER TABLE `vendor_products` DISABLE KEYS */;
INSERT INTO `vendor_products` VALUES (134,5,242,'MSB-001',399.99,0,1,0,1,0,0,NULL,NULL,'2025-06-16 21:38:05','2025-06-28 02:07:21'),(136,5,244,'VBS-001',229.99,0,1,0,1,0,0,NULL,NULL,'2025-06-16 21:38:05','2025-06-28 02:07:21'),(140,5,1,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(141,5,3,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(142,5,4,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(143,5,5,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(144,5,6,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(145,5,7,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(146,5,8,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(147,5,9,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(148,5,10,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(149,5,11,NULL,100.00,100,1,0,1,0,0,NULL,NULL,'2025-06-28 02:04:59','2025-06-28 02:04:59'),(150,5,227,'V5-P227',125.00,100,1,7,1,0,0,'Auto-synced: Classic Roman Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(151,5,229,'V5-P229',125.00,100,1,7,1,0,0,'Auto-synced: Solar Roller Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(152,5,232,'V5-P232',125.00,100,1,7,1,0,0,'Auto-synced: Classic Light Filtering Sheer Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(153,5,234,'V5-P234',125.00,100,1,7,1,0,0,'Auto-synced: Casual Classics Roman Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(154,5,236,'V5-P236',125.00,100,1,7,1,0,0,'Auto-synced: 1 Inch Pleated Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(155,5,238,'V5-P238',125.00,100,1,7,1,0,0,'Auto-synced: Basic Cordless 2 Inch Faux Wood Blinds',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(156,5,239,'RB-COLLECTION-001',79.99,100,1,7,1,0,0,'Auto-synced: Roller Blinds Collection',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(157,5,240,'PRS-001',199.99,100,1,7,1,0,0,'Auto-synced: Premium Roller Shade',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(158,5,241,'CSD-001',249.99,100,1,7,1,0,0,'Auto-synced: Cellular Shade Deluxe',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(159,5,243,'VAS-001',29.99,100,1,7,1,0,0,'Auto-synced: Vendor A Roller Shade',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(160,9,12,'V9-P12',125.00,100,1,7,1,0,0,'Auto-synced: Motorized Zebra Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(161,9,13,'V9-P13',125.00,100,1,7,1,0,0,'Auto-synced: Perceptions Sheer Vertical Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(162,9,14,'V9-P14',125.00,100,1,7,1,0,0,'Auto-synced: Roman Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(163,9,15,'V9-P15',125.00,100,1,7,1,0,0,'Auto-synced: Light Filtering Sheer Shades',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(164,9,16,'V9-P16',125.00,100,1,7,1,0,0,'Auto-synced: Light Filtering Cellular Arch',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(165,9,17,'V9-P17',125.00,100,1,7,1,0,0,'Auto-synced: Vertical Blind Headrail Only',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(166,9,18,'V9-P18',125.00,100,1,7,1,0,0,'Auto-synced: 2 Inch Faux Wood Blinds',NULL,'2025-07-01 18:10:12','2025-07-01 18:10:12'),(181,6,1,'V6-P1',125.00,100,1,7,1,0,0,'Auto-synced: Premium Blackout Solid Fabric Roller Shades',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(182,6,3,'V6-P3',125.00,100,1,7,1,0,0,'Auto-synced: Natural Woven Shades',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(183,6,4,'V6-P4',125.00,100,1,7,1,0,0,'Auto-synced: Premium Light Filtering Vertical Cell Shades',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(184,6,5,'V6-P5',125.00,100,1,7,1,0,0,'Auto-synced: Vertical Vanes',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(185,6,6,'V6-P6',125.00,100,1,7,1,0,0,'Auto-synced: Designer Blackout Vertical Cellular Shades',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(186,6,7,'V6-P7',125.00,100,1,7,1,0,0,'Auto-synced: Flat Sheer Shades',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(187,6,8,'V6-P8',125.00,100,1,7,1,0,0,'Auto-synced: Wrought Iron C-Rings with Eyelets',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(188,6,9,'V6-P9',125.00,100,1,7,1,0,0,'Auto-synced: 2 Inch Wood Blinds',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13'),(189,6,10,'',125.00,100,1,7,1,0,0,'Auto-synced: Premium Light Filtering Cellular Arch',NULL,'2025-07-01 18:35:13','2025-07-01 18:35:13');
/*!40000 ALTER TABLE `vendor_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_ratings`
--

DROP TABLE IF EXISTS `vendor_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_ratings` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `rating` tinyint NOT NULL,
  `review_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `service_quality_rating` tinyint DEFAULT NULL,
  `communication_rating` tinyint DEFAULT NULL,
  `delivery_rating` tinyint DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `vendor_user_order` (`vendor_id`,`user_id`,`order_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `rating` (`rating`),
  KEY `is_approved` (`is_approved`),
  KEY `idx_vendor_performance` (`vendor_id`,`rating`,`created_at`),
  CONSTRAINT `vendor_ratings_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_ratings_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_ratings_chk_1` CHECK ((`rating` between 1 and 5)),
  CONSTRAINT `vendor_ratings_chk_2` CHECK ((`service_quality_rating` between 1 and 5)),
  CONSTRAINT `vendor_ratings_chk_3` CHECK ((`communication_rating` between 1 and 5)),
  CONSTRAINT `vendor_ratings_chk_4` CHECK ((`delivery_rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_ratings`
--

LOCK TABLES `vendor_ratings` WRITE;
/*!40000 ALTER TABLE `vendor_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_reviews`
--

DROP TABLE IF EXISTS `vendor_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `idx_vendor_id` (`vendor_id`),
  KEY `idx_rating` (`rating`),
  KEY `customer_id` (`customer_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `vendor_reviews_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendor_info` (`vendor_info_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_reviews`
--

LOCK TABLES `vendor_reviews` WRITE;
/*!40000 ALTER TABLE `vendor_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification_tokens`
--

DROP TABLE IF EXISTS `verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_tokens` (
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires` timestamp NOT NULL,
  PRIMARY KEY (`token`),
  UNIQUE KEY `uk_verification_tokens_identifier_token` (`identifier`,`token`),
  KEY `idx_verification_tokens_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_tokens`
--

LOCK TABLES `verification_tokens` WRITE;
/*!40000 ALTER TABLE `verification_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `verification_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_chat_participants`
--

DROP TABLE IF EXISTS `video_chat_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_chat_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('host','participant','observer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'participant',
  `join_time` timestamp NULL DEFAULT NULL,
  `leave_time` timestamp NULL DEFAULT NULL,
  `device_info` json DEFAULT NULL,
  `connection_quality` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_session_user` (`session_id`,`user_id`),
  CONSTRAINT `video_chat_participants_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `video_chat_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `video_chat_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_chat_participants`
--

LOCK TABLES `video_chat_participants` WRITE;
/*!40000 ALTER TABLE `video_chat_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_chat_sessions`
--

DROP TABLE IF EXISTS `video_chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_chat_sessions` (
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consultation_id` bigint NOT NULL,
  `provider` enum('twilio','agora','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'twilio',
  `room_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_sid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','active','ended','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `recording_enabled` tinyint(1) DEFAULT '0',
  `recording_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ice_servers` json DEFAULT NULL,
  `signaling_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_participants` int DEFAULT '2',
  `video_enabled` tinyint(1) DEFAULT '1',
  `audio_enabled` tinyint(1) DEFAULT '1',
  `chat_enabled` tinyint(1) DEFAULT '1',
  `screen_share_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_consultation` (`consultation_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `video_chat_sessions_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`consultation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_chat_sessions`
--

LOCK TABLES `video_chat_sessions` WRITE;
/*!40000 ALTER TABLE `video_chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volume_discounts`
--

DROP TABLE IF EXISTS `volume_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `volume_discounts` (
  `discount_id` int NOT NULL AUTO_INCREMENT,
  `discount_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int DEFAULT NULL COMMENT 'Specific product (null = applies to multiple products)',
  `category_ids` json DEFAULT NULL COMMENT 'Array of category IDs',
  `brand_ids` json DEFAULT NULL COMMENT 'Array of brand IDs',
  `product_tags` json DEFAULT NULL COMMENT 'Array of product tags for flexible matching',
  `volume_tiers` json NOT NULL COMMENT 'Array of {min_qty, max_qty, discount_percent, discount_amount}',
  `customer_types` json DEFAULT NULL COMMENT 'Array of customer types: [retail, commercial, trade]',
  `customer_groups` json DEFAULT NULL COMMENT 'Array of specific customer group IDs',
  `allowed_regions` json DEFAULT NULL COMMENT 'Array of state/region codes',
  `excluded_regions` json DEFAULT NULL COMMENT 'Array of excluded state/region codes',
  `can_combine_with_promos` tinyint(1) DEFAULT '1',
  `can_combine_with_coupons` tinyint(1) DEFAULT '1',
  `max_total_discount_percent` decimal(5,2) DEFAULT '50.00',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `max_usage_total` int DEFAULT NULL,
  `max_usage_per_customer` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tier_breaks` json DEFAULT NULL COMMENT 'JSON array of quantity breaks and discount values',
  PRIMARY KEY (`discount_id`),
  UNIQUE KEY `discount_code` (`discount_code`),
  KEY `idx_discount_code` (`discount_code`),
  KEY `idx_product_discounts` (`product_id`),
  KEY `idx_active_volume_discounts` (`is_active`,`valid_from`,`valid_until`),
  CONSTRAINT `fk_volume_discount_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volume_discounts`
--

LOCK TABLES `volume_discounts` WRITE;
/*!40000 ALTER TABLE `volume_discounts` DISABLE KEYS */;
INSERT INTO `volume_discounts` VALUES (1,'Bulk Blinds Discount','BULK_BLINDS',NULL,NULL,NULL,NULL,'[{\"max_qty\": 9, \"min_qty\": 5, \"discount_percent\": 5.0}, {\"max_qty\": 19, \"min_qty\": 10, \"discount_percent\": 10.0}, {\"max_qty\": 49, \"min_qty\": 20, \"discount_percent\": 15.0}, {\"max_qty\": null, \"min_qty\": 50, \"discount_percent\": 20.0}]',NULL,NULL,NULL,NULL,1,1,50.00,1,NULL,NULL,0,NULL,NULL,'2025-06-10 22:06:39','2025-06-10 22:06:39',NULL),(2,'Window Treatment Volume','WINDOW_VOLUME',NULL,NULL,NULL,NULL,'[{\"max_qty\": 5, \"min_qty\": 3, \"discount_percent\": 3.0}, {\"max_qty\": 10, \"min_qty\": 6, \"discount_percent\": 7.0}, {\"max_qty\": null, \"min_qty\": 11, \"discount_percent\": 12.0}]',NULL,NULL,NULL,NULL,1,1,50.00,1,NULL,NULL,0,NULL,NULL,'2025-06-10 22:06:39','2025-06-10 22:06:39',NULL);
/*!40000 ALTER TABLE `volume_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warranty_claim_communications`
--

DROP TABLE IF EXISTS `warranty_claim_communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_claim_communications` (
  `communication_id` int NOT NULL AUTO_INCREMENT,
  `claim_id` int NOT NULL,
  `communication_type` enum('customer_message','staff_response','system_update','email','phone_call') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int DEFAULT NULL COMMENT 'User who sent the communication',
  `sender_type` enum('customer','staff','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_internal` tinyint(1) DEFAULT '0' COMMENT 'Internal staff notes vs customer-visible',
  `is_read` tinyint(1) DEFAULT '0',
  `requires_response` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`communication_id`),
  KEY `idx_claim_communications` (`claim_id`,`created_at` DESC),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_communication_type` (`communication_type`),
  KEY `idx_internal` (`is_internal`),
  KEY `idx_requires_response` (`requires_response`,`is_read`),
  CONSTRAINT `fk_claim_communications_claim` FOREIGN KEY (`claim_id`) REFERENCES `warranty_claims` (`claim_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_claim_communications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranty_claim_communications`
--

LOCK TABLES `warranty_claim_communications` WRITE;
/*!40000 ALTER TABLE `warranty_claim_communications` DISABLE KEYS */;
/*!40000 ALTER TABLE `warranty_claim_communications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warranty_claim_photos`
--

DROP TABLE IF EXISTS `warranty_claim_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_claim_photos` (
  `photo_id` int NOT NULL AUTO_INCREMENT,
  `claim_id` int NOT NULL,
  `photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_type` enum('issue_photo','receipt','installation','repair_progress','completion') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'issue_photo',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uploaded_by` int DEFAULT NULL COMMENT 'User who uploaded the photo',
  `file_size` bigint DEFAULT NULL COMMENT 'File size in bytes',
  `file_format` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'jpg, png, pdf, etc.',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photo_id`),
  KEY `idx_claim_photos` (`claim_id`),
  KEY `idx_photo_type` (`photo_type`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_claim_photos_claim` FOREIGN KEY (`claim_id`) REFERENCES `warranty_claims` (`claim_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_claim_photos_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranty_claim_photos`
--

LOCK TABLES `warranty_claim_photos` WRITE;
/*!40000 ALTER TABLE `warranty_claim_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `warranty_claim_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warranty_claims`
--

DROP TABLE IF EXISTS `warranty_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_claims` (
  `claim_id` int NOT NULL AUTO_INCREMENT,
  `registration_id` int NOT NULL,
  `user_id` int NOT NULL,
  `claim_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `issue_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_type` enum('defect','damage','malfunction','installation_issue') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('submitted','under_review','approved','denied','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `resolution_type` enum('repair','replacement','refund','no_action') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_date` timestamp NULL DEFAULT NULL,
  `resolution_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `claim_amount` decimal(10,2) DEFAULT NULL,
  `images` json DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  PRIMARY KEY (`claim_id`),
  UNIQUE KEY `claim_number` (`claim_number`),
  KEY `registration_id` (`registration_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `claim_date` (`claim_date`),
  KEY `warranty_claims_ibfk_3` (`assigned_to`),
  CONSTRAINT `warranty_claims_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `warranty_registrations` (`registration_id`) ON DELETE CASCADE,
  CONSTRAINT `warranty_claims_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `warranty_claims_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranty_claims`
--

LOCK TABLES `warranty_claims` WRITE;
/*!40000 ALTER TABLE `warranty_claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `warranty_claims` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `generate_claim_number` BEFORE INSERT ON `warranty_claims` FOR EACH ROW BEGIN
    IF NEW.claim_number IS NULL THEN
        SET NEW.claim_number = CONCAT('WC', DATE_FORMAT(NOW(), '%Y%m'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `warranty_registrations`
--

DROP TABLE IF EXISTS `warranty_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranty_registrations` (
  `registration_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `order_item_id` int DEFAULT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `warranty_start_date` date NOT NULL,
  `warranty_end_date` date NOT NULL,
  `warranty_type` enum('standard','extended','lifetime') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `serial_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_date` date NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `installer_id` int DEFAULT NULL,
  `status` enum('active','expired','voided','transferred') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`registration_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  KEY `order_id` (`order_id`),
  KEY `warranty_end_date` (`warranty_end_date`),
  KEY `status` (`status`),
  KEY `warranty_registrations_ibfk_4` (`installer_id`),
  CONSTRAINT `warranty_registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `warranty_registrations_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `warranty_registrations_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `warranty_registrations_ibfk_4` FOREIGN KEY (`installer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranty_registrations`
--

LOCK TABLES `warranty_registrations` WRITE;
/*!40000 ALTER TABLE `warranty_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `warranty_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `wishlist_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlist_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
INSERT INTO `wishlist` VALUES (1,14,'2025-06-23 16:16:26'),(2,15,'2025-06-23 16:36:51');
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_items` (
  `wishlist_item_id` int NOT NULL AUTO_INCREMENT,
  `wishlist_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlist_item_id`),
  KEY `wishlist_id` (`wishlist_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlist` (`wishlist_id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'blindscommerce_test'
--

--
-- Dumping routines for database 'blindscommerce_test'
--

--
-- Final view structure for view `available_samples`
--

/*!50001 DROP VIEW IF EXISTS `available_samples`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `available_samples` AS select `s`.`swatch_id` AS `swatch_id`,`s`.`name` AS `name`,`s`.`description` AS `description`,`s`.`color_code` AS `color_code`,`s`.`material_name` AS `material_name`,`s`.`material_type` AS `material_type`,`s`.`category_id` AS `category_id`,`c`.`name` AS `category_name`,`s`.`sample_fee` AS `sample_fee`,`s`.`is_premium` AS `is_premium`,`s`.`image_url` AS `image_url`,`s`.`opacity_level` AS `opacity_level`,`s`.`light_filtering_percentage` AS `light_filtering_percentage`,`s`.`care_instructions` AS `care_instructions`,coalesce(`si`.`available_stock`,0) AS `available_stock`,(case when (coalesce(`si`.`available_stock`,0) > 0) then true else false end) AS `is_in_stock`,avg(`sr`.`rating`) AS `average_rating`,count(`sr`.`review_id`) AS `review_count` from (((`material_swatches` `s` left join `categories` `c` on((`s`.`category_id` = `c`.`category_id`))) left join `sample_inventory` `si` on((`s`.`swatch_id` = `si`.`swatch_id`))) left join `sample_reviews` `sr` on(((`s`.`swatch_id` = `sr`.`swatch_id`) and (`sr`.`is_approved` = true)))) where (`s`.`is_active` = true) group by `s`.`swatch_id`,`s`.`name`,`s`.`description`,`s`.`color_code`,`s`.`material_name`,`s`.`material_type`,`s`.`category_id`,`c`.`name`,`s`.`sample_fee`,`s`.`is_premium`,`s`.`image_url`,`s`.`opacity_level`,`s`.`light_filtering_percentage`,`s`.`care_instructions`,`si`.`available_stock` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `sample_order_management`
--

/*!50001 DROP VIEW IF EXISTS `sample_order_management`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `sample_order_management` AS select `so`.`sample_order_id` AS `sample_order_id`,`so`.`order_id` AS `order_id`,`so`.`email` AS `email`,`so`.`shipping_name` AS `shipping_name`,`so`.`status` AS `status`,`so`.`priority` AS `priority`,`so`.`sample_count` AS `sample_count`,`so`.`total_amount` AS `total_amount`,`so`.`created_at` AS `created_at`,`so`.`estimated_delivery` AS `estimated_delivery`,`u`.`first_name` AS `first_name`,`u`.`last_name` AS `last_name`,count(`soi`.`sample_item_id`) AS `items_count`,sum((case when (`soi`.`fulfillment_status` = 'shipped') then 1 else 0 end)) AS `items_shipped`,(case when (count(`soi`.`sample_item_id`) = sum((case when (`soi`.`fulfillment_status` = 'shipped') then 1 else 0 end))) then true else false end) AS `fully_shipped` from ((`sample_orders` `so` left join `users` `u` on((`so`.`user_id` = `u`.`user_id`))) left join `sample_order_items` `soi` on((`so`.`sample_order_id` = `soi`.`sample_order_id`))) group by `so`.`sample_order_id`,`so`.`order_id`,`so`.`email`,`so`.`shipping_name`,`so`.`status`,`so`.`priority`,`so`.`sample_count`,`so`.`total_amount`,`so`.`created_at`,`so`.`estimated_delivery`,`u`.`first_name`,`u`.`last_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-02 13:12:29
