import { test, expect } from '@playwright/test';

test.describe('Once Feature Tests', () => {
    test('should only trigger attrchange event once when once=true', async ({ page }) => {
        await page.goto('/tests/test-once.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 2000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify the event log
        const eventLog = await page.evaluate(() => window.eventLog || []);
        expect(eventLog.length).toBe(1);
        expect(eventLog[0].attrName).toBe('my-attr');
        expect(eventLog[0].value).toBe('value1');
    });
});
