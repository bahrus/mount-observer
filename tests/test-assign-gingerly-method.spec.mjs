import { test, expect } from '@playwright/test';

test.describe('MountObserver - assignGingerly Method', () => {
    test('should apply initial config and merge with method call', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-assign-gingerly-method.html');
        await page.waitForTimeout(200);
        
        // Verify initial state
        const input1Disabled = await page.locator('#input1').isDisabled();
        const input1Value = await page.locator('#input1').inputValue();
        expect(input1Disabled).toBe(true);
        expect(input1Value).toBe('Initial value');
        
        // Call the public assignGingerly method
        await page.click('#updateBtn');
        await page.waitForTimeout(100);
        
        // Verify merged config applied to existing elements
        const input1Title = await page.locator('#input1').getAttribute('title');
        const input1Placeholder = await page.locator('#input1').getAttribute('placeholder');
        expect(input1Title).toBe('Updated via method');
        expect(input1Placeholder).toBe('New placeholder');
        
        // Original properties should still be there
        expect(await page.locator('#input1').isDisabled()).toBe(true);
        expect(await page.locator('#input1').inputValue()).toBe('Initial value');
        
        // Add a new element
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        
        // Verify new element gets merged config
        const dynamicInput = page.locator('#dynamic-input-1');
        expect(await dynamicInput.isDisabled()).toBe(true);
        expect(await dynamicInput.inputValue()).toBe('Initial value');
        expect(await dynamicInput.getAttribute('title')).toBe('Updated via method');
        expect(await dynamicInput.getAttribute('placeholder')).toBe('New placeholder');
    });
    
    test('should work when no initial assignGingerly config', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-basic.html');
        await page.waitForTimeout(200);
        
        // Call assignGingerly method on observer without initial config
        await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const observer = new MountObserver({
                matching: 'input'
            });
            await observer.observe(document);
            
            // Call method to set config
            await observer.assignGingerly({
                disabled: true,
                value: 'Set via method'
            });
            
            window.testObserver = observer;
        });
        
        await page.waitForTimeout(100);
        
        // Add a new input
        await page.evaluate(() => {
            const input = document.createElement('input');
            input.id = 'test-input';
            document.body.appendChild(input);
        });
        
        await page.waitForTimeout(100);
        
        // Verify config was applied
        const testInput = page.locator('#test-input');
        expect(await testInput.isDisabled()).toBe(true);
        expect(await testInput.inputValue()).toBe('Set via method');
    });
    
    test('should handle undefined to clear config', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-basic.html');
        await page.waitForTimeout(200);
        
        await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const observer = new MountObserver({
                matching: 'input',
                assignOnMount: {
                    disabled: true
                }
            });
            await observer.observe(document);
            
            // Clear config
            await observer.assignGingerly(undefined);
            
            window.testObserver = observer;
        });
        
        await page.waitForTimeout(100);
        
        // Add a new input
        await page.evaluate(() => {
            const input = document.createElement('input');
            input.id = 'test-input';
            document.body.appendChild(input);
        });
        
        await page.waitForTimeout(100);
        
        // Verify no config was applied
        const testInput = page.locator('#test-input');
        expect(await testInput.isDisabled()).toBe(false);
    });
});
