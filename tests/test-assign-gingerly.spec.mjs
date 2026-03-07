import { test, expect } from '@playwright/test';

test.describe('MountObserver - assignGingerly', () => {
    test('should apply assignGingerly to existing elements', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-assign-gingerly.html');
        
        // Wait for observer to process existing element
        await page.waitForTimeout(200);
        
        // Check that existing input has properties applied
        const existingInput = page.locator('#existing-input');
        
        // Check disabled property
        await expect(existingInput).toBeDisabled();
        
        // Check value property
        await expect(existingInput).toHaveValue('Test value');
        
        // Check title attribute
        const title = await existingInput.getAttribute('title');
        expect(title).toBe('This is a test');
        
        // Check dataset attribute
        const dataTest = await existingInput.getAttribute('data-test');
        expect(dataTest).toBe('data-test value');
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Observer started');
        await expect(log).toContainText('Mount event: existing-input');
    });

    test('should apply assignGingerly to dynamically added elements', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-assign-gingerly.html');
        await page.waitForTimeout(200);
        
        // Add a new input
        await page.click('#addBtn');
        await page.waitForTimeout(200);
        
        // Check that dynamic input has properties applied
        const dynamicInput = page.locator('#dynamic-input-1');
        
        // Check disabled property
        await expect(dynamicInput).toBeDisabled();
        
        // Check value property
        await expect(dynamicInput).toHaveValue('Test value');
        
        // Check title attribute
        const title = await dynamicInput.getAttribute('title');
        expect(title).toBe('This is a test');
        
        // Check dataset attribute
        const dataTest = await dynamicInput.getAttribute('data-test');
        expect(dataTest).toBe('data-test value');
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Added input: dynamic-input-1');
        await expect(log).toContainText('Mount event: dynamic-input-1');
    });

    test('should apply assignGingerly to multiple dynamically added elements', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-assign-gingerly.html');
        await page.waitForTimeout(200);
        
        // Add multiple inputs
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        await page.click('#addBtn');
        await page.waitForTimeout(200);
        
        // Check that all dynamic inputs have properties applied
        for (let i = 1; i <= 3; i++) {
            const input = page.locator(`#dynamic-input-${i}`);
            await expect(input).toBeDisabled();
            await expect(input).toHaveValue('Test value');
            
            const title = await input.getAttribute('title');
            expect(title).toBe('This is a test');
            
            const dataTest = await input.getAttribute('data-test');
            expect(dataTest).toBe('data-test value');
        }
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Mount event: dynamic-input-1');
        await expect(log).toContainText('Mount event: dynamic-input-2');
        await expect(log).toContainText('Mount event: dynamic-input-3');
    });

    test('should work without assignGingerly property', async ({ page }) => {
        // Create a test page without assignGingerly
        await page.goto('http://localhost:8000/tests/test-basic.html');
        await page.waitForTimeout(200);
        
        // Should work normally without errors
        const log = page.locator('#log');
        await expect(log).toContainText('Observer started');
    });
});
