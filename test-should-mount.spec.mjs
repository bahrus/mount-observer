import { test, expect } from '@playwright/test';

test('shouldMount Tests', async ({ page }) => {
    // Navigate to test page
    await page.goto('/test-should-mount.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testResults !== undefined, { timeout: 5000 });
    
    // Get results
    const results = await page.evaluate(() => window.testResults);
    
    console.log('Test results:', results);
    
    // Test 1: shouldMount returns true - element should mount
    expect(results.test1.mounted).toBe(true);
    const test1El = await page.$('.test1[data-mounted="true"]');
    expect(test1El).not.toBeNull();
    
    // Test 2: shouldMount returns false - element should NOT mount
    expect(results.test2.mounted).toBe(false);
    const test2El = await page.$('.test2[data-mounted="true"]');
    expect(test2El).toBeNull();
    
    // Test 3: Permission check - only admin should mount
    expect(results.test3.adminMounted).toBe(true);
    expect(results.test3.userMounted).toBe(false);
    const adminEl = await page.$('.test3[data-role="admin"][data-mounted="true"]');
    expect(adminEl).not.toBeNull();
    const userEl = await page.$('.test3[data-role="user"][data-mounted="true"]');
    expect(userEl).toBeNull();
    
    // Test 4: Data validation - only valid element should mount
    expect(results.test4.validMounted).toBe(true);
    expect(results.test4.invalidCount).toBe(2); // Two invalid elements
    const validEl = await page.$('.test4[data-api-key="abc123"][data-mounted="true"]');
    expect(validEl).not.toBeNull();
    const invalidEls = await page.$$('.test4[data-mounted="true"]');
    expect(invalidEls.length).toBe(1); // Only one mounted
    
    // Test 5: Error handling - element should NOT mount when error thrown
    expect(results.test5.mounted).toBe(false);
    expect(results.test5.errorLogged).toBe(true);
    const test5El = await page.$('.test5[data-mounted="true"]');
    expect(test5El).toBeNull();
    
    // Test 6: Context access - should receive context
    expect(results.test6.mounted).toBe(true);
    expect(results.test6.contextReceived).toBe(true);
    const test6El = await page.$('.test6[data-mounted="true"]');
    expect(test6El).not.toBeNull();
    
    // Test 7: Re-evaluation - should mount on second attempt
    expect(results.test7.firstAttempt).toBe(true); // First attempt blocked
    expect(results.test7.secondAttempt).toBe(true); // Second attempt allowed
    const test7El = await page.$('.test7[data-mounted="true"]');
    expect(test7El).not.toBeNull();
});
