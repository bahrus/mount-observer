import { test, expect } from '@playwright/test';

test.describe('MountObserver v2', () => {
    test('should mount existing elements', async ({ page }) => {
        await page.goto('http://localhost:8000/v2/tests/test-basic.html');
        
        // Wait for observer to process existing element
        await page.waitForTimeout(100);
        
        // Check that existing element was styled
        const existingElement = page.locator('#existing');
        await expect(existingElement).toHaveCSS('border', '2px solid rgb(0, 128, 0)');
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Observer started');
        await expect(log).toContainText('Do callback: existing mounted');
        await expect(log).toContainText('Mount event: existing');
    });

    test('should mount dynamically added elements', async ({ page }) => {
        await page.goto('http://localhost:8000/v2/tests/test-basic.html');
        await page.waitForTimeout(100);
        
        // Add a new element
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        
        // Check that new element was styled
        const dynamicElement = page.locator('#dynamic-1');
        await expect(dynamicElement).toHaveCSS('border', '2px solid rgb(0, 128, 0)');
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Added element: dynamic-1');
        await expect(log).toContainText('Do callback: dynamic-1 mounted');
        await expect(log).toContainText('Mount event: dynamic-1');
    });

    test('should dismount removed elements', async ({ page }) => {
        await page.goto('http://localhost:8000/v2/tests/test-basic.html');
        await page.waitForTimeout(100);
        
        // Add an element
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        
        // Remove it
        await page.click('#removeBtn');
        await page.waitForTimeout(100);
        
        // Check log for dismount events
        const log = page.locator('#log');
        await expect(log).toContainText('Dismount event: dynamic-1');
        await expect(log).toContainText('Disconnect event: dynamic-1');
    });

    test('should lazy load imports', async ({ page }) => {
        await page.goto('http://localhost:8000/v2/tests/test-import.html');
        
        // Wait for import to load
        await page.waitForTimeout(500);
        
        // Check that custom element was defined
        const isDefined = await page.evaluate(() => {
            return customElements.get('fancy-button') !== undefined;
        });
        expect(isDefined).toBe(true);
        
        // Check log
        const log = page.locator('#log');
        await expect(log).toContainText('Load event: 1 module(s) loaded');
        await expect(log).toContainText('Custom element fancy-button defined');
    });

    test('should handle multiple elements', async ({ page }) => {
        await page.goto('http://localhost:8000/v2/tests/test-basic.html');
        await page.waitForTimeout(100);
        
        // Add multiple elements
        await page.click('#addBtn');
        await page.waitForTimeout(50);
        await page.click('#addBtn');
        await page.waitForTimeout(50);
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        
        // Check that all were mounted
        const log = page.locator('#log');
        await expect(log).toContainText('Mount event: dynamic-1');
        await expect(log).toContainText('Mount event: dynamic-2');
        await expect(log).toContainText('Mount event: dynamic-3');
    });
});
