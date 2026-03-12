import { test, expect } from '@playwright/test';

test.describe('upShadowSearch Registry Boundary Tests', () => {
    test('should find element in same registry', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-upshadowsearch-registry.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.sameRegistryFound).toBe(true);
    });
    
    test('should not find element in different registry', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-upshadowsearch-registry.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        // This test passes if scoped registries are not supported (defaults to true)
        // or if the registry boundary is respected
        expect(results.differentRegistryNotFound).toBe(true);
    });
    
    test('should not find scoped element from global registry', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-upshadowsearch-registry.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.globalToScopedNotFound).toBe(true);
    });
    
    test('should not find global element from scoped registry', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-upshadowsearch-registry.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.scopedToGlobalNotFound).toBe(true);
    });
});
