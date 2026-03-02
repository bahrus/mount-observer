import { test, expect } from '@playwright/test';

test.describe('Mount Observer Script Element Handler Tests', () => {
    test('should process script[type="mountobserver"] elements', async ({ page }) => {
        // Listen to console messages
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        
        // Navigate to test page
        await page.goto('/tests/test-mountobserver-script.html');
        
        // Wait for tests to complete
        await page.waitForFunction(() => window.testResults !== undefined, { timeout: 10000 });
        
        // Get test results
        const results = await page.evaluate(() => window.testResults);
        
        console.log('Test Results:', JSON.stringify(results, null, 2));
        
        // Test 1: Inline JSON config
        expect(results.test1.scriptExists).toBe(true);
        expect(results.test1.hasCorrectType).toBe(true);
        expect(results.test1.hasContent).toBe(true);
        
        // Test 2: External JSON config
        expect(results.test2.scriptExists).toBe(true);
        expect(results.test2.hasCorrectType).toBe(true);
        expect(results.test2.hasSrc).toBe(true);
    });
});
