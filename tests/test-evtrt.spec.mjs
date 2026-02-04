import { test, expect } from '@playwright/test';

test('EvtRt binding from a distance', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-evtrt.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test that element was matched
    expect(results.elementMatched).toBe(true);
    
    // Test that mount was called and text was set
    expect(results.mountCalled).toBe(true);
    expect(results.mountText).toBe('hello');
    
    // Test that dismount was called and text was changed
    expect(results.dismountCalled).toBe(true);
    expect(results.dismountText).toBe('bye');
    
    // Test that disconnect was called
    expect(results.disconnectCalled).toBe(true);
});
