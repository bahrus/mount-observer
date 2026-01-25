import { test, expect } from '@playwright/test';
test('test6', async ({ page }) => {
    await page.goto('./tests/test6.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
