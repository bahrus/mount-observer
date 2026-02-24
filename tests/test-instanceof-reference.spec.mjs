import { test, expect } from '@playwright/test';

test.describe('MountObserver - Referenced whereInstanceOf', () => {
    test('should filter elements using referenced whereInstanceOf', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-instanceof-reference.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testPassed !== undefined, { timeout: 5000 });
        
        // Check overall result
        const testPassed = await page.evaluate(() => window.testPassed);
        expect(testPassed).toBe(true);
        
        // Verify specific results
        const moduleDoCalledFor = await page.evaluate(() => window.moduleDoCalledFor);
        expect(moduleDoCalledFor).toContain('btn1');
        expect(moduleDoCalledFor).toContain('input1');
        expect(moduleDoCalledFor).not.toContain('div1');
        expect(moduleDoCalledFor).toContain('btn3'); // lazy loading test
        
        const module2DoCalledFor = await page.evaluate(() => window.module2DoCalledFor);
        expect(module2DoCalledFor).toContain('div2');
        expect(module2DoCalledFor).not.toContain('span2');
    });
});
