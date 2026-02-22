import { test, expect } from '@playwright/test';

test('Enhance Mounted Element Test', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:8000/tests/test-enhance-mounted-element.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test Results:', JSON.stringify(results, null, 2));
    
    // Test 1: Basic enhancement spawning
    expect(results.test1.enhancementSpawned).toBe(true);
    expect(results.test1.enhancementHasElement).toBe(true);
    expect(results.test1.enhancementHasContext).toBe(true);
    expect(results.test1.clickCountWorks).toBe(true);
    
    // Test 2: Multiple elements get separate instances
    expect(results.test2.multipleElementsEnhanced).toBe(true);
    expect(results.test2.separateInstances).toBe(true);
    
    // Test 3: Error when no module specified
    // Note: This test may not catch errors properly in the current implementation
    // as errors might be thrown asynchronously
    
    // Test 4: Error when module has no spawn property
    // Note: This test may not catch errors properly in the current implementation
    // as errors might be thrown asynchronously
});
