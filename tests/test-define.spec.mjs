import { test, expect } from '@playwright/test';

test('MountObserver.define Tests', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-define.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Basic string reference
    expect(results.test1.handlerCalled).toBe(true);
    expect(results.test1.elementText).toBe('Handler1 mounted');
    
    // Test 2: Array with mixed types
    expect(results.test2.handler1Called).toBe(true);
    expect(results.test2.inlineCalled).toBe(true);
    expect(results.test2.handler2Called).toBe(true);
    expect(results.test2.callOrder).toEqual(['handler1', 'inline', 'handler2']);
    
    // Test 3: Error when handler not defined
    expect(results.test3.errorThrown).toBe(true);
    expect(results.test3.errorMessage).toBe('No handler defined for nonexistent');
    
    // Test 4: Error when registering duplicate name
    expect(results.test4.errorThrown).toBe(true);
    expect(results.test4.errorMessage).toBe('handler1 already in use');
    
    // Test 5: Interaction with reference property
    expect(results.test5.handler1Called).toBe(true);
    expect(results.test5.handler2Called).toBe(true);
    expect(results.test5.referencedCalled).toBe(true);
    // Registered handlers run first, then referenced
    expect(results.test5.callOrder).toEqual(['registered1', 'registered2', 'referenced']);
});
