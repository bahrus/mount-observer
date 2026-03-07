import { test, expect } from '@playwright/test';
test('mount-observer-test', async ({ page }) => {
    await page.goto('./tests/mount-observer-test.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
