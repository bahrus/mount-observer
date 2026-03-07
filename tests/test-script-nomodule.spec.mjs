import { test, expect } from '@playwright/test';

test.describe('Script NoModule Handler Tests', () => {
    test('should import modules from script[nomodule] elements', async ({ page }) => {
        // Listen to console messages
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        
        // Navigate to test page
        await page.goto('/tests/test-script-nomodule.html');
        
        // Wait for tests to complete
        await page.waitForFunction(() => window.testResults !== undefined, { timeout: 10000 });
        
        // Get test results
        const results = await page.evaluate(() => window.testResults);
        
        console.log('Test Results:', JSON.stringify(results, null, 2));
        
        // Test 1: JS module import
        expect(results.test1.hasExport).toBe(true);
        expect(results.test1.hasMountConfig).toBe(true);
        expect(results.test1.mountConfigMatching).toBe('div.test1');
        
        // Test 3: Another JS module
        expect(results.test3.hasExport).toBe(true);
        expect(results.test3.hasMountConfig).toBe(true);
        expect(results.test3.mountConfigMatching).toBe('div.test2');
    });
});
