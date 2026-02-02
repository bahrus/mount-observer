import { test, expect } from '@playwright/test';

test('Simple reference test', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-reference-simple.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    // Check results
    const results = await page.evaluate(() => window.results);
    
    expect(results.inlineCalled).toBe(true);
    expect(results.referencedCalled).toBe(true);
});
