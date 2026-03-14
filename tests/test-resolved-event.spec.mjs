import { test, expect } from '@playwright/test';

test.describe('Resolved Event Tests', () => {
    test('MOSE with inline JSON should set export and dispatch resolved event', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-resolved-event.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.mose1HasExport).toBe(true);
        expect(results.mose1ExportIsObject).toBe(true);
        expect(results.mose1ResolvedEventFired).toBe(true);
        expect(results.mose1ResolvedEventHasExport).toBe(true);
    });
    
    test('MOSE with array should set export and dispatch resolved event', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-resolved-event.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.mose2HasExport).toBe(true);
        expect(results.mose2ExportIsArray).toBe(true);
        expect(results.mose2ResolvedEventFired).toBe(true);
        expect(results.mose2ResolvedEventHasExport).toBe(true);
    });
    
    test('ScriptExport with JSON should set export and dispatch resolved event', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-resolved-event.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.jsonScriptHasExport).toBe(true);
        expect(results.jsonScriptResolvedEventFired).toBe(true);
        expect(results.jsonScriptResolvedEventHasExport).toBe(true);
    });
    
    test('ScriptExport with JS module should set export and dispatch resolved event', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-resolved-event.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.jsScriptHasExport).toBe(true);
        expect(results.jsScriptResolvedEventFired).toBe(true);
        expect(results.jsScriptResolvedEventHasExport).toBe(true);
    });
});
