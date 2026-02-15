import { test, expect } from '@playwright/test';

test.describe('WhereAttr Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-where-attr.html');
        await page.waitForFunction(() => window.testComplete === true, { timeout: 5000 });
    });

    test('Test 1: Built-in elements with various prefixes', async ({ page }) => {
        const results = await page.evaluate(() => window.testResults.test1);
        
        // Should match all prefixed inputs
        expect(results).toContain('input1'); // my-greetings
        expect(results).toContain('input2'); // data-my-greetings
        expect(results).toContain('input3'); // enh-my-greetings
        expect(results).toContain('input4'); // data-enh-my-greetings
        
        // Should NOT match input with different attribute
        expect(results).not.toContain('input5');
        
        expect(results.length).toBe(4);
    });

    test('Test 2: Custom elements should NOT match unprefixed attributes', async ({ page }) => {
        const results = await page.evaluate(() => window.testResults.test2);
        
        // Should NOT match unprefixed (ce1)
        expect(results).not.toContain('ce1');
        
        // Should match prefixed custom elements
        expect(results).toContain('ce2'); // data-my-greetings
        expect(results).toContain('ce3'); // enh-my-greetings
        expect(results).toContain('ce4'); // data-enh-my-greetings
        
        expect(results.length).toBe(3);
    });

    test('Test 3: Branch attributes', async ({ page }) => {
        const results = await page.evaluate(() => window.testResults.test3);
        
        // All should match as they have valid branch combinations
        expect(results).toContain('branch1'); // base only
        expect(results).toContain('branch2'); // base + hello
        expect(results).toContain('branch3'); // base + hello-how-are-you
        expect(results).toContain('branch4'); // base + goodbye
        expect(results).toContain('branch5'); // base + goodbye-last-words
        
        expect(results.length).toBe(5);
    });

    test('Test 4: Custom delimiters', async ({ page }) => {
        const results = await page.evaluate(() => window.testResults.test4);
        
        // All should match with custom delimiters
        expect(results).toContain('delim1'); // my-custom (base only)
        expect(results).toContain('delim2'); // my-custom + my-custom:hello
        expect(results).toContain('delim3'); // my-custom + my-custom:hello--how-are-you
        expect(results).toContain('delim4'); // my-custom + my-custom--goodbye
        expect(results).toContain('delim5'); // my-custom + my-custom--goodbye---last-words
        expect(results).toContain('delim6'); // my-custom--goodbye---last-words (branch only, no base)
        
        expect(results.length).toBe(6);
    });

    test('Test 5: AND condition with withMatching', async ({ page }) => {
        const results = await page.evaluate(() => window.testResults.test5);
        
        // Should match input and button with class AND attribute
        expect(results).toContain('and1'); // input.target with my-greetings
        expect(results).toContain('and2'); // button.target with my-greetings
        
        // Should NOT match div (not in selector)
        expect(results).not.toContain('and3');
        
        // Should NOT match input without class
        expect(results).not.toContain('and4');
        
        expect(results.length).toBe(2);
    });
});
