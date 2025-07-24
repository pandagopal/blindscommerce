import { BaseService } from './BaseService';
import crypto from 'crypto';

export interface ShippingAddress {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
}

export interface Package {
  length: number;  // inches
  width: number;   // inches
  height: number;  // inches
  weight: number;  // pounds
  value: number;   // USD
}

export interface ShippingRate {
  provider: string;
  service_name: string;
  service_type: string;
  estimated_days: number;
  rate: number;
  currency: string;
  tracking_available: boolean;
}

export interface ShippingLabel {
  provider: string;
  tracking_number: string;
  label_url: string;
  label_pdf?: string;
  rate: number;
  created_at: Date;
}

interface ShippingProvider {
  name: string;
  calculateRates(from: ShippingAddress, to: ShippingAddress, packages: Package[]): Promise<ShippingRate[]>;
  createLabel(from: ShippingAddress, to: ShippingAddress, packages: Package[], service: string): Promise<ShippingLabel>;
  trackShipment(trackingNumber: string): Promise<any>;
}

// UPS API Integration
class UPSProvider implements ShippingProvider {
  name = 'UPS';
  private apiKey: string;
  private accountNumber: string;
  private environment: 'test' | 'production';

  constructor(apiKey: string, accountNumber: string, environment: 'test' | 'production' = 'production') {
    this.apiKey = apiKey;
    this.accountNumber = accountNumber;
    this.environment = environment;
  }

  private get baseUrl(): string {
    return this.environment === 'production' 
      ? 'https://onlinetools.ups.com/api' 
      : 'https://wwwcie.ups.com/api';
  }

  async calculateRates(from: ShippingAddress, to: ShippingAddress, packages: Package[]): Promise<ShippingRate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rating/v1/Shop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'transId': crypto.randomUUID(),
          'transactionSrc': 'BlindsCommerce'
        },
        body: JSON.stringify({
          RateRequest: {
            Request: {
              SubVersion: '1703',
              TransactionReference: {
                CustomerContext: 'BlindsCommerce Rate Request'
              }
            },
            Shipment: {
              Shipper: {
                Address: {
                  AddressLine: [from.address_line_1, from.address_line_2].filter(Boolean),
                  City: from.city,
                  StateProvinceCode: from.state_province,
                  PostalCode: from.postal_code,
                  CountryCode: from.country_code
                }
              },
              ShipTo: {
                Address: {
                  AddressLine: [to.address_line_1, to.address_line_2].filter(Boolean),
                  City: to.city,
                  StateProvinceCode: to.state_province,
                  PostalCode: to.postal_code,
                  CountryCode: to.country_code
                }
              },
              Package: packages.map(pkg => ({
                PackagingType: {
                  Code: '02' // Customer supplied package
                },
                Dimensions: {
                  UnitOfMeasurement: { Code: 'IN' },
                  Length: Math.ceil(pkg.length).toString(),
                  Width: Math.ceil(pkg.width).toString(),
                  Height: Math.ceil(pkg.height).toString()
                },
                PackageWeight: {
                  UnitOfMeasurement: { Code: 'LBS' },
                  Weight: pkg.weight.toFixed(1)
                }
              }))
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`UPS API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.RateResponse.RatedShipment.map((shipment: any) => ({
        provider: 'UPS',
        service_name: this.getServiceName(shipment.Service.Code),
        service_type: shipment.Service.Code,
        estimated_days: parseInt(shipment.GuaranteedDelivery?.BusinessDaysInTransit || '5'),
        rate: parseFloat(shipment.TotalCharges.MonetaryValue),
        currency: shipment.TotalCharges.CurrencyCode,
        tracking_available: true
      }));
    } catch (error) {
      console.error('UPS rate calculation error:', error);
      throw error;
    }
  }

  async createLabel(from: ShippingAddress, to: ShippingAddress, packages: Package[], service: string): Promise<ShippingLabel> {
    // Implementation for creating shipping labels
    throw new Error('UPS label creation not implemented yet');
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/track/v1/details/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'transId': crypto.randomUUID(),
          'transactionSrc': 'BlindsCommerce'
        }
      });

      if (!response.ok) {
        throw new Error(`UPS tracking error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('UPS tracking error:', error);
      throw error;
    }
  }

  private getServiceName(code: string): string {
    const services: Record<string, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Express',
      '08': 'UPS Expedited',
      '11': 'UPS Standard',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver',
      '14': 'UPS Next Day Air Early',
      '54': 'UPS Express Plus',
      '59': 'UPS 2nd Day Air A.M.',
      '65': 'UPS Saver'
    };
    return services[code] || `UPS Service ${code}`;
  }
}

// DHL API Integration
class DHLProvider implements ShippingProvider {
  name = 'DHL';
  private apiKey: string;
  private accountNumber: string;
  private environment: 'test' | 'production';

  constructor(apiKey: string, accountNumber: string, environment: 'test' | 'production' = 'production') {
    this.apiKey = apiKey;
    this.accountNumber = accountNumber;
    this.environment = environment;
  }

  private get baseUrl(): string {
    return this.environment === 'production'
      ? 'https://express.api.dhl.com/mydhlapi'
      : 'https://express.api.dhl.com/mydhlapi/test';
  }

  async calculateRates(from: ShippingAddress, to: ShippingAddress, packages: Package[]): Promise<ShippingRate[]> {
    try {
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      const totalValue = packages.reduce((sum, pkg) => sum + pkg.value, 0);

      const params = new URLSearchParams({
        accountNumber: this.accountNumber,
        originCountryCode: from.country_code,
        originPostalCode: from.postal_code,
        originCityName: from.city,
        destinationCountryCode: to.country_code,
        destinationPostalCode: to.postal_code,
        destinationCityName: to.city,
        weight: totalWeight.toFixed(1),
        length: Math.max(...packages.map(p => p.length)).toString(),
        width: Math.max(...packages.map(p => p.width)).toString(),
        height: Math.max(...packages.map(p => p.height)).toString(),
        plannedShippingDateAndTime: new Date().toISOString(),
        isCustomsDeclarable: 'false',
        unitOfMeasurement: 'imperial'
      });

      const response = await fetch(`${this.baseUrl}/rates?${params}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Message-Reference': crypto.randomUUID(),
          'Message-Reference-Date': new Date().toISOString(),
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.products.map((product: any) => ({
        provider: 'DHL',
        service_name: product.productName,
        service_type: product.productCode,
        estimated_days: product.deliveryCapabilities?.totalTransitDays || 5,
        rate: parseFloat(product.totalPrice?.[0]?.price || '0'),
        currency: product.totalPrice?.[0]?.priceCurrency || 'USD',
        tracking_available: true
      }));
    } catch (error) {
      console.error('DHL rate calculation error:', error);
      throw error;
    }
  }

  async createLabel(from: ShippingAddress, to: ShippingAddress, packages: Package[], service: string): Promise<ShippingLabel> {
    // Implementation for creating shipping labels
    throw new Error('DHL label creation not implemented yet');
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${trackingNumber}/tracking`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DHL tracking error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DHL tracking error:', error);
      throw error;
    }
  }
}

export class ShippingService extends BaseService {
  private providers: Map<string, ShippingProvider> = new Map();
  private settings: any = null;

  constructor() {
    super('shipping');
  }

  async initialize() {
    // Load shipping provider settings from database
    await this.loadProviderSettings();
  }

  private async loadProviderSettings() {
    try {
      const [settings] = await this.raw(`
        SELECT setting_key, setting_value 
        FROM settings 
        WHERE setting_key LIKE 'shipping_%'
      `);

      this.settings = settings.reduce((acc: any, row: any) => {
        acc[row.setting_key] = row.setting_value;
        return acc;
      }, {});

      // Initialize UPS if configured
      if (this.settings.shipping_ups_enabled === 'true' && 
          this.settings.shipping_ups_api_key && 
          this.settings.shipping_ups_account_number) {
        this.providers.set('ups', new UPSProvider(
          this.settings.shipping_ups_api_key,
          this.settings.shipping_ups_account_number,
          this.settings.shipping_ups_environment || 'production'
        ));
      }

      // Initialize DHL if configured
      if (this.settings.shipping_dhl_enabled === 'true' && 
          this.settings.shipping_dhl_api_key && 
          this.settings.shipping_dhl_account_number) {
        this.providers.set('dhl', new DHLProvider(
          this.settings.shipping_dhl_api_key,
          this.settings.shipping_dhl_account_number,
          this.settings.shipping_dhl_environment || 'production'
        ));
      }
    } catch (error) {
      this.logger.error('Failed to load shipping provider settings:', error);
    }
  }

  async calculateShippingRates(
    from: ShippingAddress, 
    to: ShippingAddress, 
    packages: Package[]
  ): Promise<ShippingRate[]> {
    const allRates: ShippingRate[] = [];

    // Check cache first
    const cacheKey = this.getCacheKey(from, to, packages);
    const cachedRates = await this.getCachedRates(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }

    // Get rates from all enabled providers
    const ratePromises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        const rates = await provider.calculateRates(from, to, packages);
        return rates;
      } catch (error) {
        this.logger.error(`Failed to get rates from ${name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(ratePromises);
    results.forEach(rates => allRates.push(...rates));

    // Sort by price
    allRates.sort((a, b) => a.rate - b.rate);

    // Cache the results
    await this.cacheRates(cacheKey, allRates);

    return allRates;
  }

  async createShippingLabel(
    provider: string,
    from: ShippingAddress,
    to: ShippingAddress,
    packages: Package[],
    service: string,
    orderId: number
  ): Promise<ShippingLabel> {
    const shippingProvider = this.providers.get(provider.toLowerCase());
    if (!shippingProvider) {
      throw new Error(`Shipping provider ${provider} not configured`);
    }

    const label = await shippingProvider.createLabel(from, to, packages, service);

    // Save label info to database
    await this.raw(`
      INSERT INTO shipping_labels 
      (order_id, provider, tracking_number, label_url, label_pdf, rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [orderId, provider, label.tracking_number, label.label_url, label.label_pdf, label.rate]);

    return label;
  }

  async trackShipment(provider: string, trackingNumber: string): Promise<any> {
    const shippingProvider = this.providers.get(provider.toLowerCase());
    if (!shippingProvider) {
      throw new Error(`Shipping provider ${provider} not configured`);
    }

    return await shippingProvider.trackShipment(trackingNumber);
  }

  private getCacheKey(from: ShippingAddress, to: ShippingAddress, packages: Package[]): string {
    const data = JSON.stringify({
      from: from.postal_code,
      to: to.postal_code,
      packages: packages.map(p => ({
        l: Math.ceil(p.length),
        w: Math.ceil(p.width),
        h: Math.ceil(p.height),
        wt: Math.ceil(p.weight * 10) / 10
      }))
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async getCachedRates(cacheKey: string): Promise<ShippingRate[] | null> {
    try {
      const [cached] = await this.raw(`
        SELECT rates 
        FROM shipping_rate_cache 
        WHERE cache_key = ? AND expires_at > NOW()
        LIMIT 1
      `, [cacheKey]);

      if (cached && cached.rates) {
        return JSON.parse(cached.rates);
      }
    } catch (error) {
      this.logger.error('Failed to get cached rates:', error);
    }
    return null;
  }

  private async cacheRates(cacheKey: string, rates: ShippingRate[]): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

      await this.raw(`
        INSERT INTO shipping_rate_cache (cache_key, rates, expires_at)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          rates = VALUES(rates),
          expires_at = VALUES(expires_at),
          created_at = NOW()
      `, [cacheKey, JSON.stringify(rates), expiresAt]);
    } catch (error) {
      this.logger.error('Failed to cache rates:', error);
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    return Array.from(this.providers.keys());
  }

  async testProviderConnection(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const shippingProvider = this.providers.get(provider.toLowerCase());
      if (!shippingProvider) {
        return { success: false, message: `Provider ${provider} not configured` };
      }

      // Test with sample addresses
      const from: ShippingAddress = {
        address_line_1: '123 Test St',
        city: 'Austin',
        state_province: 'TX',
        postal_code: '78701',
        country_code: 'US'
      };

      const to: ShippingAddress = {
        address_line_1: '456 Sample Ave',
        city: 'New York',
        state_province: 'NY',
        postal_code: '10001',
        country_code: 'US'
      };

      const packages: Package[] = [{
        length: 12,
        width: 10,
        height: 8,
        weight: 5,
        value: 100
      }];

      const rates = await shippingProvider.calculateRates(from, to, packages);
      
      if (rates && rates.length > 0) {
        return { success: true, message: `Successfully connected to ${provider}. Found ${rates.length} shipping options.` };
      } else {
        return { success: false, message: `Connected to ${provider} but no rates returned` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to connect to ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}