import { test, expect } from '@playwright/test';

test('assignOnMount and assignOnDismount Tests', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-assign-on-mount-dismount.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Basic assignOnMount
    expect(results.test1.elementMounted).toBe(true);
    expect(results.test1.colorOnMount).toBe('green');
    
    // Test 2: assignOnMount and assignOnDismount
    expect(results.test2.colorOnMount).toBe('green');
    expect(results.test2.dismounted).toBe(true);
    expect(results.test2.colorOnDismount).toBe('red');
    
    // Test 3: Multiple properties on mount
    expect(results.test3.disabledOnMount).toBe(true);
    expect(results.test3.valueOnMount).toBe('Default value');
    expect(results.test3.datasetOnMount).toBe('true');
    
    // Test 4: Remount after dismount
    expect(results.test4.colorOnMount).toBe('blue');
    expect(results.test4.colorOnDismount).toBe('yellow');
    expect(results.test4.dismountedTwice).toBe(true);
    
    // Test 5: Safe navigation
    expect(results.test5.safeNavigationWorked).toBe(true);
    expect(results.test5.nestedPropertySet).toBe(true);
});
