import { test, expect } from '@playwright/test';

test('Scoped registry handler tests', async ({ page }) => {
    await page.goto('/tests/test-scoped-registry-handler.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    expect(results.globalHandlerWorks).toBe(true);
    expect(results.scopedHandlerWorks).toBe(true);
    expect(results.scopedHandlerThrowsWithoutRegistry).toBe(true);
});
