import { test, expect } from '@playwright/test';

test.describe('Script JSON Import Tests', () => {
    test('should import JSON with type="json"', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        
        await page.goto('/tests/test-script-json-import.html');
        await page.waitForFunction(() => window.testResults !== undefined, { timeout: 10000 });
        
        const results = await page.evaluate(() => window.testResults);
        console.log('Test Results:', JSON.stringify(results, null, 2));
        
        // Test 1: type="json"
        expect(results.test1.hasExport).toBe(true);
        expect(results.test1.hasDefault).toBe(true);
        expect(results.test1.dataName).toBe('Test Data');
        expect(results.test1.itemsCount).toBe(3);
        
        // Test 2: type="application/json"
        expect(results.test2.hasExport).toBe(true);
        expect(results.test2.hasDefault).toBe(true);
        expect(results.test2.dataName).toBe('Test Data');
        
        // Test 3: type="application/ld+json"
        expect(results.test3.hasExport).toBe(true);
        expect(results.test3.hasDefault).toBe(true);
        expect(results.test3.dataName).toBe('Test Data');
        
        // Test 4: type="module" should be skipped
        expect(results.test4.hasExport).toBe(false);
        
        // Test 5: Regular nomodule JS import
        expect(results.test5.hasExport).toBe(true);
        expect(results.test5.hasMountConfig).toBe(true);
    });
});
