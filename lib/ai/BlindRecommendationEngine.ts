/**
 * Blind Recommendation Engine
 * AI-powered algorithm to recommend optimal blind products based on window characteristics,
 * room type, lighting conditions, and user preferences
 */

interface DetectedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  lightingCondition: 'bright' | 'normal' | 'dim';
  windowType?: 'standard' | 'wide' | 'patio_door' | 'bay';
  measurements?: {
    estimatedWidth: number;
    estimatedHeight: number;
    unit: 'inches' | 'cm';
  };
}

interface Product {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  custom_width_min?: number;
  custom_width_max?: number;
  custom_height_min?: number;
  custom_height_max?: number;
  primary_image_url?: string;
  room_suitability_score?: number;
  product_type?: string;
  opacity?: number;
  supports_motorization?: boolean;
  moisture_resistant?: boolean;
  rating?: number;
}

interface ProductRecommendation {
  product: Product;
  window_index: number;
  score: number;
  reasons: string[];
  estimated_price: number;
  isPatioDoorRecommended: boolean;
}

interface RecommendationCriteria {
  window: DetectedWindow;
  roomType: string;
  budget?: { min: number; max: number };
  preferredStyles?: string[];
}

export class BlindRecommendationEngine {

  /**
   * Privacy requirements by room type
   */
  private static readonly PRIVACY_NEEDS: Record<string, 'high' | 'medium' | 'low'> = {
    'Bathroom': 'high',
    'Bedroom': 'high',
    'Living Room': 'medium',
    'Dining Room': 'medium',
    'Kitchen': 'low',
    'Office': 'medium',
    'Home Office': 'medium',
    'Conference Room': 'medium',
    'Media Room': 'high',
    'Nursery': 'high'
  };

  /**
   * Patio door optimized product types
   */
  private static readonly PATIO_DOOR_TYPES = [
    'vertical blind',
    'sliding panel',
    'vertical cellular',
    'vertical honeycomb',
    'panel track'
  ];

  /**
   * Score a product against window and room criteria
   */
  static scoreProduct(
    product: Product,
    window: DetectedWindow,
    roomType: string,
    lightingCondition: string
  ): number {
    let score = 0;

    // 1. Size compatibility (0-30 points)
    score += this.calculateSizeScore(product, window);

    // 2. Room suitability (0-25 points from database)
    if (product.room_suitability_score) {
      score += (product.room_suitability_score / 10) * 25;
    } else {
      score += 12.5; // Default mid-range if not specified
    }

    // 3. Lighting match (0-20 points)
    score += this.calculateLightingMatch(product, lightingCondition, roomType);

    // 4. Feature match (0-15 points)
    score += this.calculateFeatureMatch(product, window);

    // 5. Price tier preference (0-10 points - mid-range preferred)
    score += this.calculatePriceTierScore(product.base_price);

    return Math.round(score);
  }

  /**
   * Calculate size compatibility score
   */
  private static calculateSizeScore(product: Product, window: DetectedWindow): number {
    if (!window.measurements) return 0;

    const windowWidth = window.measurements.estimatedWidth;
    const windowHeight = window.measurements.estimatedHeight;

    const minWidth = product.custom_width_min || 12;
    const maxWidth = product.custom_width_max || 120;
    const minHeight = product.custom_height_min || 12;
    const maxHeight = product.custom_height_max || 120;

    // Perfect fit
    if (windowWidth >= minWidth && windowWidth <= maxWidth &&
        windowHeight >= minHeight && windowHeight <= maxHeight) {
      return 30;
    }

    // Partial fit (one dimension fits)
    if ((windowWidth >= minWidth && windowWidth <= maxWidth) ||
        (windowHeight >= minHeight && windowHeight <= maxHeight)) {
      return 15;
    }

    return 0;
  }

  /**
   * Calculate lighting condition match score
   */
  private static calculateLightingMatch(
    product: Product,
    lightingCondition: string,
    roomType: string
  ): number {
    const opacity = product.opacity || 0.5;
    let score = 0;

    // Bedroom always prefers blackout
    if (roomType.toLowerCase().includes('bedroom') || roomType.toLowerCase().includes('nursery')) {
      if (opacity >= 0.9) score = 20; // Blackout
      else if (opacity >= 0.7) score = 15; // Room darkening
      else score = 5;
      return score;
    }

    // Match lighting to opacity
    if (lightingCondition === 'bright') {
      if (opacity >= 0.7) score = 20; // Solar shades, blackout
      else if (opacity >= 0.4) score = 15; // Light filtering
      else score = 10; // Sheer
    } else if (lightingCondition === 'normal') {
      if (opacity >= 0.4 && opacity <= 0.7) score = 20; // Light filtering ideal
      else if (opacity >= 0.7) score = 15; // Room darkening OK
      else score = 12; // Sheer acceptable
    } else { // dim
      if (opacity <= 0.3) score = 20; // Sheer to maximize light
      else if (opacity <= 0.5) score = 15; // Light filtering
      else score = 5;
    }

    return score;
  }

  /**
   * Calculate feature match score
   */
  private static calculateFeatureMatch(product: Product, window: DetectedWindow): number {
    let score = 0;

    if (!window.measurements) return 0;

    const windowWidth = window.measurements.estimatedWidth;

    // Large windows benefit from motorization
    if (windowWidth > 60 && product.supports_motorization) {
      score += 10;
    }

    // Patio door specific
    if (window.windowType === 'patio_door') {
      const productType = (product.product_type || '').toLowerCase();
      if (this.PATIO_DOOR_TYPES.some(type => productType.includes(type))) {
        score += 15;
      } else {
        score += 5; // Other products can work but not ideal
      }
    }

    // Bathroom/Kitchen need moisture resistance
    return score;
  }

  /**
   * Calculate price tier preference score
   */
  private static calculatePriceTierScore(price: number): number {
    // Prefer mid-range products ($50-$300)
    if (price >= 50 && price <= 300) return 10;
    if (price >= 30 && price < 50) return 8;
    if (price > 300 && price <= 500) return 8;
    if (price < 30) return 5;
    if (price > 500) return 6;
    return 5;
  }

  /**
   * Generate recommendation reasons
   */
  static generateReasons(
    product: Product,
    window: DetectedWindow,
    roomType: string,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Size fit
    if (window.measurements) {
      const fits = this.calculateSizeScore(product, window) >= 25;
      if (fits) {
        reasons.push(`Perfect fit for ${window.measurements.estimatedWidth}" × ${window.measurements.estimatedHeight}" window`);
      }
    }

    // Room suitability
    if (product.room_suitability_score && product.room_suitability_score >= 8) {
      reasons.push(`Highly recommended for ${roomType}`);
    }

    // Patio door
    if (window.windowType === 'patio_door') {
      const productType = (product.product_type || '').toLowerCase();
      if (this.PATIO_DOOR_TYPES.some(type => productType.includes(type))) {
        reasons.push('Optimized for patio door installation');
      }
    }

    // Motorization
    if (window.measurements && window.measurements.estimatedWidth > 60 && product.supports_motorization) {
      reasons.push('Motorized option available for easy operation');
    }

    // Lighting
    if (window.lightingCondition === 'bright' && product.opacity && product.opacity >= 0.7) {
      reasons.push('Excellent light blocking for bright rooms');
    }

    // Rating
    if (product.rating && product.rating >= 4.5) {
      reasons.push(`Top rated (${product.rating}★)`);
    }

    // Default if no specific reasons
    if (reasons.length === 0) {
      reasons.push(`${score}% compatibility match`);
    }

    return reasons.slice(0, 3); // Max 3 reasons
  }

  /**
   * Classify window type based on dimensions and aspect ratio
   */
  static classifyWindowType(window: DetectedWindow): 'standard' | 'wide' | 'patio_door' | 'bay' {
    if (!window.measurements) return 'standard';

    const { estimatedWidth, estimatedHeight } = window.measurements;
    const aspectRatio = estimatedWidth / estimatedHeight;

    // Patio door: very tall (>70" height) with narrow aspect ratio
    if (estimatedHeight > 70 && aspectRatio <= 0.6) {
      return 'patio_door';
    }

    // Wide window: aspect ratio > 2:1
    if (aspectRatio > 2) {
      return 'wide';
    }

    // Bay window detection would require multiple connected windows
    // For now, default to standard

    return 'standard';
  }

  /**
   * Estimate price based on window size and product base price
   */
  static estimatePrice(product: Product, window: DetectedWindow): number {
    if (!window.measurements) return product.base_price;

    const { estimatedWidth, estimatedHeight } = window.measurements;
    const area = (estimatedWidth * estimatedHeight) / 144; // Convert to square feet

    // Base price + area-based markup
    // Assume $10-20 per square foot for most blinds
    const pricePerSqFt = product.base_price / 10; // Estimate
    const estimatedPrice = product.base_price + (area * pricePerSqFt);

    return Math.round(estimatedPrice * 100) / 100;
  }

  /**
   * Check if product is patio door optimized
   */
  static isPatioDoorOptimized(product: Product): boolean {
    const productType = (product.product_type || '').toLowerCase();
    return this.PATIO_DOOR_TYPES.some(type => productType.includes(type));
  }

  /**
   * Generate recommendations for a window
   */
  static recommendProducts(
    products: Product[],
    criteria: RecommendationCriteria
  ): ProductRecommendation[] {
    const { window, roomType } = criteria;

    // Classify window type if not already set
    if (!window.windowType) {
      window.windowType = this.classifyWindowType(window);
    }

    const recommendations: ProductRecommendation[] = products
      .map((product, index) => {
        const score = this.scoreProduct(
          product,
          window,
          roomType,
          window.lightingCondition
        );

        return {
          product,
          window_index: 0,
          score,
          reasons: this.generateReasons(product, window, roomType, score),
          estimated_price: this.estimatePrice(product, window),
          isPatioDoorRecommended: this.isPatioDoorOptimized(product)
        };
      })
      .filter(rec => rec.score >= 40) // Minimum 40% match
      .sort((a, b) => {
        // For patio doors, prioritize optimized products
        if (window.windowType === 'patio_door') {
          if (a.isPatioDoorRecommended && !b.isPatioDoorRecommended) return -1;
          if (!a.isPatioDoorRecommended && b.isPatioDoorRecommended) return 1;
        }
        // Otherwise sort by score
        return b.score - a.score;
      });

    return recommendations.slice(0, 10); // Top 10 recommendations
  }
}
