import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Accessibility Testing (WCAG 2.1 Compliance)', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Keyboard Navigation', () => {
    test('Homepage keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation through all interactive elements
      let tabIndex = 0;
      const maxTabs = 50; // Prevent infinite loops
      
      while (tabIndex < maxTabs) {
        await page.keyboard.press('Tab');
        tabIndex++;
        
        const focusedElement = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            tagName: element?.tagName,
            type: element?.getAttribute('type'),
            role: element?.getAttribute('role'),
            ariaLabel: element?.getAttribute('aria-label'),
            textContent: element?.textContent?.substring(0, 50)
          };
        });
        
        // Skip non-interactive elements
        if (!focusedElement.tagName) break;
        
        // Verify focusable elements have proper indicators
        const focusVisible = await page.evaluate(() => {
          const element = document.activeElement;
          const styles = window.getComputedStyle(element!);
          return styles.outline !== 'none' || styles.boxShadow !== 'none';
        });
        
        if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focusedElement.tagName)) {
          expect(focusVisible).toBeTruthy();
        }
      }
    });

    test('Product configurator keyboard navigation', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Test keyboard navigation through configuration steps
      await page.keyboard.press('Tab');
      
      // Width input should be focusable
      let focusedElement = await page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', 'width-input');
      
      // Arrow keys should work in number inputs
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      
      // Tab to height input
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      
      // Enter should activate buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', 'next-step');
      
      await page.keyboard.press('Enter');
      
      // Should advance to next step
      await expect(page.locator('[data-testid="step-title"]')).toContainText('Colors');
    });

    test('Shopping cart keyboard accessibility', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      await helpers.completeBasicProductConfiguration();
      await helpers.addToCart();
      await page.goto('/cart');
      
      // Test keyboard navigation in cart
      await page.keyboard.press('Tab');
      
      // Quantity controls should be keyboard accessible
      const quantityIncrease = page.locator('[data-testid="quantity-increase"]');
      await quantityIncrease.focus();
      await page.keyboard.press('Enter');
      
      // Verify quantity changed
      const quantity = await page.locator('[data-testid="quantity"]').inputValue();
      expect(parseInt(quantity)).toBeGreaterThan(1);
      
      // Remove button should be accessible
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const removeButton = page.locator('[data-testid="remove-item"]');
      await expect(removeButton).toBeFocused();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('Semantic HTML structure', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = await Promise.all(
        headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
      );
      
      // Should start with h1
      expect(headingLevels[0]).toBe(1);
      
      // Check for proper landmarks
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Check for proper form labels
      const inputs = await page.locator('input[type="email"], input[type="password"], input[type="text"]').all();
      for (const input of inputs) {
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !!(ariaLabel || ariaLabelledBy || label);
        });
        
        expect(hasLabel).toBeTruthy();
      }
    });

    test('ARIA attributes and roles', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Check for proper ARIA attributes
      const colorOptions = await page.locator('[data-testid="color-option"]').all();
      for (const option of colorOptions) {
        const ariaLabel = await option.getAttribute('aria-label');
        const role = await option.getAttribute('role');
        
        expect(ariaLabel || role).toBeTruthy();
      }
      
      // Check for progress indicator
      const progressBar = page.locator('[role="progressbar"]');
      if (await progressBar.count() > 0) {
        await expect(progressBar).toHaveAttribute('aria-valuenow');
        await expect(progressBar).toHaveAttribute('aria-valuemin');
        await expect(progressBar).toHaveAttribute('aria-valuemax');
      }
      
      // Check for form validation messages
      await page.fill('[data-testid="width-input"]', '-1');
      await page.click('[data-testid="next-step"]');
      
      const errorMessage = page.locator('[role="alert"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        const ariaLive = await errorMessage.getAttribute('aria-live');
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    });

    test('Dynamic content announcements', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Test that dynamic price updates are announced
      await helpers.fillFractionInput('[data-testid="width-input"]', 48, '1/2');
      
      // Price should update and be announced
      const priceElement = page.locator('[data-testid="current-price"]');
      await expect(priceElement).toHaveAttribute('aria-live', 'polite');
      
      // Test that configuration steps are announced
      await page.click('[data-testid="next-step"]');
      
      const stepTitle = page.locator('[data-testid="step-title"]');
      await expect(stepTitle).toHaveAttribute('role', 'heading');
      await expect(stepTitle).toHaveAttribute('aria-level', '2');
    });
  });

  test.describe('Visual Accessibility', () => {
    test('Color contrast compliance', async ({ page }) => {
      await page.goto('/');
      
      // Check color contrast ratios
      const contrastIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const issues: any[] = [];
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Simple contrast check (would need proper contrast calculation in real implementation)
          if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)') {
            issues.push({
              element: el.tagName,
              issue: 'White text on white background'
            });
          }
          
          if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)') {
            issues.push({
              element: el.tagName,
              issue: 'Black text on black background'
            });
          }
        });
        
        return issues;
      });
      
      expect(contrastIssues.length).toBe(0);
    });

    test('Font size and scaling', async ({ page }) => {
      await page.goto('/');
      
      // Test with 200% zoom (WCAG requirement)
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      
      await page.waitForTimeout(1000);
      
      // Navigation should still be usable
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      
      // Text should not overlap
      const textOverlap = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div');
        let hasOverlap = false;
        
        for (let i = 0; i < elements.length - 1; i++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[i + 1].getBoundingClientRect();
          
          if (rect1.bottom > rect2.top && rect1.top < rect2.bottom &&
              rect1.right > rect2.left && rect1.left < rect2.right) {
            hasOverlap = true;
            break;
          }
        }
        
        return hasOverlap;
      });
      
      expect(textOverlap).toBeFalsy();
    });

    test('High contrast mode support', async ({ page }) => {
      await page.goto('/');
      
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background: black !important;
              color: white !important;
              border-color: white !important;
            }
          }
        `
      });
      
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      // Elements should still be visible and functional
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    });
  });

  test.describe('Motor Disabilities Support', () => {
    test('Large click targets', async ({ page }) => {
      await page.goto('/products');
      
      // Check that interactive elements meet minimum size requirements (44px)
      const clickTargets = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
      
      for (const target of clickTargets) {
        const boundingBox = await target.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('Drag and drop alternatives', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // If there are any drag/drop interfaces, they should have keyboard alternatives
      const draggableElements = await page.locator('[draggable="true"]').all();
      
      for (const element of draggableElements) {
        // Should have keyboard alternative
        const hasKeyboardAlternative = await element.evaluate(el => {
          const ariaGrabbed = el.getAttribute('aria-grabbed');
          const ariaDropeffect = el.getAttribute('aria-dropeffect');
          const role = el.getAttribute('role');
          
          return !!(ariaGrabbed || ariaDropeffect || role);
        });
        
        expect(hasKeyboardAlternative).toBeTruthy();
      }
    });

    test('Timeout warnings and extensions', async ({ page }) => {
      await helpers.loginAs('customer');
      
      // Check for session timeout warnings
      // Simulate long idle time
      await page.waitForTimeout(5000);
      
      // Should not automatically log out without warning
      await page.goto('/account');
      await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Cognitive Disabilities Support', () => {
    test('Clear navigation and breadcrumbs', async ({ page }) => {
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Should have clear breadcrumbs
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      if (await breadcrumbs.count() > 0) {
        await expect(breadcrumbs).toBeVisible();
        await expect(breadcrumbs).toHaveAttribute('aria-label', 'Breadcrumb');
      }
      
      // Should have clear step indicators
      const stepIndicator = page.locator('[data-testid="step-indicator"]');
      if (await stepIndicator.count() > 0) {
        await expect(stepIndicator).toBeVisible();
        
        const currentStep = await stepIndicator.locator('[aria-current="step"]').count();
        expect(currentStep).toBe(1);
      }
    });

    test('Error prevention and recovery', async ({ page }) => {
      await page.goto('/register');
      
      // Test form validation
      await page.fill('[data-testid="email"]', 'invalid-email');
      await page.fill('[data-testid="password"]', '123');
      await page.click('[data-testid="register-button"]');
      
      // Should provide clear, specific error messages
      const emailError = page.locator('[data-testid="email-error"]');
      await expect(emailError).toBeVisible();
      await expect(emailError).toContainText('valid email');
      
      const passwordError = page.locator('[data-testid="password-error"]');
      await expect(passwordError).toBeVisible();
      await expect(passwordError).toContainText(/characters|length|strength/i);
      
      // Errors should be associated with fields
      const emailField = page.locator('[data-testid="email"]');
      const ariaDescribedBy = await emailField.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
    });

    test('Consistent navigation and layout', async ({ page }) => {
      const pages = ['/', '/products', '/account'];
      let previousNavigation: any = null;
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        const navigation = await page.locator('[data-testid="navigation"]').evaluate(nav => {
          const links = Array.from(nav.querySelectorAll('a'));
          return links.map(link => ({
            text: link.textContent?.trim(),
            href: link.getAttribute('href')
          }));
        });
        
        if (previousNavigation) {
          // Navigation should be consistent across pages
          expect(navigation.length).toBeGreaterThan(0);
          // At least some navigation items should be the same
          const commonItems = navigation.filter(item => 
            previousNavigation.some((prevItem: any) => prevItem.text === item.text)
          );
          expect(commonItems.length).toBeGreaterThan(0);
        }
        
        previousNavigation = navigation;
      }
    });
  });

  test.describe('Multi-language and Internationalization', () => {
    test('Language switching accessibility', async ({ page }) => {
      await page.goto('/');
      
      // Check for language switcher
      const languageSwitcher = page.locator('[data-testid="language-switcher"]');
      if (await languageSwitcher.count() > 0) {
        await expect(languageSwitcher).toHaveAttribute('aria-label');
        
        // Should be keyboard accessible
        await languageSwitcher.focus();
        await page.keyboard.press('Enter');
        
        // Should show language options
        const languageOptions = page.locator('[data-testid="language-option"]');
        await expect(languageOptions.first()).toBeVisible();
      }
    });

    test('Right-to-left (RTL) text support', async ({ page }) => {
      await page.goto('/');
      
      // Test RTL support by setting Arabic language
      await page.evaluate(() => {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      });
      
      await page.waitForTimeout(1000);
      
      // Layout should adapt to RTL
      const navigation = page.locator('[data-testid="navigation"]');
      const textAlign = await navigation.evaluate(el => 
        window.getComputedStyle(el).textAlign
      );
      
      // Should use RTL-appropriate alignment
      expect(['right', 'start']).toContain(textAlign);
    });
  });

  test.describe('Assistive Technology Support', () => {
    test('Screen reader announcements for dynamic content', async ({ page }) => {
      await helpers.loginAs('customer');
      await helpers.navigateToProductConfiguration('premium-roller-shade');
      
      // Check for live regions
      const liveRegions = await page.locator('[aria-live]').all();
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Price updates should be announced
      await helpers.fillFractionInput('[data-testid="width-input"]', 60, '0');
      
      const priceRegion = page.locator('[data-testid="current-price"]');
      const ariaLive = await priceRegion.getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    });

    test('Focus management for modals and overlays', async ({ page }) => {
      await page.goto('/products');
      
      // Open product details modal
      await page.click('[data-testid="product-card"]:first-child');
      
      // Focus should move to modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.count() > 0) {
        await expect(modal).toBeFocused();
        
        // Modal should trap focus
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        const isWithinModal = await focusedElement.evaluate(el => {
          const modal = el.closest('[role="dialog"]');
          return !!modal;
        });
        
        expect(isWithinModal).toBeTruthy();
        
        // Escape should close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });

    test('Voice control compatibility', async ({ page }) => {
      await page.goto('/');
      
      // Elements should have accessible names for voice control
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const accessibleName = await button.evaluate(el => {
          const ariaLabel = el.getAttribute('aria-label');
          const textContent = el.textContent?.trim();
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          
          return ariaLabel || textContent || ariaLabelledBy;
        });
        
        expect(accessibleName).toBeTruthy();
        expect(accessibleName?.length).toBeGreaterThan(0);
      }
    });
  });
});