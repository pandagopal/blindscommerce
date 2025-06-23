/**
 * Comprehensive Test Suite for Expired Discounts and Coupons
 * Tests expiration validation logic across the pricing system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

describe('Expired Discounts and Coupons Validation', () => {
  let pool: any;
  let testVendorId: number;
  let testProductId: number;
  let testCustomerId: number;

  beforeEach(async () => {
    pool = await getPool();
    
    // Create test vendor
    const [vendorResult] = await pool.execute(
      'INSERT INTO vendor_info (user_id, business_name, commission_rate) VALUES (?, ?, ?)',
      [999, 'Test Vendor for Expiration', 15.00]
    );
    testVendorId = vendorResult.insertId;

    // Create test product
    const [productResult] = await pool.execute(
      'INSERT INTO products (name, sku, base_price, cost_price) VALUES (?, ?, ?, ?)',
      ['Test Product for Expiration', 'TEST-EXP-001', 100.00, 50.00]
    );
    testProductId = productResult.insertId;

    // Link product to vendor
    await pool.execute(
      'INSERT INTO vendor_products (vendor_id, product_id, vendor_price, quantity_available) VALUES (?, ?, ?, ?)',
      [testVendorId, testProductId, 100.00, 10]
    );

    // Create test customer
    const [customerResult] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['Test', 'Customer', 'test-expiration@example.com', 'hashedpassword', 'customer']
    );
    testCustomerId = customerResult.insertId;
  });

  afterEach(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM vendor_coupons WHERE vendor_id = ?', [testVendorId]);
    await pool.execute('DELETE FROM vendor_discounts WHERE vendor_id = ?', [testVendorId]);
    await pool.execute('DELETE FROM customer_specific_pricing WHERE customer_id = ?', [testCustomerId]);
    await pool.execute('DELETE FROM dynamic_pricing_rules WHERE product_id = ?', [testProductId]);
    await pool.execute('DELETE FROM vendor_products WHERE vendor_id = ?', [testVendorId]);
    await pool.execute('DELETE FROM products WHERE product_id = ?', [testProductId]);
    await pool.execute('DELETE FROM users WHERE user_id = ?', [testCustomerId]);
    await pool.execute('DELETE FROM vendor_info WHERE vendor_info_id = ?', [testVendorId]);
  });

  describe('Vendor Discount Expiration', () => {
    it('should not apply expired vendor discounts', async () => {
      // Create expired discount
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await pool.execute(`
        INSERT INTO vendor_discounts (
          vendor_id, discount_name, discount_type, discount_value, 
          minimum_order_value, is_active, is_automatic,
          valid_from, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'Expired 20% Off', 'percentage', 20, 0, true, true, 
          new Date('2025-01-01'), yesterday]);

      // Query for active discounts (simulating pricing API logic)
      const [activeDiscounts] = await pool.execute<RowDataPacket[]>(`
        SELECT discount_id, discount_name, discount_type, discount_value
        FROM vendor_discounts 
        WHERE vendor_id = ? AND is_active = TRUE AND is_automatic = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `, [testVendorId]);

      expect(activeDiscounts).toHaveLength(0);
    });

    it('should apply non-expired vendor discounts', async () => {
      // Create valid discount
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await pool.execute(`
        INSERT INTO vendor_discounts (
          vendor_id, discount_name, discount_type, discount_value, 
          minimum_order_value, is_active, is_automatic,
          valid_from, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'Valid 15% Off', 'percentage', 15, 0, true, true, 
          new Date('2025-01-01'), tomorrow]);

      // Query for active discounts
      const [activeDiscounts] = await pool.execute<RowDataPacket[]>(`
        SELECT discount_id, discount_name, discount_type, discount_value
        FROM vendor_discounts 
        WHERE vendor_id = ? AND is_active = TRUE AND is_automatic = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `, [testVendorId]);

      expect(activeDiscounts).toHaveLength(1);
      expect(activeDiscounts[0].discount_name).toBe('Valid 15% Off');
      expect(activeDiscounts[0].discount_value).toBe(15);
    });

    it('should not apply future-scheduled discounts', async () => {
      // Create future discount
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      await pool.execute(`
        INSERT INTO vendor_discounts (
          vendor_id, discount_name, discount_type, discount_value, 
          minimum_order_value, is_active, is_automatic,
          valid_from, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'Future 25% Off', 'percentage', 25, 0, true, true, 
          tomorrow, dayAfter]);

      // Query for active discounts
      const [activeDiscounts] = await pool.execute<RowDataPacket[]>(`
        SELECT discount_id, discount_name, discount_type, discount_value
        FROM vendor_discounts 
        WHERE vendor_id = ? AND is_active = TRUE AND is_automatic = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `, [testVendorId]);

      expect(activeDiscounts).toHaveLength(0);
    });
  });

  describe('Vendor Coupon Expiration', () => {
    it('should not validate expired coupon codes', async () => {
      // Create expired coupon
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'EXPIRED20', 'Expired 20% Coupon', 'percentage', 20, 0, 1, true,
          new Date('2025-01-01'), yesterday, testCustomerId]);

      // Query for valid coupon (simulating pricing API logic)
      const [validCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT vc.coupon_id, vc.coupon_code, vc.discount_type, vc.discount_value,
               vc.coupon_name, vi.business_name as vendor_name
        FROM vendor_coupons vc
        JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
        WHERE vc.coupon_code = ? 
        AND vc.is_active = TRUE
        AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
        AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())
      `, ['EXPIRED20']);

      expect(validCoupons).toHaveLength(0);
    });

    it('should validate non-expired coupon codes', async () => {
      // Create valid coupon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'VALID15', 'Valid 15% Coupon', 'percentage', 15, 0, 1, true,
          new Date('2025-01-01'), tomorrow, testCustomerId]);

      // Query for valid coupon
      const [validCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT vc.coupon_id, vc.coupon_code, vc.discount_type, vc.discount_value,
               vc.coupon_name, vi.business_name as vendor_name
        FROM vendor_coupons vc
        JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
        WHERE vc.coupon_code = ? 
        AND vc.is_active = TRUE
        AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
        AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())
      `, ['VALID15']);

      expect(validCoupons).toHaveLength(1);
      expect(validCoupons[0].coupon_code).toBe('VALID15');
      expect(validCoupons[0].discount_value).toBe(15);
    });

    it('should not validate future-scheduled coupons', async () => {
      // Create future coupon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'FUTURE30', 'Future 30% Coupon', 'percentage', 30, 0, 1, true,
          tomorrow, dayAfter, testCustomerId]);

      // Query for valid coupon
      const [validCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT vc.coupon_id, vc.coupon_code, vc.discount_type, vc.discount_value,
               vc.coupon_name, vi.business_name as vendor_name
        FROM vendor_coupons vc
        JOIN vendor_info vi ON vc.vendor_id = vi.vendor_info_id
        WHERE vc.coupon_code = ? 
        AND vc.is_active = TRUE
        AND (vc.valid_from IS NULL OR vc.valid_from <= NOW())
        AND (vc.valid_until IS NULL OR vc.valid_until >= NOW())
      `, ['FUTURE30']);

      expect(validCoupons).toHaveLength(0);
    });
  });

  describe('Customer-Specific Pricing Expiration', () => {
    it('should not apply expired customer-specific pricing', async () => {
      // Create expired customer pricing
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await pool.execute(`
        INSERT INTO customer_specific_pricing (
          customer_id, product_id, pricing_type, pricing_value,
          minimum_quantity, approval_status, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [testCustomerId, testProductId, 'discount_percent', 25, 1, 'approved', yesterday]);

      // Query for valid customer pricing
      const [validPricing] = await pool.execute<RowDataPacket[]>(`
        SELECT pricing_type, pricing_value, minimum_quantity
        FROM customer_specific_pricing 
        WHERE customer_id = ? 
        AND (product_id = ? OR (product_id IS NULL AND category_id = ?) OR (product_id IS NULL AND category_id IS NULL AND brand_id = ?))
        AND approval_status = 'approved'
        AND (valid_until IS NULL OR valid_until >= CURDATE())
        AND ? >= minimum_quantity
      `, [testCustomerId, testProductId, null, null, 1]);

      expect(validPricing).toHaveLength(0);
    });

    it('should apply non-expired customer-specific pricing', async () => {
      // Create valid customer pricing
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await pool.execute(`
        INSERT INTO customer_specific_pricing (
          customer_id, product_id, pricing_type, pricing_value,
          minimum_quantity, approval_status, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [testCustomerId, testProductId, 'discount_percent', 20, 1, 'approved', tomorrow]);

      // Query for valid customer pricing
      const [validPricing] = await pool.execute<RowDataPacket[]>(`
        SELECT pricing_type, pricing_value, minimum_quantity
        FROM customer_specific_pricing 
        WHERE customer_id = ? 
        AND (product_id = ? OR (product_id IS NULL AND category_id = ?) OR (product_id IS NULL AND category_id IS NULL AND brand_id = ?))
        AND approval_status = 'approved'
        AND (valid_until IS NULL OR valid_until >= CURDATE())
        AND ? >= minimum_quantity
      `, [testCustomerId, testProductId, null, null, 1]);

      expect(validPricing).toHaveLength(1);
      expect(validPricing[0].pricing_type).toBe('discount_percent');
      expect(validPricing[0].pricing_value).toBe(20);
    });
  });

  describe('Dynamic Pricing Rules Expiration', () => {
    it('should not apply expired dynamic pricing rules', async () => {
      // Create expired dynamic pricing rule
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await pool.execute(`
        INSERT INTO dynamic_pricing_rules (
          rule_type, adjustment_type, adjustment_value, product_id,
          is_active, valid_from, valid_until, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['inventory_based', 'percentage', -10, testProductId, true, 
          new Date('2025-01-01'), yesterday, 1]);

      // Query for active dynamic pricing rules
      const [activeRules] = await pool.execute<RowDataPacket[]>(`
        SELECT rule_id, rule_type, adjustment_type, adjustment_value, min_price, max_price, conditions
        FROM dynamic_pricing_rules 
        WHERE is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (product_id = ? OR product_id IS NULL)
        ORDER BY priority ASC
      `, [testProductId]);

      expect(activeRules).toHaveLength(0);
    });

    it('should apply non-expired dynamic pricing rules', async () => {
      // Create valid dynamic pricing rule
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await pool.execute(`
        INSERT INTO dynamic_pricing_rules (
          rule_type, adjustment_type, adjustment_value, product_id,
          is_active, valid_from, valid_until, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['time_based', 'percentage', -5, testProductId, true, 
          new Date('2025-01-01'), tomorrow, 1]);

      // Query for active dynamic pricing rules
      const [activeRules] = await pool.execute<RowDataPacket[]>(`
        SELECT rule_id, rule_type, adjustment_type, adjustment_value, min_price, max_price, conditions
        FROM dynamic_pricing_rules 
        WHERE is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (product_id = ? OR product_id IS NULL)
        ORDER BY priority ASC
      `, [testProductId]);

      expect(activeRules).toHaveLength(1);
      expect(activeRules[0].rule_type).toBe('time_based');
      expect(activeRules[0].adjustment_value).toBe(-5);
    });
  });

  describe('Vendor Coupon List Filtering by Status', () => {
    beforeEach(async () => {
      // Create coupons with different expiration statuses
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Expired coupon
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'EXPIRED10', 'Expired Coupon', 'percentage', 10, 0, 1, true,
          new Date('2025-01-01'), yesterday, testCustomerId]);

      // Active coupon
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'ACTIVE20', 'Active Coupon', 'percentage', 20, 0, 1, true,
          new Date('2025-01-01'), tomorrow, testCustomerId]);

      // Scheduled coupon
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'FUTURE30', 'Scheduled Coupon', 'percentage', 30, 0, 1, true,
          tomorrow, futureDate, testCustomerId]);

      // Inactive coupon
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'INACTIVE15', 'Inactive Coupon', 'percentage', 15, 0, 1, false,
          new Date('2025-01-01'), tomorrow, testCustomerId]);
    });

    it('should filter expired coupons correctly', async () => {
      const now = new Date();
      const [expiredCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT coupon_code, coupon_name FROM vendor_coupons 
        WHERE vendor_id = ? AND valid_until IS NOT NULL AND valid_until < ?
      `, [testVendorId, now]);

      expect(expiredCoupons).toHaveLength(1);
      expect(expiredCoupons[0].coupon_code).toBe('EXPIRED10');
    });

    it('should filter active coupons correctly', async () => {
      const now = new Date();
      const [activeCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT coupon_code, coupon_name FROM vendor_coupons 
        WHERE vendor_id = ? AND is_active = 1 AND valid_from <= ? AND (valid_until IS NULL OR valid_until > ?)
      `, [testVendorId, now, now]);

      expect(activeCoupons).toHaveLength(1);
      expect(activeCoupons[0].coupon_code).toBe('ACTIVE20');
    });

    it('should filter scheduled coupons correctly', async () => {
      const now = new Date();
      const [scheduledCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT coupon_code, coupon_name FROM vendor_coupons 
        WHERE vendor_id = ? AND is_active = 1 AND valid_from > ?
      `, [testVendorId, now]);

      expect(scheduledCoupons).toHaveLength(1);
      expect(scheduledCoupons[0].coupon_code).toBe('FUTURE30');
    });

    it('should filter inactive coupons correctly', async () => {
      const [inactiveCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT coupon_code, coupon_name FROM vendor_coupons 
        WHERE vendor_id = ? AND is_active = 0
      `, [testVendorId]);

      expect(inactiveCoupons).toHaveLength(1);
      expect(inactiveCoupons[0].coupon_code).toBe('INACTIVE15');
    });
  });

  describe('Integration Test: Pricing API with Expired Discounts', () => {
    it('should not apply expired discounts in pricing calculation', async () => {
      // Create expired discount and valid coupon
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Expired automatic discount
      await pool.execute(`
        INSERT INTO vendor_discounts (
          vendor_id, discount_name, discount_type, discount_value, 
          minimum_order_value, is_active, is_automatic,
          valid_from, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'Expired Auto 20%', 'percentage', 20, 0, true, true, 
          new Date('2025-01-01'), yesterday]);

      // Valid coupon
      await pool.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, discount_type, discount_value,
          minimum_order_value, usage_limit_per_customer, is_active,
          valid_from, valid_until, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [testVendorId, 'VALID10', 'Valid 10% Coupon', 'percentage', 10, 0, 1, true,
          new Date('2025-01-01'), tomorrow, testCustomerId]);

      // Test that expired discount is not applied but valid coupon is
      const [expiredDiscounts] = await pool.execute<RowDataPacket[]>(`
        SELECT discount_id FROM vendor_discounts 
        WHERE vendor_id = ? AND is_active = TRUE AND is_automatic = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `, [testVendorId]);

      const [validCoupons] = await pool.execute<RowDataPacket[]>(`
        SELECT coupon_id FROM vendor_coupons
        WHERE coupon_code = ? AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      `, ['VALID10']);

      expect(expiredDiscounts).toHaveLength(0); // Expired discount not applied
      expect(validCoupons).toHaveLength(1); // Valid coupon available
    });
  });
});