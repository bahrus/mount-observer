import { test, expect } from '@playwright/test';

test('getRootRegistryContainer Tests', async ({ page }) => {
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        logs.push(msg.text());
        console.log('BROWSER:', msg.text());
    });
    
    await page.goto('/tests/test-get-root-registry-container.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test results:', JSON.stringify(results, null, 2));
    console.log('All browser logs:', logs);
    
    // Test 1: Null input
    expect(results.test1.passed).toBe(true);
    
    // Test 2: Undefined input
    expect(results.test2.passed).toBe(true);
    
    // Test 3: Element without custom registry
    console.log('Test 3 result:', results.test3);
    expect(results.test3.passed).toBe(true);
    
    // Test 4: Walks up parent chain
    expect(results.test4.passed).toBe(true);
    
    // Test 5: Shadow root traversal
    expect(results.test5.passed).toBe(true);
    
    // Test 6: Returns highest matching node
    expect(results.test6.passed).toBe(true);
    
    // Test 7: Works with text nodes
    expect(results.test7.passed).toBe(true);
});
