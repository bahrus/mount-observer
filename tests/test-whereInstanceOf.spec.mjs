import { test, expect } from '@playwright/test';

test.describe('whereInstanceOf Tests', () => {
    test('should filter elements by constructor', async ({ page }) => {
        await page.goto('/tests/test-whereInstanceOf.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify specific results by checking the pre element that contains actual results
        const resultsText = await page.locator('#results pre').textContent();
        expect(resultsText).toContain('input1');
        expect(resultsText).toContain('button1');
        expect(resultsText).toContain('div1');
        expect(resultsText).not.toContain('span1');
    });
});
