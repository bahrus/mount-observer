import { test, expect } from '@playwright/test';

test.describe('withScopePerimeter Tests', () => {
    test('should implement donut hole scoping', async ({ page }) => {
        await page.goto('/tests/test-where-outside.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testResult !== undefined, { timeout: 2000 });
        
        const testResult = await page.evaluate(() => window.testResult);
        expect(testResult).toBe(true);
        
        // Verify specific elements
        const eventLog = await page.evaluate(() => window.eventLog || []);
        const mountedIds = eventLog
            .filter(e => e.type === 'mount-event')
            .map(e => e.id);
        
        // Should mount: elements with itemprop that are direct children of root itemscope
        expect(mountedIds).toContain('span1');
        expect(mountedIds).toContain('p1');
        
        // Should NOT mount: elements with itemprop inside nested itemscope
        expect(mountedIds).not.toContain('data1');
        expect(mountedIds).not.toContain('span2');
        
        // Should have exactly 2 mounted elements
        expect(mountedIds.length).toBe(2);
    });
});
