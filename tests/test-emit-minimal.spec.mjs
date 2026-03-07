import { test, expect } from '@playwright/test';

test('minimal emit test', async ({ page }) => {
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        console.log('PAGE:', text);
    });
    
    page.on('pageerror', err => {
        errors.push(err.message);
        console.error('ERROR:', err.message);
    });
    
    await page.goto('http://localhost:8000/tests/test-emit-minimal.html');
    await page.waitForTimeout(1000);
    
    console.log('All logs:', logs);
    console.log('All errors:', errors);
    
    const eventsReceived = await page.evaluate(() => window.eventsReceived);
    console.log('Events:', eventsReceived);
    
    expect(eventsReceived.length).toBeGreaterThan(0);
});
