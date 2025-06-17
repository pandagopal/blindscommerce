import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async loginAs(role: 'admin' | 'vendor' | 'customer' | 'sales' | 'installer') {
    const credentials = {
      admin: { email: 'admin@smartblindshub.com', password: 'Admin@1234' },
      vendor: { email: 'vendor@smartblindshub.com', password: 'Admin@1234' },
      customer: { email: 'customer@smartblindshub.com', password: 'Admin@1234' },
      sales: { email: 'sales@smartblindshub.com', password: 'Admin@1234' },
      installer: { email: 'installer@smartblindshub.com', password: 'Admin@1234' }
    };

    await this.page.goto('/login');
    await this.page.fill('#email', credentials[role].email);
    await this.page.fill('#password', credentials[role].password);
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await this.page.waitForURL(url => !url.pathname.includes('/login'));
  }

  async logout() {
    await this.page.click('text=Test');
    await this.page.click('text=Sign Out');
    await this.page.waitForURL(url => url.pathname === '/' || url.pathname === '/login');
  }

  async waitForLoadingToFinish() {
    // Wait for loading spinner to disappear, or just wait a bit if no spinner exists
    try {
      await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 2000 });
    } catch {
      // If no loading element exists, just wait a bit
      await this.page.waitForTimeout(1000);
    }
  }

  async fillFractionInput(selector: string, whole: number, fraction: string) {
    await this.page.fill(`${selector} [data-testid="whole-number"]`, whole.toString());
    await this.page.selectOption(`${selector} [data-testid="fraction-select"]`, fraction);
  }

  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }

  async expectToastMessage(message: string) {
    await expect(this.page.locator('[data-testid="toast"]')).toContainText(message);
  }

  async navigateToProductConfiguration(productSlug: string) {
    await this.page.goto(`/products/configure/${productSlug}`);
    await this.waitForLoadingToFinish();
  }

  async completeBasicProductConfiguration() {
    // Step 1: Dimensions
    await this.fillFractionInput('[data-testid="width-input"]', 48, '1/2');
    await this.fillFractionInput('[data-testid="height-input"]', 72, '0');
    await this.page.click('[data-testid="next-step"]');

    // Step 2: Colors
    await this.page.click('[data-testid="color-option"]:first-child');
    await this.page.click('[data-testid="next-step"]');

    // Step 3: Materials
    await this.page.click('[data-testid="material-option"]:first-child');
    await this.page.click('[data-testid="next-step"]');

    // Step 4: Controls
    await this.page.click('[data-testid="control-cordless"]');
    await this.page.click('[data-testid="next-step"]');

    // Step 5: Rails
    await this.page.click('[data-testid="headrail-option"]:first-child');
    await this.page.click('[data-testid="next-step"]');

    // Step 6: Room View (skip)
    await this.page.click('[data-testid="next-step"]');
  }

  async addToCart() {
    await this.page.click('[data-testid="add-to-cart"]');
    await this.expectToastMessage('Added to cart');
  }

  async proceedToCheckout() {
    await this.page.goto('/cart');
    await this.page.click('[data-testid="checkout-button"]');
    await this.page.waitForURL('/checkout');
  }

  async fillShippingAddress() {
    await this.page.fill('[data-testid="first-name"]', 'John');
    await this.page.fill('[data-testid="last-name"]', 'Doe');
    await this.page.fill('[data-testid="address"]', '123 Main St');
    await this.page.fill('[data-testid="city"]', 'Anytown');
    await this.page.selectOption('[data-testid="state"]', 'CA');
    await this.page.fill('[data-testid="zip"]', '12345');
    await this.page.fill('[data-testid="phone"]', '555-123-4567');
  }

  async fillPaymentInfo() {
    await this.page.fill('[data-testid="card-number"]', '4242424242424242');
    await this.page.fill('[data-testid="card-expiry"]', '12/28');
    await this.page.fill('[data-testid="card-cvc"]', '123');
    await this.page.fill('[data-testid="card-name"]', 'John Doe');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}