import { test, expect } from '@playwright/test';

test.describe('mountGlobally', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-mount-globally.html');
        await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });
        // Wait a bit more for all async operations to complete
        await page.waitForTimeout(1000);
    });

    test('Test 1: Cross-registry propagation', async ({ page }) => {
        const result = await page.locator('#test1-results').getAttribute('data-test1');
        const text = await page.locator('#test1-results').textContent();
        console.log('Test 1 result:', result, 'text:', text);
        expect(result).toBe('pass');
    });

    test('Test 2: Shadow root propagation in same registry', async ({ page }) => {
        const result = await page.locator('#test2-results').getAttribute('data-test2');
        const text = await page.locator('#test2-results').textContent();
        console.log('Test 2 result:', result, 'text:', text);
        expect(result).toBe('pass');
    });

    test('Test 3: Nested shadow root propagation', async ({ page }) => {
        const result = await page.locator('#test3-results').getAttribute('data-test3');
        const text = await page.locator('#test3-results').textContent();
        console.log('Test 3 result:', result, 'text:', text);
        expect(result).toBe('pass');
    });
});
