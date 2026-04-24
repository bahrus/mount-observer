# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\test-builtins.spec.mjs >> Built-in Handlers Tests
- Location: tests\test-builtins.spec.mjs:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "Built-in Handlers Test" [level=1] [ref=e2]
  - text: Fancy Button!
  - generic [ref=e4]: Simple Card
  - text: Pre-defined
  - text: I am a reusable-oneI am a reusable-two
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Built-in Handlers Tests', async ({ page }) => {
  4  |     await page.goto('http://localhost:8000/tests/test-builtins.html');
  5  |     
  6  |     // Wait for tests to complete
  7  |     await page.waitForFunction(() => window.testComplete === true, { timeout: 15000 });
  8  |     
  9  |     const results = await page.evaluate(() => window.testResults);
  10 |     
  11 |     // Test 1: logToConsole handler
  12 |     expect(results.logToConsole.mountLogged).toBe(true);
  13 |     expect(results.logToConsole.dismountLogged).toBe(true);
  14 |     
  15 |     // Test 2: defineCustomElement with default export
> 16 |     expect(results.defineCustomElement.defaultExport.defined).toBe(true);
     |                                                               ^ Error: expect(received).toBe(expected) // Object.is equality
  17 |     expect(results.defineCustomElement.defaultExport.upgraded).toBe(true);
  18 |     expect(results.defineCustomElement.defaultExport.textContent).toBe('Fancy Button!');
  19 |     
  20 |     // Test 3: defineCustomElement with named export
  21 |     expect(results.defineCustomElement.namedExport.defined).toBe(true);
  22 |     expect(results.defineCustomElement.namedExport.upgraded).toBe(true);
  23 |     expect(results.defineCustomElement.namedExport.innerHTML).toContain('Simple Card');
  24 |     
  25 |     // Test 4: Multiple exports (should not define)
  26 |     expect(results.defineCustomElement.multipleExports.defined).toBe(false);
  27 |     
  28 |     // Test 5: No suitable class (should not define)
  29 |     expect(results.defineCustomElement.noSuitableClass.defined).toBe(false);
  30 |     
  31 |     // Test 6: Already defined element (should skip)
  32 |     expect(results.defineCustomElement.alreadyDefined.skipped).toBe(true);
  33 |     
  34 |     // Test 7: No module specified (should not define)
  35 |     expect(results.defineCustomElement.noModule.defined).toBe(false);
  36 |     
  37 |     // Test 8: Reusable class for multiple tag names
  38 |     expect(results.defineCustomElement.reusableClass.firstDefined).toBe(true);
  39 |     expect(results.defineCustomElement.reusableClass.firstText).toBe('I am a reusable-one');
  40 |     expect(results.defineCustomElement.reusableClass.secondDefined).toBe(true);
  41 |     expect(results.defineCustomElement.reusableClass.secondText).toBe('I am a reusable-two');
  42 | });
  43 | 
```