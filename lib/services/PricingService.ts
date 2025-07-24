import { BaseService } from './BaseService';

export interface PricingFormula {
  formula_id: number;
  product_id: number;
  vendor_id: number;
  pricing_type: 'formula' | 'per_square' | 'fixed';
  fixed_base: number;
  width_rate: number;
  height_rate: number;
  area_rate: number;
  rate_per_square: number;
  min_squares: number;
  min_charge: number;
  max_width: number;
  max_height: number;
  is_active: boolean;
}

export interface PricingOptions {
  width: number;
  height: number;
  colorId?: number;
  materialId?: number;
  mountType?: string;
  controlType?: string;
  headrailId?: number;
  bottomRailId?: number;
  addons?: string[];
}

export interface PriceBreakdown {
  basePrice: number;
  sizePrice: number;
  colorModifier: number;
  materialModifier: number;
  optionsPrice: number;
  addonsPrice: number;
  subtotal: number;
  minChargeApplied: boolean;
  finalPrice: number;
}

export class PricingService extends BaseService {
  constructor() {
    super('pricing');
  }

  async calculateProductPrice(
    productId: number, 
    options: PricingOptions
  ): Promise<PriceBreakdown> {
    try {
      // Get pricing formula
      const formula = await this.getPricingFormula(productId);
      if (!formula) {
        throw new Error(`No pricing formula found for product ${productId}`);
      }

      // Validate dimensions
      if (options.width > formula.max_width || options.height > formula.max_height) {
        throw new Error(`Dimensions exceed maximum allowed: ${formula.max_width}" x ${formula.max_height}"`);
      }

      // Calculate base price based on pricing type
      let basePrice = 0;
      let sizePrice = 0;

      switch (formula.pricing_type) {
        case 'formula':
          // Price = A + B×width + C×height + D×(width×height)
          basePrice = formula.fixed_base;
          sizePrice = (formula.width_rate * options.width) +
                     (formula.height_rate * options.height) +
                     (formula.area_rate * options.width * options.height);
          break;

        case 'per_square':
          // Price = rate × area (in square feet)
          const areaInSqFt = (options.width * options.height) / 144;
          const minArea = Math.max(areaInSqFt, formula.min_squares);
          basePrice = 0;
          sizePrice = formula.rate_per_square * minArea;
          break;

        case 'fixed':
          // Fixed price regardless of size
          basePrice = formula.fixed_base;
          sizePrice = 0;
          break;
      }

      // Get color and material modifiers
      const colorModifier = await this.getColorModifier(productId, options.colorId);
      const materialModifier = await this.getMaterialModifier(productId, options.materialId);

      // Calculate options price
      const optionsPrice = await this.calculateOptionsPrice(productId, options);

      // Calculate addons price
      const addonsPrice = await this.calculateAddonsPrice(productId, options.addons || []);

      // Calculate subtotal
      const subtotal = basePrice + sizePrice + colorModifier + materialModifier + optionsPrice + addonsPrice;

      // Apply minimum charge if needed
      const minChargeApplied = subtotal < formula.min_charge;
      const finalPrice = Math.max(subtotal, formula.min_charge);

      return {
        basePrice,
        sizePrice,
        colorModifier,
        materialModifier,
        optionsPrice,
        addonsPrice,
        subtotal,
        minChargeApplied,
        finalPrice
      };
    } catch (error) {
      this.logger.error('Price calculation failed:', error);
      throw error;
    }
  }

  private async getPricingFormula(productId: number): Promise<PricingFormula | null> {
    const [formula] = await this.raw(
      `SELECT * FROM product_pricing_formulas 
       WHERE product_id = ? AND is_active = 1`,
      [productId]
    );
    return formula || null;
  }

  private async getColorModifier(productId: number, colorId?: number): Promise<number> {
    if (!colorId) return 0;

    const [color] = await this.raw(
      `SELECT price_modifier FROM product_colors 
       WHERE product_id = ? AND color_id = ?`,
      [productId, colorId]
    );
    return color?.price_modifier || 0;
  }

  private async getMaterialModifier(productId: number, materialId?: number): Promise<number> {
    if (!materialId) return 0;

    const [material] = await this.raw(
      `SELECT price_modifier FROM product_materials 
       WHERE product_id = ? AND material_id = ?`,
      [productId, materialId]
    );
    return material?.price_modifier || 0;
  }

  private async calculateOptionsPrice(productId: number, options: PricingOptions): Promise<number> {
    let totalPrice = 0;

    // Mount type pricing
    if (options.mountType) {
      const [mountOption] = await this.raw(
        `SELECT price_adjustment FROM product_options 
         WHERE product_id = ? AND option_type = 'mount' 
         AND option_value = ? AND is_active = 1`,
        [productId, options.mountType]
      );
      totalPrice += mountOption?.price_adjustment || 0;
    }

    // Control type pricing  
    if (options.controlType) {
      const [controlOption] = await this.raw(
        `SELECT price_adjustment FROM product_options 
         WHERE product_id = ? AND option_type = 'control' 
         AND option_value = ? AND is_active = 1`,
        [productId, options.controlType]
      );
      totalPrice += controlOption?.price_adjustment || 0;
    }

    // Headrail pricing
    if (options.headrailId) {
      const [headrailOption] = await this.raw(
        `SELECT price_adjustment FROM product_options 
         WHERE product_id = ? AND option_type = 'headrail' 
         AND option_id = ? AND is_active = 1`,
        [productId, options.headrailId]
      );
      totalPrice += headrailOption?.price_adjustment || 0;
    }

    // Bottom rail pricing
    if (options.bottomRailId) {
      const [bottomRailOption] = await this.raw(
        `SELECT price_adjustment FROM product_options 
         WHERE product_id = ? AND option_type = 'bottomrail' 
         AND option_id = ? AND is_active = 1`,
        [productId, options.bottomRailId]
      );
      totalPrice += bottomRailOption?.price_adjustment || 0;
    }

    return totalPrice;
  }

  private async calculateAddonsPrice(productId: number, addons: string[]): Promise<number> {
    if (!addons.length) return 0;

    const addonPrices = await this.raw(
      `SELECT addon_type, price_type, price_value 
       FROM product_addon_pricing 
       WHERE product_id = ? AND addon_type IN (?) 
       AND is_active = 1`,
      [productId, addons]
    );

    return addonPrices.reduce((total: number, addon: any) => {
      return total + (addon.price_value || 0);
    }, 0);
  }

  async updatePricingFormula(
    productId: number, 
    formula: Partial<PricingFormula>
  ): Promise<void> {
    const fields = [];
    const values = [];

    if (formula.pricing_type !== undefined) {
      fields.push('pricing_type = ?');
      values.push(formula.pricing_type);
    }
    if (formula.fixed_base !== undefined) {
      fields.push('fixed_base = ?');
      values.push(formula.fixed_base);
    }
    if (formula.width_rate !== undefined) {
      fields.push('width_rate = ?');
      values.push(formula.width_rate);
    }
    if (formula.height_rate !== undefined) {
      fields.push('height_rate = ?');
      values.push(formula.height_rate);
    }
    if (formula.area_rate !== undefined) {
      fields.push('area_rate = ?');
      values.push(formula.area_rate);
    }
    if (formula.rate_per_square !== undefined) {
      fields.push('rate_per_square = ?');
      values.push(formula.rate_per_square);
    }
    if (formula.min_charge !== undefined) {
      fields.push('min_charge = ?');
      values.push(formula.min_charge);
    }

    if (fields.length === 0) return;

    values.push(productId);

    await this.raw(
      `UPDATE product_pricing_formulas 
       SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE product_id = ?`,
      values
    );
  }

  async migratePricingMatrixToFormula(productId: number): Promise<void> {
    // Get existing pricing matrix data
    const matrixData = await this.raw(
      `SELECT * FROM product_pricing_matrix 
       WHERE product_id = ? 
       ORDER BY width_min, height_min`,
      [productId]
    );

    if (!matrixData.length) {
      throw new Error(`No pricing matrix data found for product ${productId}`);
    }

    // Analyze pricing patterns to derive formula coefficients
    const coefficients = this.analyzePricingPattern(matrixData);

    // Create or update pricing formula
    await this.raw(
      `INSERT INTO product_pricing_formulas 
       (product_id, vendor_id, pricing_type, fixed_base, width_rate, height_rate, area_rate, min_charge)
       SELECT ?, vendor_id, 'formula', ?, ?, ?, ?, ?
       FROM products WHERE product_id = ?
       ON DUPLICATE KEY UPDATE
       fixed_base = VALUES(fixed_base),
       width_rate = VALUES(width_rate),
       height_rate = VALUES(height_rate),
       area_rate = VALUES(area_rate),
       updated_at = NOW()`,
      [
        productId,
        coefficients.fixedBase,
        coefficients.widthRate,
        coefficients.heightRate,
        coefficients.areaRate,
        coefficients.minCharge,
        productId
      ]
    );

    // Update product to use formula pricing
    await this.raw(
      `UPDATE products SET pricing_method = 'formula' WHERE product_id = ?`,
      [productId]
    );
  }

  private analyzePricingPattern(matrixData: any[]): any {
    // This is a simplified analysis
    // In a real implementation, you'd use regression analysis
    // to find the best-fit coefficients
    
    const firstEntry = matrixData[0];
    const lastEntry = matrixData[matrixData.length - 1];
    
    const widthDiff = lastEntry.width_max - firstEntry.width_min;
    const heightDiff = lastEntry.height_max - firstEntry.height_min;
    const priceDiff = lastEntry.price - firstEntry.price;
    
    return {
      fixedBase: firstEntry.price,
      widthRate: priceDiff / widthDiff * 0.3, // Rough approximation
      heightRate: priceDiff / heightDiff * 0.05,
      areaRate: 0.005, // Default small area coefficient
      minCharge: Math.min(...matrixData.map(m => m.price))
    };
  }
}