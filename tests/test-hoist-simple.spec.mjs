import { test, expect } from '@playwright/test';

test('Simple Hoist Test', async ({ page }) => {
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
        logs.push(msg.text());
        console.log('BROWSER:', msg.text());
    });
    
    page.on('pageerror', err => {
        errors.push(err.message);
        console.log('PAGE ERROR:', err.message);
    });
    
    await page.goto('/tests/test-hoist-simple.html');
    
    // Wait for test to complete
    await page.waitForFunction(() => window.testComplete || window.testError, { timeout: 5000 });
    
    const testError = await page.evaluate(() => window.testError);
    
    console.log('All logs:', logs);
    console.log('All errors:', errors);
    
    if (testError) {
        console.log('Test error:', testError);
    }
    
    expect(testError).toBeUndefined();
});
