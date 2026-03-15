import { test, expect } from '@playwright/test';

test.describe('Optimization 4: MOSE Export Copying', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-optimization-4.html');
        // Wait for testsReady flag
        await page.waitForFunction(() => window.testsReady === true, { timeout: 2000 });
    });

    test('should copy export from source MOSE script to cloned script', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { sourceScript, clonedScript } = window.testData;
            
            return {
                sourceHasExport: !!sourceScript?.export,
                clonedHasExport: !!clonedScript?.export,
                exportsMatch: sourceScript?.export === clonedScript?.export,
                clonedScriptExists: !!clonedScript
            };
        });

        expect(result.clonedScriptExists).toBe(true);
        expect(result.sourceHasExport).toBe(true);
        expect(result.clonedHasExport).toBe(true);
        expect(result.exportsMatch).toBe(true);
    });

    test('should not re-parse JSON in cloned script', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { sourceScript, clonedScript } = window.testData;
            
            if (!sourceScript || !clonedScript) {
                return { error: 'Missing scripts' };
            }
            
            // Both should have the same export object (by reference)
            const sourceExport = sourceScript.export;
            const clonedExport = clonedScript.export;
            
            return {
                sourceMatching: sourceExport?.matching,
                clonedMatching: clonedExport?.matching,
                sameReference: sourceExport === clonedExport
            };
        });

        expect(result.error).toBeUndefined();
        expect(result.sourceMatching).toBe('.test-element');
        expect(result.clonedMatching).toBe('.test-element');
        expect(result.sameReference).toBe(true);
    });

    test('should clone content correctly into shadow DOM', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { shadowRoot } = window.testData;
            
            const clonedDiv = shadowRoot.querySelector('.test-element');
            const clonedScript = shadowRoot.querySelector('script[type="mountobserver"]');
            
            return {
                hasClonedDiv: !!clonedDiv,
                clonedDivText: clonedDiv?.textContent?.trim(),
                hasClonedScript: !!clonedScript,
                clonedScriptId: clonedScript?.getAttribute('id')
            };
        });

        expect(result.hasClonedDiv).toBe(true);
        expect(result.clonedDivText).toBe('Test content');
        expect(result.hasClonedScript).toBe(true);
        expect(result.clonedScriptId).toBe('mose-config');
    });

    test('should work when source and clone are in different root nodes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { sourceScript, clonedScript } = window.testData;
            
            if (!sourceScript || !clonedScript) {
                return { error: 'Missing scripts' };
            }
            
            const sourceRoot = sourceScript.getRootNode();
            const clonedRoot = clonedScript.getRootNode();
            
            return {
                sourceIsDocument: sourceRoot === document,
                clonedIsShadowRoot: clonedRoot instanceof ShadowRoot,
                differentRoots: sourceRoot !== clonedRoot
            };
        });

        expect(result.error).toBeUndefined();
        expect(result.sourceIsDocument).toBe(true);
        expect(result.clonedIsShadowRoot).toBe(true);
        expect(result.differentRoots).toBe(true);
    });
});
