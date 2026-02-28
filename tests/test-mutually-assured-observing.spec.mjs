import { test, expect } from '@playwright/test';

test.describe('Mutually Assured Observing Tests', () => {
    test('should observe elements across multiple scopes with same registry', async ({ page }) => {
        // Listen for console messages
        page.on('console', msg => console.log('Browser console:', msg.text()));
        page.on('pageerror', error => console.log('Browser error:', error.message));
        
        await page.goto('/tests/test-mutually-assured-observing.html');

        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });

        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
    });
});
