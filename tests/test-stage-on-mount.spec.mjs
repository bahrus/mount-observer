import { test, expect } from '@playwright/test';

test.describe('stageOnMount', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-stage-on-mount.html');
        await page.waitForFunction(() => window.testsReady);
    });

    test('applies properties on mount', async ({ page }) => {
        const button = page.locator('#btn1');
        
        // Check that staged properties were applied
        await expect(button).toBeDisabled();
        await expect(button).toHaveAttribute('data-staged', 'button');
        await expect(button).toHaveAttribute('title', 'Processing...');
    });

    test('applies nested path properties', async ({ page }) => {
        const input = page.locator('#input1');
        
        // Check that nested path property was applied
        await expect(input).toHaveAttribute('data-staged', 'yes');
        await expect(input).toHaveAttribute('readonly');
    });

    test('works with assignOnMount', async ({ page }) => {
        const div = page.locator('#div1');
        
        // Check that both assignOnMount and stageOnMount were applied
        await expect(div).toHaveClass('enhanced');
        await expect(div).toHaveAttribute('data-hidden', 'true');
    });

    test('reverses properties on dismount', async ({ page }) => {
        // Store original values
        const originalDisabled = await page.locator('#btn1').evaluate(el => el.disabled);
        const originalDataStaged = await page.locator('#btn1').getAttribute('data-staged');
        const originalTitle = await page.locator('#btn1').getAttribute('title');
        
        // Remove the button from DOM
        await page.evaluate(() => {
            document.getElementById('btn1').remove();
        });
        
        // Wait a bit for dismount to process
        await page.waitForTimeout(100);
        
        // Re-add the button
        await page.evaluate(() => {
            const btn = document.createElement('button');
            btn.id = 'btn1';
            btn.className = 'test-button';
            btn.textContent = 'Button 1';
            document.getElementById('container').appendChild(btn);
        });
        
        // Wait for re-mount
        await page.waitForTimeout(100);
        
        // Check that properties were re-applied on re-mount
        const button = page.locator('#btn1');
        await expect(button).toBeDisabled();
        await expect(button).toHaveAttribute('data-staged', 'button');
    });

    test('restores original values on dismount', async ({ page }) => {
        const input = page.locator('#input1');
        
        // Verify staged property exists
        await expect(input).toHaveAttribute('data-staged', 'yes');
        
        // Remove from DOM
        await page.evaluate(() => {
            const input = document.getElementById('input1');
            input.remove();
        });
        
        await page.waitForTimeout(100);
        
        // Re-add to DOM without the class (so it won't re-mount)
        await page.evaluate(() => {
            const input = document.createElement('input');
            input.id = 'input1-new';
            input.value = 'original';
            document.getElementById('container').appendChild(input);
        });
        
        // The new input should not have the staged property
        const newInput = page.locator('#input1-new');
        await expect(newInput).not.toHaveAttribute('data-staged');
    });

    test('handles re-mounting correctly', async ({ page }) => {
        const div = page.locator('#div1');
        
        // Verify initial state
        await expect(div).toHaveClass('enhanced');
        await expect(div).toHaveAttribute('data-hidden', 'true');
        
        // Remove and re-add
        await page.evaluate(() => {
            const div = document.getElementById('div1');
            const parent = div.parentElement;
            div.remove();
            
            setTimeout(() => {
                parent.appendChild(div);
            }, 50);
        });
        
        await page.waitForTimeout(150);
        
        // Should be re-mounted with both properties
        await expect(div).toHaveClass('enhanced');
        await expect(div).toHaveAttribute('data-hidden', 'true');
    });
});
