import { test, expect } from '@playwright/test';

test.describe('HTMLInclude Simple Test', () => {
    test('should clone content from source element', async ({ page }) => {
        // Listen for console messages
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-html-include-simple.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(200);
        
        const testDiv = page.locator('#test');
        
        // Check if clones exist (should have 2: original + clone)
        const clones = await testDiv.locator('div:has(> p:text("Source content"))').count();
        console.log('Clone count:', clones);
        expect(clones).toBe(2);
        
        // Template should be removed
        await expect(testDiv.locator('template[src="#source"]')).toHaveCount(0);
        
        // Get the HTML
        const html = await testDiv.innerHTML();
        console.log('Test div HTML:', html);
    });
});
