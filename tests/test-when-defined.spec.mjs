import { test, expect } from '@playwright/test';

test.describe('whenDefined Support', () => {
    test('should wait for single custom element to be defined before mounting', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-when-defined.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.singleTagMounted).toBe(true);
        expect(results.element1Mounted).toBe(true);
    });
    
    test('should wait for multiple custom elements to be defined before mounting', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-when-defined.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.multipleTagsMounted).toBe(true);
        expect(results.element2Mounted).toBe(true);
        expect(results.element3Mounted).toBe(true);
    });
    
    test('should not mount elements before custom elements are defined', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-when-defined.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // mountedBeforeDefine should be false (no early mounting)
        expect(results.mountedBeforeDefine).toBe(false);
    });
});
