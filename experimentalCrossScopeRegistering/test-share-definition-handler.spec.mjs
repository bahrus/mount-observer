import { test, expect } from '@playwright/test';

test('ShareDefinition Handler Tests', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:8000/tests/test-share-definition-handler.html');
    
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const error = await page.evaluate(() => window.testError);
    
    if (error) {
        console.log('Test error:', error);
    }
    
    expect(error).toBeUndefined();
});
