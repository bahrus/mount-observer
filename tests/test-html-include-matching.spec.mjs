import { test, expect } from '@playwright/test';

test.describe('HTMLInclude Matching Insertions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-html-include-matching.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(100);
    });

    test('should update attribute via -i and replace children', async ({ page }) => {
        const test1 = page.locator('#test1');
        
        // Should have cloned the div (without id)
        const clonedDivs = await test1.locator('div[itemscope]').count();
        expect(clonedDivs).toBe(2); // Original + clone
        
        // Check the cloned div's data element
        const dataElements = await test1.locator('data[itemprop="todayIsFriday"]').all();
        expect(dataElements.length).toBe(2);
        
        // Original should still have value="false"
        await expect(test1.locator('#love data[itemprop="todayIsFriday"]')).toHaveAttribute('value', 'false');
        
        // Clone should have value="true" (updated via -i)
        const clonedData = test1.locator('div[itemscope]:not([id]) data[itemprop="todayIsFriday"]');
        await expect(clonedData).toHaveAttribute('value', 'true');
        
        // Children should be replaced (empty because template child has no children)
        const clonedDataText = await clonedData.textContent();
        expect(clonedDataText).toBe('');
        
        // Template should be removed
        await expect(test1.locator('template[src="#love"]')).toHaveCount(0);
    });

    test('should replace content of matching elements', async ({ page }) => {
        const test2 = page.locator('#test2');
        
        // Should have 2 divs (original + clone)
        const divs = await test2.locator('div').count();
        expect(divs).toBe(2);
        
        // Original should still say "Hello"
        await expect(test2.locator('#greeting p.message')).toHaveText('Hello');
        
        // Clone should say "Goodbye"
        await expect(test2.locator('div:not([id]) p.message')).toHaveText('Goodbye');
    });

    test('should update all matching elements', async ({ page }) => {
        const test3 = page.locator('#test3');
        
        // Should have 2 divs (original + clone)
        const divs = await test3.locator('div').count();
        expect(divs).toBe(2);
        
        // Original items should be unchanged
        const originalItems = await test3.locator('#list span.item').allTextContents();
        expect(originalItems).toEqual(['Item 1', 'Item 2', 'Item 3']);
        
        // Clone items should all say "Updated"
        const clonedItems = await test3.locator('div:not([id]) span.item').allTextContents();
        expect(clonedItems).toEqual(['Updated', 'Updated', 'Updated']);
    });

    test('should update multiple attributes', async ({ page }) => {
        const test4 = page.locator('#test4');
        
        // Should have 2 forms (original + clone)
        const forms = await test4.locator('form').count();
        expect(forms).toBe(2);
        
        // Original input
        const originalInput = test4.locator('#myForm input[name="username"]');
        await expect(originalInput).toHaveAttribute('value', 'old');
        await expect(originalInput).toHaveAttribute('placeholder', 'Enter username');
        
        // Clone input should have updated attributes
        const clonedInput = test4.locator('form:not([id]) input[name="username"]');
        await expect(clonedInput).toHaveAttribute('value', 'new');
        await expect(clonedInput).toHaveAttribute('placeholder', 'New placeholder');
    });

    test('should handle non-matching template children gracefully', async ({ page }) => {
        const test5 = page.locator('#test5');
        
        // Should have 2 divs (original + clone)
        const divs = await test5.locator('div').count();
        expect(divs).toBe(2);
        
        // Original should be unchanged
        await expect(test5.locator('#container p.text')).toHaveText('Original');
        
        // Clone should have the original content (no matching occurred)
        await expect(test5.locator('div:not([id]) p.text')).toHaveText('Original');
    });

    test('should work with empty template content', async ({ page }) => {
        const test6 = page.locator('#test6');
        
        // Should have 2 divs (original + clone)
        const divs = await test6.locator('div').count();
        expect(divs).toBe(2);
        
        // Both should have the same content
        await expect(test6.locator('#simple p')).toHaveText('Simple content');
        await expect(test6.locator('div:not([id]) p')).toHaveText('Simple content');
    });

    test('should null out content while updating attributes', async ({ page }) => {
        const test7 = page.locator('#test7');
        
        // Should have 2 divs (original + clone)
        const divs = await test7.locator('div').count();
        expect(divs).toBe(2);
        
        // Original
        const originalSpan = test7.locator('#status span.indicator');
        await expect(originalSpan).toHaveAttribute('data-active', 'false');
        await expect(originalSpan).toHaveText('Inactive');
        
        // Clone should have updated attribute but empty content
        const clonedSpan = test7.locator('div:not([id]) span.indicator');
        await expect(clonedSpan).toHaveAttribute('data-active', 'true');
        const clonedText = await clonedSpan.textContent();
        expect(clonedText).toBe(''); // Content replaced with empty
    });
});
