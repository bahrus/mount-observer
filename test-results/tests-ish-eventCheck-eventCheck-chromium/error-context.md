# Test info

- Name: eventCheck
- Location: C:\git\mount-observer\tests\ish\eventCheck.spec.mjs:2:1

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveAttribute(expected)

Locator: locator('#target')
Expected string: "good"
Received string: ""
Call log:
  - expect.toHaveAttribute with timeout 5000ms
  - waiting for locator('#target')
    8 × locator resolved to <div id="target"></div>
      - unexpected value "null"

    at C:\git\mount-observer\tests\ish\eventCheck.spec.mjs:7:26
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | test('eventCheck', async ({ page }) => {
  3 |     await page.goto('./tests/ish/eventCheck.html');
  4 |     // wait for 1 second
  5 |     await page.waitForTimeout(1000);
  6 |     const editor = page.locator('#target');
> 7 |     await expect(editor).toHaveAttribute('mark', 'good');
    |                          ^ Error: Timed out 5000ms waiting for expect(locator).toHaveAttribute(expected)
  8 | });
  9 |
```