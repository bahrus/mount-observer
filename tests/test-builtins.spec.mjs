import { test, expect } from '@playwright/test';

test('Built-in Handlers Tests', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-builtins.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 15000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: logToConsole handler
    expect(results.logToConsole.mountLogged).toBe(true);
    expect(results.logToConsole.dismountLogged).toBe(true);
    
    // Test 2: defineCustomElement with default export
    expect(results.defineCustomElement.defaultExport.defined).toBe(true);
    expect(results.defineCustomElement.defaultExport.upgraded).toBe(true);
    expect(results.defineCustomElement.defaultExport.textContent).toBe('Fancy Button!');
    
    // Test 3: defineCustomElement with named export
    expect(results.defineCustomElement.namedExport.defined).toBe(true);
    expect(results.defineCustomElement.namedExport.upgraded).toBe(true);
    expect(results.defineCustomElement.namedExport.innerHTML).toContain('Simple Card');
    
    // Test 4: Multiple exports (should not define)
    expect(results.defineCustomElement.multipleExports.defined).toBe(false);
    
    // Test 5: No suitable class (should not define)
    expect(results.defineCustomElement.noSuitableClass.defined).toBe(false);
    
    // Test 6: Already defined element (should skip)
    expect(results.defineCustomElement.alreadyDefined.skipped).toBe(true);
    
    // Test 7: No module specified (should not define)
    expect(results.defineCustomElement.noModule.defined).toBe(false);
    
    // Test 8: Reusable class for multiple tag names
    expect(results.defineCustomElement.reusableClass.firstDefined).toBe(true);
    expect(results.defineCustomElement.reusableClass.firstText).toBe('I am a reusable-one');
    expect(results.defineCustomElement.reusableClass.secondDefined).toBe(true);
    expect(results.defineCustomElement.reusableClass.secondText).toBe('I am a reusable-two');
});
