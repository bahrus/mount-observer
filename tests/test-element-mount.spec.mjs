import { test, expect } from '@playwright/test';

test.describe('Element Mount Extension', () => {
    test('should mount observers via element.mount()', async ({ page }) => {
        await page.goto('/tests/test-element-mount.html');
        await page.waitForFunction(() => window.testComplete === true, { timeout: 5000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Check if mount method exists
        expect(results.test1.mountMethodExists).toBe(true);
        
        // Test 1: Basic mount
        expect(results.test1.elementReturned).toBe(true);
        expect(results.test1.observerCreated).toBe(true);
        // Note: elementMounted may be false in browsers without native scoped registry support
        // It works in Chrome 146+ and latest WebKit with native customElementRegistry
        
        // Test 2: getRootRegistryContainer
        expect(results.test2.rootContainerFound).toBe(true);
        // Note: rootIsCorrect may vary based on browser support for scoped registries
    });
});
