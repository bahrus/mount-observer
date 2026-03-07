import { test, expect } from '@playwright/test';

test('configFrom multiple modules', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-config-from-multiple.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Multiple configFrom modules (later overrides earlier)
    expect(results.test1.elementMounted).toBe(true);
    expect(results.test1.overrideApplied).toBe(true);
    expect(results.test1.textContent).toBe('Override config applied');
});
