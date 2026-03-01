import { test, expect } from '@playwright/test';

test('configFrom merge behavior', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-config-from-merge.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Inline config overrides imported config
    expect(results.test1.elementMounted).toBe(true);
    expect(results.test1.inlineOverrideApplied).toBe(true);
    expect(results.test1.textContent).toBe('Inline override applied');
    
    // Test 2: whereInstanceOf from imported config works
    expect(results.test2.buttonMounted).toBe(true);
    expect(results.test2.instanceofWorked).toBe(true);
    expect(results.test2.textContent).toBe('Button config applied');
});
