import { test, expect } from '@playwright/test';
test('mediaQueryTest1', async ({ page }) => {
    
    await page.goto('./tests/mediaQuery/mediaQueryTest1.html');
    await page.setViewportSize({ width: 400, height: 600 });
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
