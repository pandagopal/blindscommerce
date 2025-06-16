import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Load Testing and Stress Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Concurrent User Load Testing', () => {
    test('Simulate 10 concurrent users browsing products', async ({ context }) => {
      const userCount = 10;
      const loadTestDuration = 60000; // 1 minute
      const startTime = Date.now();

      console.log(`🚀 Starting load test with ${userCount} concurrent users for ${loadTestDuration/1000} seconds`);

      // Create multiple browser contexts to simulate different users
      const contexts = await Promise.all(
        Array.from({ length: userCount }, () => context.browser()?.newContext())
      );

      const pages = await Promise.all(
        contexts.map(ctx => ctx?.newPage()).filter(Boolean)
      );

      // Track performance metrics
      const performanceMetrics: any[] = [];
      const errors: any[] = [];

      // Simulate realistic user behavior patterns
      const userBehaviors = [
        'browser', 'configurator', 'shopper', 'researcher', 'comparison'
      ];

      const userActivities = pages.map(async (page, index) => {
        if (!page) return;

        const helper = new TestHelpers(page);
        const behavior = userBehaviors[index % userBehaviors.length];
        const userStartTime = Date.now();

        try {
          switch (behavior) {
            case 'browser':
              await simulateBrowsingBehavior(page, helper, loadTestDuration);
              break;
            case 'configurator':
              await simulateConfiguratorUser(page, helper, loadTestDuration);
              break;
            case 'shopper':
              await simulateShoppingBehavior(page, helper, loadTestDuration);
              break;
            case 'researcher':
              await simulateResearchBehavior(page, helper, loadTestDuration);
              break;
            case 'comparison':
              await simulateComparisonShopping(page, helper, loadTestDuration);
              break;
          }

          const userEndTime = Date.now();
          performanceMetrics.push({
            userId: index,
            behavior,
            duration: userEndTime - userStartTime,
            success: true
          });

        } catch (error) {
          errors.push({
            userId: index,
            behavior,
            error: error.message,
            timestamp: Date.now()
          });
        }
      });

      // Wait for all user activities to complete
      await Promise.allSettled(userActivities);

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Analyze results
      const successfulUsers = performanceMetrics.length;
      const failedUsers = errors.length;
      const successRate = (successfulUsers / userCount) * 100;

      console.log(`📊 Load Test Results:`);
      console.log(`   Total Duration: ${totalDuration}ms`);
      console.log(`   Successful Users: ${successfulUsers}/${userCount} (${successRate.toFixed(1)}%)`);
      console.log(`   Failed Users: ${failedUsers}`);
      console.log(`   Average User Session: ${performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulUsers}ms`);

      // Assert performance criteria
      expect(successRate).toBeGreaterThan(90); // 90% success rate
      expect(totalDuration).toBeLessThan(loadTestDuration + 10000); // Within 10s of expected
      expect(errors.length).toBeLessThan(userCount * 0.1); // Less than 10% errors

      // Cleanup
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });

    test('API load testing with concurrent requests', async ({ request }) => {
      const concurrentRequests = 20;
      const requestsPerUser = 5;
      const totalRequests = concurrentRequests * requestsPerUser;

      console.log(`🔄 Starting API load test: ${concurrentRequests} concurrent users, ${requestsPerUser} requests each`);

      const startTime = Date.now();
      const responses: any[] = [];
      const errors: any[] = [];

      // Create concurrent API request batches
      const requestBatches = Array.from({ length: concurrentRequests }, async (_, userIndex) => {
        const userRequests = [];

        for (let i = 0; i < requestsPerUser; i++) {
          const requestStart = Date.now();
          
          try {
            const response = await request.get(`${process.env.API_BASE_URL}/products?page=${i + 1}&limit=10`);
            const requestEnd = Date.now();
            
            responses.push({
              userIndex,
              requestIndex: i,
              status: response.status(),
              responseTime: requestEnd - requestStart,
              success: response.ok()
            });
          } catch (error) {
            errors.push({
              userIndex,
              requestIndex: i,
              error: error.message,
              timestamp: Date.now()
            });
          }
        }

        return userRequests;
      });

      await Promise.allSettled(requestBatches);
      const endTime = Date.now();

      // Analyze API performance
      const totalDuration = endTime - startTime;
      const successfulRequests = responses.filter(r => r.success).length;
      const averageResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
      const maxResponseTime = Math.max(...responses.map(r => r.responseTime));
      const minResponseTime = Math.min(...responses.map(r => r.responseTime));

      console.log(`📈 API Load Test Results:`);
      console.log(`   Total Requests: ${totalRequests}`);
      console.log(`   Successful: ${successfulRequests} (${(successfulRequests/totalRequests*100).toFixed(1)}%)`);
      console.log(`   Failed: ${errors.length}`);
      console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`   Min/Max Response Time: ${minResponseTime}ms / ${maxResponseTime}ms`);
      console.log(`   Total Duration: ${totalDuration}ms`);

      // Performance assertions
      expect(successfulRequests / totalRequests).toBeGreaterThan(0.95); // 95% success rate
      expect(averageResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(5000); // Max under 5 seconds
    });
  });

  test.describe('Database Load Testing', () => {
    test('Heavy product search load testing', async ({ page }) => {
      const searchTerms = [
        'roller', 'cellular', 'motorized', 'blackout', 'cordless',
        'white', 'gray', 'beige', 'custom', 'premium', 'smart',
        'energy efficient', 'room darkening', 'light filtering'
      ];

      const searchIterations = 50;
      const searchResults: any[] = [];

      console.log(`🔍 Starting search load test: ${searchIterations} searches`);

      await page.goto('/products');
      await helpers.waitForLoadingToFinish();

      for (let i = 0; i < searchIterations; i++) {
        const searchTerm = searchTerms[i % searchTerms.length];
        const searchStart = Date.now();

        try {
          await page.fill('[data-testid="search-input"]', searchTerm);
          await page.click('[data-testid="search-button"]');
          
          await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
          
          const resultCount = await page.locator('[data-testid="product-card"]').count();
          const searchEnd = Date.now();

          searchResults.push({
            iteration: i,
            searchTerm,
            resultCount,
            responseTime: searchEnd - searchStart,
            success: true
          });

          // Clear search for next iteration
          await page.fill('[data-testid="search-input"]', '');
          
          // Brief pause to simulate realistic user behavior
          await page.waitForTimeout(Math.random() * 1000 + 500);

        } catch (error) {
          searchResults.push({
            iteration: i,
            searchTerm,
            error: error.message,
            success: false
          });
        }
      }

      // Analyze search performance
      const successfulSearches = searchResults.filter(r => r.success);
      const averageResponseTime = successfulSearches.reduce((sum, r) => sum + r.responseTime, 0) / successfulSearches.length;
      const maxResponseTime = Math.max(...successfulSearches.map(r => r.responseTime));

      console.log(`📊 Search Load Test Results:`);
      console.log(`   Total Searches: ${searchIterations}`);
      console.log(`   Successful: ${successfulSearches.length} (${(successfulSearches.length/searchIterations*100).toFixed(1)}%)`);
      console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`   Max Response Time: ${maxResponseTime}ms`);

      expect(successfulSearches.length / searchIterations).toBeGreaterThan(0.95);
      expect(averageResponseTime).toBeLessThan(3000);
    });

    test('Cart operations stress testing', async ({ page }) => {
      await helpers.loginAs('customer');

      const operationCount = 30;
      const operations = ['add', 'update', 'remove'];
      const operationResults: any[] = [];

      console.log(`🛒 Starting cart stress test: ${operationCount} operations`);

      // First, add some base items to cart
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();

      await page.goto('/cart');
      await helpers.waitForLoadingToFinish();

      for (let i = 0; i < operationCount; i++) {
        const operation = operations[i % operations.length];
        const operationStart = Date.now();

        try {
          switch (operation) {
            case 'add':
              // Navigate back and add another item
              await page.goto('/products');
              await page.click('[data-testid="product-card"]:first-child');
              await page.click('[data-testid="configure-button"]');
              await helpers.completeBasicProductConfiguration();
              await helpers.addToCart();
              break;

            case 'update':
              await page.goto('/cart');
              const cartItems = await page.locator('[data-testid="cart-item"]').count();
              if (cartItems > 0) {
                await page.click('[data-testid="quantity-increase"]');
                await page.waitForSelector('[data-testid="cart-total"]');
              }
              break;

            case 'remove':
              await page.goto('/cart');
              const itemsToRemove = await page.locator('[data-testid="cart-item"]').count();
              if (itemsToRemove > 1) {
                await page.click('[data-testid="cart-item"]:last-child [data-testid="remove-item"]');
                await page.click('[data-testid="confirm-remove"]');
              }
              break;
          }

          const operationEnd = Date.now();
          operationResults.push({
            iteration: i,
            operation,
            responseTime: operationEnd - operationStart,
            success: true
          });

        } catch (error) {
          operationResults.push({
            iteration: i,
            operation,
            error: error.message,
            success: false
          });
        }

        // Brief pause between operations
        await page.waitForTimeout(200);
      }

      // Analyze cart performance
      const successfulOps = operationResults.filter(r => r.success);
      const averageResponseTime = successfulOps.reduce((sum, r) => sum + r.responseTime, 0) / successfulOps.length;

      console.log(`📊 Cart Stress Test Results:`);
      console.log(`   Total Operations: ${operationCount}`);
      console.log(`   Successful: ${successfulOps.length} (${(successfulOps.length/operationCount*100).toFixed(1)}%)`);
      console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);

      expect(successfulOps.length / operationCount).toBeGreaterThan(0.90);
      expect(averageResponseTime).toBeLessThan(4000);
    });
  });

  test.describe('Memory and Resource Stress Testing', () => {
    test('Extended session memory leak testing', async ({ page }) => {
      const sessionDuration = 120000; // 2 minutes
      const actionInterval = 5000; // 5 seconds
      const memorySnapshots: any[] = [];

      console.log(`🧠 Starting memory leak test: ${sessionDuration/1000} seconds`);

      await page.goto('/');
      
      // Take initial memory snapshot
      let initialMemory = await getMemoryUsage(page);
      memorySnapshots.push({ timestamp: Date.now(), memory: initialMemory, action: 'initial' });

      const actions = [
        () => page.goto('/products'),
        () => page.goto('/'),
        () => helpers.navigateToProductConfiguration('premium-roller-shade'),
        () => page.goto('/cart'),
        () => page.goto('/account'),
        () => page.goto('/products'),
        () => page.click('[data-testid="search-input"]'),
        () => page.fill('[data-testid="search-input"]', 'roller'),
        () => page.click('[data-testid="search-button"]'),
        () => page.goto('/')
      ];

      const startTime = Date.now();
      let actionIndex = 0;

      while (Date.now() - startTime < sessionDuration) {
        try {
          const action = actions[actionIndex % actions.length];
          await action();
          await helpers.waitForLoadingToFinish();
          
          // Take memory snapshot
          const currentMemory = await getMemoryUsage(page);
          memorySnapshots.push({
            timestamp: Date.now(),
            memory: currentMemory,
            action: `action_${actionIndex}`
          });

          actionIndex++;
          await page.waitForTimeout(actionInterval);

        } catch (error) {
          console.log(`Action ${actionIndex} failed:`, error.message);
        }
      }

      // Analyze memory usage
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const increasePercentage = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

      console.log(`📊 Memory Leak Test Results:`);
      console.log(`   Initial Memory: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Final Memory: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${increasePercentage.toFixed(1)}%)`);
      console.log(`   Actions Performed: ${actionIndex}`);

      // Memory increase should be reasonable (less than 300% over 2 minutes)
      expect(increasePercentage).toBeLessThan(300);
    });

    test('Resource exhaustion testing', async ({ context }) => {
      const tabCount = 5;
      const operationsPerTab = 10;

      console.log(`📱 Starting resource exhaustion test: ${tabCount} tabs, ${operationsPerTab} operations each`);

      const pages = await Promise.all(
        Array.from({ length: tabCount }, () => context.newPage())
      );

      const tabActivities = pages.map(async (page, tabIndex) => {
        const helper = new TestHelpers(page);
        const tabResults: any[] = [];

        try {
          for (let i = 0; i < operationsPerTab; i++) {
            const operationStart = Date.now();

            // Perform resource-intensive operations
            await page.goto('/products');
            await page.waitForLoadState('networkidle');
            
            // Load images and interact with elements
            await page.hover('[data-testid="product-card"]:first-child');
            await page.click('[data-testid="product-card"]:first-child');
            
            // Configure product (resource intensive)
            if (await page.locator('[data-testid="configure-button"]').isVisible()) {
              await page.click('[data-testid="configure-button"]');
              await helper.waitForLoadingToFinish();
              
              // Fill in some configuration
              await helper.fillFractionInput('[data-testid="width-input"]', 48, '1/2');
              await page.click('[data-testid="next-step"]');
            }

            const operationEnd = Date.now();
            tabResults.push({
              tabIndex,
              operation: i,
              responseTime: operationEnd - operationStart,
              success: true
            });

            // Brief pause
            await page.waitForTimeout(1000);
          }
        } catch (error) {
          tabResults.push({
            tabIndex,
            error: error.message,
            success: false
          });
        }

        return tabResults;
      });

      const allResults = await Promise.allSettled(tabActivities);
      const successfulTabs = allResults.filter(result => result.status === 'fulfilled').length;

      console.log(`📊 Resource Exhaustion Test Results:`);
      console.log(`   Successful Tabs: ${successfulTabs}/${tabCount}`);
      console.log(`   Total Operations: ${successfulTabs * operationsPerTab}`);

      expect(successfulTabs / tabCount).toBeGreaterThan(0.8); // 80% of tabs should succeed

      // Cleanup
      await Promise.all(pages.map(page => page.close()));
    });
  });

  test.describe('Network Stress Testing', () => {
    test('Slow network performance testing', async ({ page, context }) => {
      console.log(`🐌 Starting slow network performance test`);

      // Simulate slow 3G connection
      const client = await context.newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 300 // 300ms latency
      });

      const slowNetworkResults: any[] = [];

      const testPages = [
        { path: '/', name: 'Homepage' },
        { path: '/products', name: 'Product Catalog' },
        { path: '/products/configure/premium-roller-shade', name: 'Product Configurator' }
      ];

      for (const testPage of testPages) {
        const loadStart = Date.now();
        
        try {
          await page.goto(testPage.path);
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          
          const loadEnd = Date.now();
          slowNetworkResults.push({
            page: testPage.name,
            loadTime: loadEnd - loadStart,
            success: true
          });

        } catch (error) {
          slowNetworkResults.push({
            page: testPage.name,
            error: error.message,
            success: false
          });
        }
      }

      const avgLoadTime = slowNetworkResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.loadTime, 0) / slowNetworkResults.filter(r => r.success).length;

      console.log(`📊 Slow Network Test Results:`);
      slowNetworkResults.forEach(result => {
        if (result.success) {
          console.log(`   ${result.page}: ${result.loadTime}ms`);
        } else {
          console.log(`   ${result.page}: FAILED - ${result.error}`);
        }
      });
      console.log(`   Average Load Time: ${avgLoadTime.toFixed(2)}ms`);

      // On slow network, pages should still load within reasonable time
      expect(avgLoadTime).toBeLessThan(15000); // 15 seconds average
    });
  });
});

// Helper function to get memory usage
async function getMemoryUsage(page: any) {
  return await page.evaluate(() => {
    return (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  });
}

// Simulate different user behaviors for load testing
async function simulateBrowsingBehavior(page: any, helper: TestHelpers, duration: number) {
  const endTime = Date.now() + duration;
  
  while (Date.now() < endTime) {
    await page.goto('/products');
    await helper.waitForLoadingToFinish();
    
    // Browse different product categories
    const categories = ['roller-shades', 'cellular-shades', 'smart-blinds'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    await page.click(`[data-testid="category-${category}"]`);
    await helper.waitForLoadingToFinish();
    
    // View some products
    const productCount = await page.locator('[data-testid="product-card"]').count();
    if (productCount > 0) {
      const randomProduct = Math.floor(Math.random() * Math.min(productCount, 3));
      await page.click(`[data-testid="product-card"]:nth-child(${randomProduct + 1})`);
      await helper.waitForLoadingToFinish();
    }
    
    await page.waitForTimeout(2000 + Math.random() * 3000); // Random pause
  }
}

async function simulateConfiguratorUser(page: any, helper: TestHelpers, duration: number) {
  const endTime = Date.now() + duration;
  
  while (Date.now() < endTime) {
    await helper.navigateToProductConfiguration('premium-roller-shade');
    
    // Complete partial configuration
    await helper.fillFractionInput('[data-testid="width-input"]', 36 + Math.random() * 48, '1/4');
    await helper.fillFractionInput('[data-testid="height-input"]', 48 + Math.random() * 48, '1/2');
    await page.click('[data-testid="next-step"]');
    
    await page.click('[data-testid="color-option"]:first-child');
    await page.click('[data-testid="next-step"]');
    
    await page.waitForTimeout(3000 + Math.random() * 5000);
  }
}

async function simulateShoppingBehavior(page: any, helper: TestHelpers, duration: number) {
  const endTime = Date.now() + duration;
  
  await helper.loginAs('customer');
  
  while (Date.now() < endTime) {
    // Add items to cart
    await helper.navigateToProductConfiguration('premium-roller-shade');
    await helper.completeBasicProductConfiguration();
    await helper.addToCart();
    
    // Check cart
    await page.goto('/cart');
    await helper.waitForLoadingToFinish();
    
    // Maybe remove an item
    if (Math.random() > 0.7) {
      const cartItems = await page.locator('[data-testid="cart-item"]').count();
      if (cartItems > 1) {
        await page.click('[data-testid="cart-item"]:last-child [data-testid="remove-item"]');
        await page.click('[data-testid="confirm-remove"]');
      }
    }
    
    await page.waitForTimeout(2000 + Math.random() * 4000);
  }
}

async function simulateResearchBehavior(page: any, helper: TestHelpers, duration: number) {
  const endTime = Date.now() + duration;
  const searchTerms = ['roller shade', 'cellular', 'motorized', 'blackout', 'energy efficient'];
  
  while (Date.now() < endTime) {
    await page.goto('/products');
    
    // Perform searches
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    await page.fill('[data-testid="search-input"]', searchTerm);
    await page.click('[data-testid="search-button"]');
    await helper.waitForLoadingToFinish();
    
    // View search results
    const resultCount = await page.locator('[data-testid="product-card"]').count();
    if (resultCount > 0) {
      const randomResult = Math.floor(Math.random() * Math.min(resultCount, 2));
      await page.click(`[data-testid="product-card"]:nth-child(${randomResult + 1})`);
      await helper.waitForLoadingToFinish();
    }
    
    await page.waitForTimeout(3000 + Math.random() * 5000);
  }
}

async function simulateComparisonShopping(page: any, helper: TestHelpers, duration: number) {
  const endTime = Date.now() + duration;
  
  while (Date.now() < endTime) {
    await page.goto('/products');
    await helper.waitForLoadingToFinish();
    
    // Compare multiple products
    const productCount = await page.locator('[data-testid="product-card"]').count();
    const productsToCompare = Math.min(3, productCount);
    
    for (let i = 0; i < productsToCompare; i++) {
      await page.click(`[data-testid="product-card"]:nth-child(${i + 1})`);
      await helper.waitForLoadingToFinish();
      
      // Check product details
      await page.waitForTimeout(2000);
      
      // Go back to compare more
      await page.goBack();
      await helper.waitForLoadingToFinish();
    }
    
    await page.waitForTimeout(4000 + Math.random() * 6000);
  }
}