import { test, expect } from '@playwright/test';

test('Simple Built-in Test', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:8000/tests/test-builtins-simple.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const error = await page.evaluate(() => window.testError);
    
    if (error) {
        console.log('Test error:', error);
    }
    
    expect(error).toBeUndefined();
});
