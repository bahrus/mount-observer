import { test, expect } from '@playwright/test';

test('configFrom single module', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-config-from-single.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Single configFrom module
    expect(results.test1.elementMounted).toBe(true);
    expect(results.test1.baseConfigApplied).toBe(true);
    expect(results.test1.textContent).toBe('Base config applied');
});
