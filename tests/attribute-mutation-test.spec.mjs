import { test, expect } from '@playwright/test';

test('attribute mutation triggers mount', async ({ page }) => {
    await page.goto('./tests/attribute-mutation-test.html');
    await page.waitForTimeout(500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
