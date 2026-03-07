import { test, expect } from '@playwright/test';

test.describe('Custom Element Registry Matching Tests', () => {
    test('should only mount elements with matching customElementRegistry', async ({ page }) => {
        await page.goto('/tests/test-registry-matching.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify specific results
        const resultsText = await page.locator('#results pre').textContent();
        expect(resultsText).toContain('elem1');
        expect(resultsText).toContain('shadow-elem');
    });
});
