import { test, expect } from '@playwright/test';

test.describe('ID Generation Integration with MountObserver', () => {
    test('should automatically process ID generation when -id elements are mounted', async ({ page }) => {
        await page.goto('./tests/id-generation-integration.html');
        
        // Wait for processing
        await page.waitForTimeout(1000);
        
        // Check that the test completed successfully
        const target = page.locator('#target');
        await expect(target).toHaveAttribute('mark', 'good');
        
        // Verify IDs were generated
        const lhsInput = page.locator('[data-id="lhs"]');
        const lhsId = await lhsInput.getAttribute('id');
        expect(lhsId).toMatch(/^gid-\d+$/);
        
        const rhsInput = page.locator('[data-id="rhs"]');
        const rhsId = await rhsInput.getAttribute('id');
        expect(rhsId).toMatch(/^gid-\d+$/);
        
        // Verify references were replaced
        const template = page.locator('template');
        const attr = await template.getAttribute('🎚️');
        expect(attr).toContain(`#${lhsId}`);
        expect(attr).toContain(`#${rhsId}`);
        
        // Verify cleanup
        await expect(template).not.toHaveAttribute('-id');
        await expect(template).not.toHaveAttribute('defer-🎚️');
        
        const fieldset = page.locator('fieldset');
        await expect(fieldset).not.toHaveAttribute('disabled');
    });
    
    test('should handle dynamically added elements with -id', async ({ page }) => {
        await page.goto('./tests/id-generation-integration.html');
        await page.waitForTimeout(500);
        
        // Add a new fieldset dynamically
        await page.evaluate(() => {
            const container = document.body;
            const newFieldset = document.createElement('fieldset');
            newFieldset.setAttribute('disabled', '');
            newFieldset.innerHTML = `
                <input data-id="dynamic1">
                <input data-id="dynamic2">
                <div -id></div>
            `;
            container.appendChild(newFieldset);
        });
        
        // Wait for processing
        await page.waitForTimeout(500);
        
        // Check that IDs were generated for dynamic elements
        const dynamic1 = page.locator('[data-id="dynamic1"]');
        const id1 = await dynamic1.getAttribute('id');
        expect(id1).toMatch(/^gid-\d+$/);
        
        const dynamic2 = page.locator('[data-id="dynamic2"]');
        const id2 = await dynamic2.getAttribute('id');
        expect(id2).toMatch(/^gid-\d+$/);
        
        // Verify -id was removed
        const trigger = page.locator('fieldset').last().locator('[\\-id]');
        await expect(trigger).toHaveCount(0);
    });
});
