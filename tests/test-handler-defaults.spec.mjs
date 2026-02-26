import { test, expect } from '@playwright/test';

test.describe('Handler Defaults Tests', () => {
    test('should use handler static properties as defaults', async ({ page }) => {
        await page.goto('/tests/test-handler-defaults.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify specific results
        const resultsText = await page.locator('#results pre').textContent();
        expect(resultsText).toContain('test-default');
        expect(resultsText).toContain('test-override');
    });
});
