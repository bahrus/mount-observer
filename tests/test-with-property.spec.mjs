import { test, expect } from '@playwright/test';

test('With Property Tests', async ({ page }) => {
    await page.goto('/tests/test-with-property.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test Results:', JSON.stringify(results, null, 2));
    
    // Test 1: Basic sub-observer creation
    expect(results.test1.parentMounted).toBe(true);
    expect(results.test1.childMounted).toBe(true);
    expect(results.test1.hasWithObservers).toBe(true);
    expect(results.test1.hasChildObserver).toBe(true);
    expect(results.test1.childObserverIsInstance).toBe(true);
    
    // Test 2: Multiple sub-observers
    expect(results.test2.child1Mounted).toBe(true);
    expect(results.test2.child2Mounted).toBe(true);
    expect(results.test2.hasCorrectKeys).toBe(true);
    expect(results.test2.keyCount).toBe(2);
    
    // Test 3: withObservers in MountContext
    expect(results.test3.hasWithObservers).toBe(true);
    expect(results.test3.hasSubObs).toBe(true);
    expect(results.test3.hasMountConfig).toBe(true);
    expect(results.test3.hasOldMountConfig).toBe(false); // Breaking change verification
    
    // Test 4: Sub-observer disconnection
    expect(results.test4.parentMounted).toBe(true);
    expect(results.test4.subObserverExisted).toBe(true);
    
    // Test 5: Nested sub-observers
    expect(results.test5.level1Mounted).toBe(true);
    expect(results.test5.level2Mounted).toBe(true);
    expect(results.test5.level3Mounted).toBe(true);
    
    // Test 6: Observer without with property
    expect(results.test6.withObserversIsUndefined).toBe(true);
    expect(results.test6.hasMountConfig).toBe(true);
    
    // Test 7: Empty with property
    expect(results.test7.withObserversIsUndefined).toBe(true);
    expect(results.test7.hasMountConfig).toBe(true);
});
