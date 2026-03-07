import { test, expect } from '@playwright/test';
test('inScope', async ({ page }) => {
    await page.goto('./tests/ish/inScope.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
