import { test, expect } from '@playwright/test';

test('Load Enhancement Config From Module', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-load-enhancement-config.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => window.testComplete === true, { timeout: 10000 });
    
    const results = await page.evaluate(() => window.testResults);
    
    // Test 1: Load enhancementConfig from referenced module
    expect(results.test1.enhancementSpawned).toBe(true);
    expect(results.test1.enhancementType).toBe('ButtonEnhancement');
    expect(results.test1.enhKeySet).toBe(true);
    
    // Test 2: Inline + referenced enhancementConfig
    expect(results.test2.inlineSpawned).toBe(true);
    expect(results.test2.referencedSpawned).toBe(true);
    expect(results.test2.bothPresent).toBe(true);
    
    // Test 3: Multiple enhancementConfigs (array)
    expect(results.test3.config1Present).toBe(true);
    expect(results.test3.config2Present).toBe(true);
    expect(results.test3.multipleReferencedSpawned).toBe(true);
});
