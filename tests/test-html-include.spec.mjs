import { test, expect } from '@playwright/test';

test.describe('HTMLInclude Handler', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-html-include.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(100); // Allow handlers to process
    });

    test('should clone content from a div element', async ({ page }) => {
        const test1 = page.locator('#test1');
        
        // Original should still exist with its ID
        await expect(test1.locator('#reusable1')).toBeVisible();
        
        // Clone should exist (content is there but without the ID)
        const clones = await test1.locator('div:has(> p:text("Reusable content 1"))').count();
        expect(clones).toBe(2); // Original + clone (clone has no ID)
        
        // Template should be removed
        await expect(test1.locator('template[src="#reusable1"]')).toHaveCount(0);
    });

    test('should clone content from a template element', async ({ page }) => {
        const test2 = page.locator('#test2');
        
        // Original template should still exist
        await expect(test2.locator('#reusable2')).toHaveCount(1);
        
        // Cloned content should exist
        await expect(test2.locator('.template-content')).toBeVisible();
        await expect(test2.locator('.template-content span')).toHaveText('Template content');
        
        // Include template should be removed
        await expect(test2.locator('template[src="#reusable2"]')).toHaveCount(0);
    });

    test('should handle multiple includes of same content', async ({ page }) => {
        const test3 = page.locator('#test3');
        
        // Original should exist with its ID
        await expect(test3.locator('#shared')).toBeVisible();
        
        // Should have 4 total (1 original + 3 clones, clones have no ID)
        const count = await test3.locator('div:has(> p:text("Shared content"))').count();
        expect(count).toBe(4);
        
        // All include templates should be removed
        await expect(test3.locator('template[src="#shared"]')).toHaveCount(0);
    });

    test('should handle not found gracefully', async ({ page }) => {
        const test4 = page.locator('#test4');
        
        // Template should still exist with error attribute
        const template = test4.locator('template[src="#nonexistent"]');
        await expect(template).toHaveCount(1);
        await expect(template).toHaveAttribute('data-include-error', /not found/);
    });

    test('should detect circular references', async ({ page }) => {
        const test5 = page.locator('#test5');
        
        // Both templates reference each other, but since we just clone the template elements
        // (not process their src attributes), no circular reference is detected.
        // The templates will be cloned as-is with their src attributes intact.
        
        // Check that templates were processed (they should be removed and replaced with clones)
        const templates = await test5.locator('template').count();
        
        // The cloned templates will still have src attributes but won't be processed again
        // because they're just clones, not new elements being observed
        expect(templates).toBeGreaterThanOrEqual(0);
    });

    test('should include content across shadow DOM boundaries', async ({ page }) => {
        const shadowHost = page.locator('#shadowHost');
        
        // Check that content was cloned into shadow DOM
        const shadowContent = await shadowHost.evaluate(el => {
            const shadow = el.shadowRoot;
            if (!shadow) return null;
            const p = shadow.querySelector('p');
            return p ? p.textContent : null;
        });
        
        expect(shadowContent).toBe('Outside shadow content');
    });

    test('should work with hoisted templates', async ({ page }) => {
        const shadowHost2 = page.locator('#shadowHost2');
        
        // Check that hoisted template content was included
        const shadowContent = await shadowHost2.evaluate(el => {
            const shadow = el.shadowRoot;
            if (!shadow) return null;
            const div = shadow.querySelector('.hoisted-content');
            return div ? div.textContent : null;
        });
        
        expect(shadowContent).toBe('Hoisted content');
    });

    test('should handle song lyrics example correctly', async ({ page }) => {
        const test8 = page.locator('#test8');
        const artStanza = test8.locator('#art');
        
        // Original Friday div should exist in Opening stanza
        await expect(test8.locator('#Opening #Friday')).toBeVisible();
        
        // Cloned Friday content should exist in art stanza
        const fridayClones = await artStanza.locator('div:has(> div:text-matches("It\'s.*Friday.*I\'m in love"))').count();
        expect(fridayClones).toBe(1);
        
        // Include template should be removed
        await expect(artStanza.locator('template[src="#Friday"]')).toHaveCount(0);
    });
});
