import { test, expect } from '@playwright/test';

test.describe('Media Query Tests', () => {
    test('should respect whereMediaMatches condition', async ({ page }) => {
        await page.goto('/tests/test-media-query.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 2000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify the event log based on whether media matched
        const mediaMatches = await page.evaluate(() => window.mediaMatches);
        const eventLog = await page.evaluate(() => window.eventLog || []);
        
        if (mediaMatches) {
            // Should have mounted elements
            const mountEvents = eventLog.filter(e => e.type === 'mount-event');
            expect(mountEvents.length).toBe(2);
            expect(mountEvents.some(e => e.id === 'div1')).toBe(true);
            expect(mountEvents.some(e => e.id === 'div2')).toBe(true);
        } else {
            // Should NOT have mounted elements
            const mountEvents = eventLog.filter(e => e.type === 'mount-event');
            expect(mountEvents.length).toBe(0);
        }
    });
});
