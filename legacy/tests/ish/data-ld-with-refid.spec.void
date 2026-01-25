import { test, expect } from '@playwright/test';
test('data-ld-with-refid', async ({ page }) => {
    await page.goto('./tests/ish/data-ld-with-refid.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
