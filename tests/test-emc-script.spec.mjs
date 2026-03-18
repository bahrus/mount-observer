import { test, expect } from '@playwright/test';

test.describe('EMCScript Handler Tests', () => {
    test('should enhance elements matching EMC config', async ({ page }) => {
        // Listen for console messages
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('/tests/test-emc-script.html');
        
        // Wait for tests to complete
        await page.waitForFunction(() => window.testsReady === true, { timeout: 5000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        console.log('Test results:', results);
        
        // Elements with .test-element class should be enhanced
        expect(results.elem1Enhanced).toBe(true);
        expect(results.elem2Enhanced).toBe(true);
        
        // Element without .test-element class should not be enhanced
        expect(results.elem3NotEnhanced).toBe(true);
        
        // Enhanced elements should have data-enhanced attribute
        expect(results.elem1HasAttr).toBe(true);
        expect(results.elem2HasAttr).toBe(true);
        
        // Script should have auto-generated ID
        expect(results.scriptHasId).toBe(true);
    });
});
