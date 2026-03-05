import { test, expect } from '@playwright/test';

test('Hoist Template Tests', async ({ page }) => {
    // Navigate to test page
    await page.goto('/tests/test-hoist-template.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    // Get results
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test results:', results);
    
    // Test 1: Basic hoisting from shadow root
    expect(results.test1.hoisted).toBe(true);
    expect(results.test1.srcSet).toBe(true);
    expect(results.test1.inHead).toBe(true);
    expect(results.test1.remoteContentWorks).toBe(true);
    
    // Test 2: Multiple templates in same shadow root
    expect(results.test2.template1Hoisted).toBe(true);
    expect(results.test2.template2Hoisted).toBe(true);
    expect(results.test2.bothInHead).toBe(true);
    
    // Test 3: Template with no ID (should not hoist)
    expect(results.test3.notHoisted).toBe(true);
    expect(results.test3.hasContent).toBe(true); // Content should remain
    
    // Test 4: Template already has src (should not hoist)
    expect(results.test4.notHoisted).toBe(true);
    expect(results.test4.srcUnchanged).toBe(true);
    
    // Test 5: Empty template (should not hoist)
    expect(results.test5.notHoisted).toBe(true);
    
    // Test 6: remoteContent getter
    expect(results.test6.remoteContentReturnsFragment).toBe(true);
    expect(results.test6.fragmentHasContent).toBe(true);
});
