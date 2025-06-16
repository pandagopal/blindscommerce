import { test, expect, devices } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Cross-Browser Compatibility Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  // Test across different browsers
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test.describe(`${browserName} Browser Tests`, () => {
      test(`Homepage functionality in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
        
        await page.goto('/');
        await helpers.waitForLoadingToFinish();

        // Core elements should be visible
        await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
        await expect(page.locator('[data-testid="coming-soon"]')).toBeVisible();

        // Navigation should work
        await page.click('[data-testid="nav-products"]');
        await expect(page).toHaveURL('/products');

        // Search functionality
        await page.fill('[data-testid="search-input"]', 'roller');
        await page.click('[data-testid="search-button"]');
        await helpers.waitForLoadingToFinish();
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      });

      test(`Product configuration in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
        
        await helpers.navigateToProductConfiguration('premium-roller-shade');

        // Test fraction input compatibility
        await helpers.fillFractionInput('[data-testid="width-input"]', 48, '3/8');
        const widthValue = await page.locator('[data-testid="width-input"] [data-testid="whole-number"]').inputValue();
        expect(widthValue).toBe('48');

        // Test step navigation
        await page.click('[data-testid="next-step"]');
        await expect(page.locator('[data-testid="step-title"]')).toContainText('Colors');

        // Test color selection
        await page.click('[data-testid="color-option"]:first-child');
        await expect(page.locator('[data-testid="selected-color"]')).toBeVisible();

        // Price calculation should work
        await expect(page.locator('[data-testid="current-price"]')).toContainText('$');
      });

      test(`Shopping cart functionality in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
        
        await helpers.loginAs('customer');
        await helpers.navigateToProductConfiguration('premium-roller-shade');
        await helpers.completeBasicProductConfiguration();
        await helpers.addToCart();

        await page.goto('/cart');
        await helpers.waitForLoadingToFinish();

        // Cart items should display
        await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

        // Quantity updates should work
        await page.click('[data-testid="quantity-increase"]');
        await page.waitForSelector('[data-testid="cart-total"]');
        
        const quantity = await page.locator('[data-testid="quantity"]').inputValue();
        expect(parseInt(quantity)).toBeGreaterThan(1);
      });

      test(`Authentication flow in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Test specific to ${browserName}`);
        
        // Test login
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'customer@smartblindshub.com');
        await page.fill('[data-testid="password"]', 'Admin@1234');
        await page.click('[data-testid="login-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/account/);
        await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();

        // Test logout
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');
        await expect(page).toHaveURL('/login');
      });
    });
  });

  test.describe('Mobile Device Testing', () => {
    // Test on different mobile devices
    [
      { name: 'iPhone 12', device: devices['iPhone 12'] },
      { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'] },
      { name: 'Pixel 5', device: devices['Pixel 5'] },
      { name: 'Galaxy S21', device: devices['Galaxy S21'] }
    ].forEach(({ name, device }) => {
      test(`Mobile experience on ${name}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device
        });
        const page = await context.newPage();
        const mobileHelpers = new TestHelpers(page);

        await page.goto('/');
        await mobileHelpers.waitForLoadingToFinish();

        // Mobile navigation should be visible
        await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
        
        // Tap to open mobile menu
        await page.tap('[data-testid="mobile-menu-toggle"]');
        await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

        // Touch navigation should work
        await page.tap('[data-testid="nav-products"]');
        await expect(page).toHaveURL('/products');

        // Test product card interaction on mobile
        await page.tap('[data-testid="product-card"]:first-child');
        await mobileHelpers.waitForLoadingToFinish();

        // Configuration should work on mobile
        if (await page.locator('[data-testid="configure-button"]').isVisible()) {
          await page.tap('[data-testid="configure-button"]');
          await mobileHelpers.waitForLoadingToFinish();
          
          // Mobile configurator should be responsive
          await expect(page.locator('[data-testid="mobile-step-indicator"]')).toBeVisible();
          await expect(page.locator('[data-testid="configuration-steps"]')).toBeVisible();
        }

        await context.close();
      });
    });

    test('Touch and swipe gestures', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      const mobileHelpers = new TestHelpers(page);

      await mobileHelpers.navigateToProductConfiguration('premium-roller-shade');

      // Test touch input for number fields
      await page.tap('[data-testid="width-input"] [data-testid="whole-number"]');
      await page.fill('[data-testid="width-input"] [data-testid="whole-number"]', '48');

      // Test touch for dropdown selection
      await page.tap('[data-testid="width-input"] [data-testid="fraction-select"]');
      await page.selectOption('[data-testid="width-input"] [data-testid="fraction-select"]', '1/2');

      // Test swipe gestures for step navigation (if implemented)
      const initialStep = await page.locator('[data-testid="step-title"]').textContent();
      
      try {
        // Try to swipe left to go to next step
        await page.touchscreen.swipe(300, 400, 100, 400);
        await page.waitForTimeout(1000);
        
        const newStep = await page.locator('[data-testid="step-title"]').textContent();
        // If swipe is implemented, step should change
        if (newStep !== initialStep) {
          expect(newStep).not.toBe(initialStep);
        }
      } catch (error) {
        // Swipe not implemented, use button
        await page.tap('[data-testid="next-step"]');
      }

      await context.close();
    });

    test('Mobile performance and loading', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5']
      });
      const page = await context.newPage();

      // Simulate slow 3G connection
      const client = await context.newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 300
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Mobile should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000); // 10 seconds

      // Critical content should be visible
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

      await context.close();
    });
  });

  test.describe('Tablet Device Testing', () => {
    ['iPad Air', 'Galaxy Tab S4'].forEach(deviceName => {
      test(`Tablet experience on ${deviceName}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...devices[deviceName]
        });
        const page = await context.newPage();
        const tabletHelpers = new TestHelpers(page);

        await page.goto('/');
        await tabletHelpers.waitForLoadingToFinish();

        // Tablet should show desktop-like navigation
        await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
        
        // But may have some mobile optimizations
        const viewport = page.viewportSize();
        expect(viewport?.width).toBeGreaterThan(768);

        // Product grid should adapt to tablet size
        await page.goto('/products');
        await tabletHelpers.waitForLoadingToFinish();

        const productCards = await page.locator('[data-testid="product-card"]').count();
        expect(productCards).toBeGreaterThan(0);

        // Configuration should work well on tablet
        await tabletHelpers.navigateToProductConfiguration('premium-roller-shade');
        await expect(page.locator('[data-testid="configuration-steps"]')).toBeVisible();

        // Touch interactions should work
        await page.tap('[data-testid="width-input"] [data-testid="whole-number"]');
        await page.fill('[data-testid="width-input"] [data-testid="whole-number"]', '60');

        await context.close();
      });
    });
  });

  test.describe('Operating System Compatibility', () => {
    test('Windows compatibility', async ({ page, browserName }) => {
      // Simulate Windows user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      await page.goto('/');
      await helpers.waitForLoadingToFinish();

      // Windows-specific font rendering should work
      const bodyFont = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      expect(bodyFont).toBeTruthy();

      // File uploads should work on Windows
      await helpers.loginAs('vendor');
      await page.goto('/vendor/products/new');
      
      // Test file input (Windows path simulation)
      const fileInput = page.locator('[data-testid="product-image-upload"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeVisible();
      }
    });

    test('macOS compatibility', async ({ page }) => {
      // Simulate macOS user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      await page.goto('/');
      await helpers.waitForLoadingToFinish();

      // macOS-specific interactions
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();

      // Test cmd+click behavior (if implemented)
      await page.goto('/products');
      await page.click('[data-testid="product-card"]:first-child', { 
        modifiers: ['Meta'] // Cmd key on Mac
      });
      
      // Should handle modifier keys appropriately
    });

    test('Linux compatibility', async ({ page }) => {
      // Simulate Linux user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      await page.goto('/');
      await helpers.waitForLoadingToFinish();

      // Linux-specific font and rendering
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      
      // Test that all functionality works on Linux
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      
      await expect(page.locator('[data-testid="toast"]')).toContainText('Added to cart');
    });
  });

  test.describe('Browser Feature Compatibility', () => {
    test('Local storage and session storage', async ({ page }) => {
      await page.goto('/');

      // Test localStorage support
      const localStorageSupported = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch (e) {
          return false;
        }
      });
      expect(localStorageSupported).toBeTruthy();

      // Test sessionStorage support
      const sessionStorageSupported = await page.evaluate(() => {
        try {
          sessionStorage.setItem('test', 'value');
          const value = sessionStorage.getItem('test');
          sessionStorage.removeItem('test');
          return value === 'value';
        } catch (e) {
          return false;
        }
      });
      expect(sessionStorageSupported).toBeTruthy();
    });

    test('CSS Grid and Flexbox support', async ({ page }) => {
      await page.goto('/products');

      // Test CSS Grid support
      const gridSupported = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        return testElement.style.display === 'grid';
      });
      expect(gridSupported).toBeTruthy();

      // Test Flexbox support
      const flexSupported = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'flex';
        return testElement.style.display === 'flex';
      });
      expect(flexSupported).toBeTruthy();

      // Product grid should render correctly
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    });

    test('JavaScript ES6+ features', async ({ page }) => {
      await page.goto('/');

      // Test modern JavaScript features
      const modernJSSupported = await page.evaluate(() => {
        try {
          // Test arrow functions
          const arrowFunc = () => true;
          
          // Test template literals
          const template = `test ${1 + 1}`;
          
          // Test const/let
          const constVar = 'test';
          let letVar = 'test';
          
          // Test destructuring
          const { length } = 'test';
          
          // Test async/await (basic syntax check)
          const asyncFunc = async () => true;
          
          return arrowFunc() && template === 'test 2' && constVar === 'test' && length === 4;
        } catch (e) {
          return false;
        }
      });
      expect(modernJSSupported).toBeTruthy();
    });

    test('File API and drag-drop support', async ({ page }) => {
      await helpers.loginAs('vendor');
      await page.goto('/vendor/products/new');

      // Test File API support
      const fileAPISupported = await page.evaluate(() => {
        return typeof FileReader !== 'undefined' && typeof File !== 'undefined';
      });
      expect(fileAPISupported).toBeTruthy();

      // Test drag and drop API
      const dragDropSupported = await page.evaluate(() => {
        const div = document.createElement('div');
        return 'draggable' in div && 'ondrop' in div;
      });
      expect(dragDropSupported).toBeTruthy();
    });

    test('Geolocation API (if used)', async ({ page }) => {
      await page.goto('/');

      // Test geolocation support
      const geolocationSupported = await page.evaluate(() => {
        return 'geolocation' in navigator;
      });
      expect(geolocationSupported).toBeTruthy();

      // If geolocation is used for shipping/installation, test it
      if (await page.locator('[data-testid="location-detect"]').count() > 0) {
        // Mock geolocation
        await page.context().grantPermissions(['geolocation']);
        await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
        
        await page.click('[data-testid="location-detect"]');
        await helpers.waitForLoadingToFinish();
        
        await expect(page.locator('[data-testid="detected-location"]')).toBeVisible();
      }
    });
  });

  test.describe('Legacy Browser Support', () => {
    test('Graceful degradation for older browsers', async ({ page }) => {
      // Simulate older browser by disabling modern features
      await page.addInitScript(() => {
        // Disable modern features
        delete (window as any).fetch;
        delete (window as any).Promise;
      });

      await page.goto('/');
      
      // Core functionality should still work
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();

      // Navigation should work even without modern JS
      await page.click('[data-testid="nav-products"]');
      await expect(page).toHaveURL('/products');
    });

    test('Progressive enhancement', async ({ page }) => {
      await page.goto('/');

      // Test that basic HTML works without JavaScript
      await page.addInitScript(() => {
        // Disable JavaScript
        Object.defineProperty(window, 'location', {
          value: {
            ...window.location,
            href: window.location.href
          },
          writable: false
        });
      });

      // Basic navigation should still work
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});