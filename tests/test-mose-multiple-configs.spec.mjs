import { test, expect } from '@playwright/test';

test.describe('MOSE Multiple Configs Support', () => {
    test('should support single config (existing behavior)', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-mose-multiple-configs.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });
        
        const results = await page.evaluate(() => window.testResults);
        console.log('Test Results:', JSON.stringify(results, null, 2));
        
        // Test 1: Single config
        expect(results.test1.templateProcessed).toBe(true);
        expect(results.test1.hasClonedContent).toBe(true);
    });
    
    test('should support array with one config', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-mose-multiple-configs.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Test 2: Array with one config
        expect(results.test2.template1Processed).toBe(true);
        expect(results.test2.template2Processed).toBe(true);
        expect(results.test2.hasContent1).toBe(true);
        expect(results.test2.hasContent2).toBe(true);
    });
    
    test('should support array with multiple configs', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-mose-multiple-configs.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Test 3: Array with multiple configs
        expect(results.test3.templateProcessed).toBe(true);
        expect(results.test3.hasClonedContent).toBe(true);
    });
});
