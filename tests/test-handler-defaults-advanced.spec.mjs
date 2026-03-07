import { test, expect } from '@playwright/test';

test.describe('Advanced Handler Defaults Tests', () => {
    test('should handle multiple static properties and partial overrides', async ({ page }) => {
        await page.goto('/tests/test-handler-defaults-advanced.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
    });
});
