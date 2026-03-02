import { test, expect } from '@playwright/test';

test('Cross-Scope Registry Sharing Integration Tests', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:8000/tests/test-cross-scope-registry-sharing.html');
    
    await page.waitForFunction(() => window.testComplete === true, { timeout: 15000 });
    
    const error = await page.evaluate(() => window.testError);
    
    if (error) {
        console.log('Test error:', error);
    }
    
    expect(error).toBeUndefined();
});
