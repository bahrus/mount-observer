import { test, expect } from '@playwright/test';

test.describe('Synthesizer Tests', () => {
    test('should syndicate scripts from document to shadow roots', async ({ page }) => {
        await page.goto('/tests/test-synthesizer.html');
        
        // Wait for tests to be ready
        await page.waitForFunction(() => window.testsReady, { timeout: 10000 });
        
        // Get test results
        const results = await page.evaluate(() => window.testResults);
        
        console.log('Test results:', results);
        
        // Verify syndicator exists and is hidden
        expect(results.syndicatorExists).toBe(true);
        expect(results.syndicatorIsHidden).toBe(true);
        
        // Verify subscriber exists and is hidden
        expect(results.subscriberExists).toBe(true);
        expect(results.subscriberIsHidden).toBe(true);
        
        // Verify subscriber received scripts
        expect(results.subscriberHasScripts).toBe(true);
        expect(results.moseScriptCount).toBe(1);
        expect(results.emcScriptCount).toBe(1);
        
        // Verify scripts have export property
        expect(results.scriptsHaveExport).toBe(true);
    });
});
