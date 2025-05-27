import { test, expect } from '@playwright/test';
test('eventCheck', async ({ page }) => {
    await page.goto('./tests/ish/eventCheck.html');
    // wait for 5 seconds
    await page.waitForTimeout(5000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
