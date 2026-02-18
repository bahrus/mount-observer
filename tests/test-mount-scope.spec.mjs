import { test, expect } from '@playwright/test';

test('Element mount scope options', async ({ page }) => {
    await page.goto('/tests/test-mount-scope.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    expect(results.registryScope).toBe(true);
    expect(results.selfScope).toBe(true);
    expect(results.rootScope).toBe(true);
    expect(results.shadowScope).toBe(true);
    expect(results.customElementScope).toBe(true);
    expect(results.shadowThrowsError).toBe(true);
});
