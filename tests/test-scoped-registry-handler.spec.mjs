import { test, expect } from '@playwright/test';

test('Scoped registry handler tests', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    await page.goto('/tests/test-scoped-registry-handler.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test results:', results);
    
    expect(results.globalHandlerWorks).toBe(true);
    expect(results.scopedHandlerWorks).toBe(true);
    expect(results.scopedHandlerThrowsWithoutRegistry).toBe(true);
});
