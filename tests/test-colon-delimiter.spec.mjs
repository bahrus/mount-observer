import { test, expect } from '@playwright/test';

test.describe('Colon Delimiter Tests', () => {
    test('should match attributes with colon delimiters', async ({ page }) => {
        await page.goto('/tests/test-colon-delimiter.html');
        
        // Wait for test to complete (increased timeout for dynamic imports)
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 10000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify all expected elements were mounted
        const resultsText = await page.locator('#results').textContent();
        expect(resultsText).toContain('test1');
        expect(resultsText).toContain('test2');
        expect(resultsText).toContain('test3');
        expect(resultsText).toContain('test4');
    });
});
