import { test, expect } from '@playwright/test';

test.describe('Array Argument', () => {
    test('should accept array of EnhancementConfigs', async ({ page }) => {
        await page.goto('/tests/test-array-argument.html');
        await page.waitForFunction(() => window.testComplete === true, { timeout: 5000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Test 1: Array with spawn
        expect(results.test1.enhancement1Spawned).toBe(true);
        expect(results.test1.enhancement2Spawned).toBe(true);
        
        // Test 2: Array with withAttrs
        expect(results.test2.withAttrsMounted).toBe(true);
    });
});
