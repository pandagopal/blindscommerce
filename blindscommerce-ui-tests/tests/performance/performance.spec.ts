import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Performance and Load Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Page Load Performance', () => {
    test('Homepage loading performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Homepage should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};

            entries.forEach((entry: any) => {
              if (entry.name === 'FCP') vitals.fcp = entry.value;
              if (entry.name === 'LCP') vitals.lcp = entry.value;
              if (entry.name === 'FID') vitals.fid = entry.value;
              if (entry.name === 'CLS') vitals.cls = entry.value;
            });

            if (Object.keys(vitals).length > 0) {
              resolve(vitals);
            }
          });

          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });

      console.log('Web Vitals:', webVitals);

      // Verify critical elements are visible
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="coming-soon"]')).toBeVisible();
    });

    test('Product catalog loading performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/products');
      await helpers.waitForLoadingToFinish();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Product catalog should load within 4 seconds
      expect(loadTime).toBeLessThan(4000);

      // Verify products are loaded
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);

      // Check if images are loaded
      const productImages = page.locator('[data-testid="product-image"]');
      const imageCount = await productImages.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = productImages.nth(i);
        await expect(image).toHaveAttribute('src', /.+/);
      }
    });

    test('Product configurator performance', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      const startTime = Date.now();
      
      // Test step transitions
      await helpers.fillFractionInput('[data-testid="width-input"]', 48, '1/2');
      await helpers.fillFractionInput('[data-testid="height-input"]', 72, '0');
      
      const dimensionTime = Date.now();
      await page.click('[data-testid="next-step"]');
      
      await page.waitForSelector('[data-testid="color-options"]');
      const colorStepTime = Date.now();
      
      // Each step should load within 1 second
      expect(colorStepTime - dimensionTime).toBeLessThan(1000);

      // Test price calculation speed
      const priceStartTime = Date.now();
      await page.click('[data-testid="color-option"]:first-child');
      
      await page.waitForFunction(() => {
        const priceElement = document.querySelector('[data-testid="current-price"]');
        return priceElement && priceElement.textContent && priceElement.textContent.includes('$');
      });
      
      const priceEndTime = Date.now();
      const priceCalculationTime = priceEndTime - priceStartTime;
      
      // Price calculation should be near-instant
      expect(priceCalculationTime).toBeLessThan(500);
    });

    test('Dashboard loading performance by role', async ({ page }) => {
      const roles = ['admin', 'vendor', 'customer', 'sales', 'installer'];
      
      for (const role of roles) {
        await helpers.loginAs(role as any);
        
        const startTime = Date.now();
        await page.goto(`/${role === 'customer' ? 'account' : role}`);
        await helpers.waitForLoadingToFinish();
        const endTime = Date.now();
        
        const loadTime = endTime - startTime;
        expect(loadTime).toBeLessThan(3000);
        
        // Verify dashboard is functional
        await expect(page.locator(`[data-testid="${role}-dashboard"]`)).toBeVisible();
        
        await helpers.logout();
      }
    });
  });

  test.describe('Resource Loading and Optimization', () => {
    test('Image optimization and lazy loading', async ({ page }) => {
      await page.goto('/products');
      
      // Check image formats and compression
      const images = await page.locator('img').all();
      const imageChecks = await Promise.all(
        images.slice(0, 10).map(async (img) => {
          const src = await img.getAttribute('src');
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
          const displayWidth = await img.evaluate((el: HTMLImageElement) => el.clientWidth);
          
          return {
            src,
            naturalWidth,
            displayWidth,
            optimized: naturalWidth <= displayWidth * 2 // Should not be more than 2x display size
          };
        })
      );

      // At least 80% of images should be optimized
      const optimizedCount = imageChecks.filter(check => check.optimized).length;
      const optimizationRate = optimizedCount / imageChecks.length;
      expect(optimizationRate).toBeGreaterThan(0.8);

      // Test lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyImageCount = await lazyImages.count();
      expect(lazyImageCount).toBeGreaterThan(0);
    });

    test('JavaScript bundle size and loading', async ({ page }) => {
      await page.goto('/');
      
      // Monitor network requests
      const jsRequests: any[] = [];
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') && response.status() === 200) {
          jsRequests.push({
            url,
            size: response.headers()['content-length'],
            timing: response.timing()
          });
        }
      });

      await page.waitForLoadState('networkidle');
      
      // Calculate total JS size
      const totalJSSize = jsRequests.reduce((total, req) => {
        return total + (parseInt(req.size) || 0);
      }, 0);

      // Total JS should be under 2MB for initial load
      expect(totalJSSize).toBeLessThan(2 * 1024 * 1024);

      // Check for code splitting
      const chunkFiles = jsRequests.filter(req => 
        req.url.includes('chunk') || req.url.includes('vendor')
      );
      expect(chunkFiles.length).toBeGreaterThan(0);
    });

    test('CSS optimization and critical path', async ({ page }) => {
      await page.goto('/');
      
      // Check for critical CSS
      const criticalCSS = await page.evaluate(() => {
        const styleTags = Array.from(document.querySelectorAll('style'));
        return styleTags.some(style => 
          style.textContent && style.textContent.length > 100
        );
      });
      
      expect(criticalCSS).toBeTruthy();

      // Check for CSS loading performance
      const cssRequests: any[] = [];
      page.on('response', (response) => {
        if (response.url().includes('.css') && response.status() === 200) {
          cssRequests.push(response);
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // CSS files should load quickly
      for (const cssRequest of cssRequests) {
        const timing = cssRequest.timing();
        expect(timing.responseEnd - timing.requestStart).toBeLessThan(1000);
      }
    });
  });

  test.describe('Database and API Performance', () => {
    test('Product search performance', async ({ page }) => {
      await page.goto('/products');
      
      const searchTerms = ['roller', 'cellular', 'motorized', 'blackout', 'custom'];
      
      for (const term of searchTerms) {
        const startTime = Date.now();
        
        await page.fill('[data-testid="search-input"]', term);
        await page.click('[data-testid="search-button"]');
        
        await helpers.waitForLoadingToFinish();
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        // Search should complete within 2 seconds
        expect(searchTime).toBeLessThan(2000);
        
        // Verify results are displayed
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
        
        // Clear search for next iteration
        await page.fill('[data-testid="search-input"]', '');
      }
    });

    test('Cart operations performance', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      
      // Test add to cart performance
      const addStartTime = Date.now();
      await helpers.addToCart();
      const addEndTime = Date.now();
      
      expect(addEndTime - addStartTime).toBeLessThan(3000);
      
      // Test cart loading performance
      const cartStartTime = Date.now();
      await page.goto('/cart');
      await helpers.waitForLoadingToFinish();
      const cartEndTime = Date.now();
      
      expect(cartEndTime - cartStartTime).toBeLessThan(2000);
      
      // Test quantity update performance
      const updateStartTime = Date.now();
      await page.click('[data-testid="quantity-increase"]');
      await page.waitForSelector('[data-testid="cart-total"]');
      const updateEndTime = Date.now();
      
      expect(updateEndTime - updateStartTime).toBeLessThan(1000);
    });

    test('Dashboard data loading performance', async ({ page }) => {
      await helpers.loginAs('admin');
      
      const startTime = Date.now();
      await page.goto('/admin');
      
      // Wait for all dashboard widgets to load
      await Promise.all([
        page.waitForSelector('[data-testid="total-users"]'),
        page.waitForSelector('[data-testid="total-vendors"]'),
        page.waitForSelector('[data-testid="total-orders"]'),
        page.waitForSelector('[data-testid="total-revenue"]')
      ]);
      
      const endTime = Date.now();
      const dashboardLoadTime = endTime - startTime;
      
      // Dashboard should load within 4 seconds
      expect(dashboardLoadTime).toBeLessThan(4000);
      
      // Test analytics loading
      const analyticsStartTime = Date.now();
      await page.click('[data-testid="nav-analytics"]');
      await page.waitForSelector('[data-testid="sales-chart"]');
      const analyticsEndTime = Date.now();
      
      expect(analyticsEndTime - analyticsStartTime).toBeLessThan(3000);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('Memory usage during navigation', async ({ page, context }) => {
      // Enable metrics collection
      await context.tracing.start({ screenshots: true, snapshots: true });
      
      await page.goto('/');
      
      const initialMetrics = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : {};
      });

      // Navigate through multiple pages
      const pages = ['/products', '/products/configure/premium-roller-shade', '/cart', '/account'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await helpers.waitForLoadingToFinish();
        await page.waitForTimeout(1000); // Allow GC to run
      }

      const finalMetrics = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : {};
      });

      // Memory usage should not increase dramatically
      if (initialMetrics.usedJSHeapSize && finalMetrics.usedJSHeapSize) {
        const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
        const increasePercentage = (memoryIncrease / initialMetrics.usedJSHeapSize) * 100;
        
        // Memory increase should be less than 200%
        expect(increasePercentage).toBeLessThan(200);
      }

      await context.tracing.stop({ path: 'test-results/memory-trace.zip' });
    });

    test('Long session stability', async ({ page }) => {
      await helpers.loginAs('customer');
      
      // Simulate extended user session
      const actions = [
        () => page.goto('/products'),
        () => page.click('[data-testid="product-card"]:first-child'),
        () => page.goBack(),
        () => page.goto('/account'),
        () => page.goto('/products'),
        () => helpers.navigateToProductConfiguration('premium-roller-shade'),
        () => helpers.completeBasicProductConfiguration(),
        () => page.goto('/cart'),
        () => page.goto('/account')
      ];

      // Repeat actions multiple times
      for (let i = 0; i < 3; i++) {
        for (const action of actions) {
          await action();
          await helpers.waitForLoadingToFinish();
          await page.waitForTimeout(500);
        }
      }

      // Page should still be responsive
      await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
      
      // Test final interaction
      await page.goto('/products');
      await page.fill('[data-testid="search-input"]', 'roller');
      await page.click('[data-testid="search-button"]');
      await helpers.waitForLoadingToFinish();
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });

  test.describe('Mobile Performance', () => {
    test('Mobile page load performance', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Mobile test only on Chromium');
      
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Simulate slow 3G connection
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      
      // Mobile should load within 5 seconds on slow connection
      expect(loadTime).toBeLessThan(5000);

      // Test mobile-specific elements
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    });

    test('Mobile configurator performance', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Mobile test only on Chromium');
      
      await page.setViewportSize({ width: 375, height: 812 });
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Test touch interactions
      const startTime = Date.now();
      
      await page.tap('[data-testid="width-input"] [data-testid="whole-number"]');
      await page.fill('[data-testid="width-input"] [data-testid="whole-number"]', '48');
      
      await page.tap('[data-testid="next-step"]');
      await page.waitForSelector('[data-testid="color-options"]');
      
      const endTime = Date.now();
      const interactionTime = endTime - startTime;
      
      // Mobile interactions should be responsive
      expect(interactionTime).toBeLessThan(2000);

      // Test swipe gestures (if implemented)
      const colorOption = page.locator('[data-testid="color-option"]:first-child');
      await colorOption.tap();
      
      await expect(page.locator('[data-testid="selected-color"]')).toBeVisible();
    });
  });

  test.describe('Concurrent User Performance', () => {
    test('Multiple user sessions', async ({ context }) => {
      // Create multiple browser contexts to simulate different users
      const contexts = await Promise.all([
        context.browser()?.newContext(),
        context.browser()?.newContext(),
        context.browser()?.newContext()
      ]);

      const pages = await Promise.all(
        contexts.map(ctx => ctx?.newPage()).filter(Boolean)
      );

      // Simulate concurrent user activities
      const activities = pages.map(async (page, index) => {
        if (!page) return;
        
        const helper = new TestHelpers(page);
        
        try {
          if (index === 0) {
            // User 1: Browse products
            await page.goto('/products');
            await helper.waitForLoadingToFinish();
            await page.click('[data-testid="product-card"]:first-child');
          } else if (index === 1) {
            // User 2: Configure product
            await helper.navigateToProductConfiguration('premium-roller-shade');
            await helper.completeBasicProductConfiguration();
          } else {
            // User 3: Login and check account
            await helper.loginAs('customer');
            await page.goto('/account');
            await helper.waitForLoadingToFinish();
          }
        } catch (error) {
          console.error(`Error in user ${index + 1} activity:`, error);
        }
      });

      // All activities should complete within reasonable time
      const startTime = Date.now();
      await Promise.all(activities);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds for all concurrent activities

      // Cleanup
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });
  });
});