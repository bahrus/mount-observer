import { test, expect } from '@playwright/test';

test('Synthesizer filtering tests', async ({ page }) => {
    await page.goto('/tests/test-synthesizer-filtering.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });
    
    // Get test results
    const results = await page.evaluate(() => window.testResults);
    const error = await page.evaluate(() => window.testError);
    
    if (error) {
        throw new Error(`Test error: ${error}`);
    }
    
    console.log('Test Results:', JSON.stringify(results, null, 2));
    
    // Test 1: Include attribute - only script1 and script2 should be syndicated
    expect(results.test1.syndicatorExists).toBe(true);
    expect(results.test1.subscriberExists).toBe(true);
    expect(results.test1.scriptCount).toBe(2);
    expect(results.test1.hasScript1).toBe(true);
    expect(results.test1.hasScript2).toBe(true);
    expect(results.test1.hasScript3).toBe(false); // Excluded because not in include list
    
    // Test 2: Exclude attribute - script5 should be syndicated, script4 should not
    expect(results.test2.syndicatorExists).toBe(true);
    expect(results.test2.subscriberExists).toBe(true);
    expect(results.test2.scriptCount).toBe(1);
    expect(results.test2.hasScript4).toBe(false); // Excluded
    expect(results.test2.hasScript5).toBe(true);
    
    // Test 3: Passthrough attribute - no scripts should be syndicated
    expect(results.test3.syndicatorExists).toBe(true);
    expect(results.test3.subscriberExists).toBe(true);
    expect(results.test3.scriptCount).toBe(0);
    expect(results.test3.hasScript6).toBe(false);
    
    // Test 4: Security - script without ID should be excluded when include attribute present
    expect(results.test4.syndicatorExists).toBe(true);
    expect(results.test4.subscriberExists).toBe(true);
    expect(results.test4.scriptCount).toBe(1);
    expect(results.test4.hasScript7).toBe(true);
    expect(results.test4.hasScriptWithoutId).toBe(false); // Security: excluded because no ID
});
