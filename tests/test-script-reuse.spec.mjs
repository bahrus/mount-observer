import { test, expect } from '@playwright/test';

test.describe('Script Element Reuse Tests', () => {
    test('MOSE should reuse export property on subsequent observations', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-script-reuse.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Should have export after first observation
        expect(results.mose1HasExport).toBe(true);
        
        // Should only fire resolved event once (export reused on second observation)
        expect(results.mose1ExportReused).toBe(true);
        expect(results.mose1ResolvedEventCount).toBe(1);
    });
    
    test('ScriptExport should skip entirely on subsequent observations', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-script-reuse.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // Should have export after first observation
        expect(results.jsonScriptHasExport).toBe(true);
        
        // Should only fire resolved event once (skipped entirely on second observation)
        expect(results.jsonScriptSkippedSecondTime).toBe(true);
        expect(results.jsonScriptResolvedEventCount).toBe(1);
    });
});
