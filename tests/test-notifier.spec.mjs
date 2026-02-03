import { test, expect } from '@playwright/test';

test('Element Notifier Tests', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-notifier.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Notifier created during do callback should NOT fire mount event
    expect(results.test1.notifierCreatedDuringDo).toBe(true);
    expect(results.test1.mountFiredOnObserver).toBe(true);
    expect(results.test1.mountFiredOnNotifier).toBe(false); // Should NOT fire
    
    // Test 2: Dismount and disconnect events
    expect(results.test2.dismountFiredOnNotifier).toBe(true);
    expect(results.test2.disconnectFiredOnNotifier).toBe(true);
    
    // Test 3: Notifier created before mount should fire mount event
    expect(results.test3.notifierCreatedBeforeMount).toBe(true);
    expect(results.test3.mountFiredAfterCreation).toBe(true);
    
    // Test 4: AttrChange events filtered correctly
    expect(results.test4.attrChangeFiredOnNotifier).toBe(true);
    expect(results.test4.attrChangeFilteredCorrectly).toBe(true);
    expect(results.test4.changesCount).toBe(1); // Only changes for input-1
    
    // Test 5: Mount event fires on subsequent mounts (after dismount)
    expect(results.test5.firstMountFired).toBe(true); // No mount on first (created during do)
    expect(results.test5.dismountFired).toBe(true);
    expect(results.test5.secondMountFired).toBe(true); // Mount fires on second
});
