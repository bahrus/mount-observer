import { test, expect } from '@playwright/test';

test('configFrom error handling', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-config-from-errors.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Error when module doesn't export mountConfig
    expect(results.test1.errorThrown).toBe(true);
    expect(results.test1.errorMessage).toContain('does not export \'mountConfig\'');
    
    // Test 2: Error when duplicate modules specified
    expect(results.test2.errorThrown).toBe(true);
    expect(results.test2.errorMessage).toContain('Duplicate configFrom module');
});
