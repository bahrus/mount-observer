import { test, expect } from '@playwright/test';

test.describe('MountObserver - Reference Property', () => {
    test('should call both inline do and referenced do', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-reference.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testPassed !== undefined, { timeout: 5000 });
        
        // Check that both inline and referenced do were called
        const inlineCalled = await page.evaluate(() => window.inlineDoCalled);
        const referencedCalled = await page.evaluate(() => window.referencedDoCalled);
        
        expect(inlineCalled).toBe(true);
        expect(referencedCalled).toBe(true);
        
        // Verify context was passed correctly
        const results = await page.evaluate(() => window.testResults);
        expect(results).toContain('✓ Inline do called for test1');
        expect(results).toContain('Referenced do called for test1');
        expect(results).toContain('Has modules: true');
        expect(results).toContain('Has observer: true');
        expect(results).toContain('Has rootNode: true');
        expect(results).toContain('Has MountConfig: true');
    });
    
    test('should call multiple referenced do functions', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-reference.html');
        
        // Wait for test to complete
        await page.waitForFunction(() => window.testPassed !== undefined, { timeout: 5000 });
        
        // Check that both referenced modules were called
        const secondCalled = await page.evaluate(() => window.secondReferencedDoCalled);
        expect(secondCalled).toBe(true);
        
        const results = await page.evaluate(() => window.testResults);
        expect(results).toContain('Referenced do called for test2');
        expect(results).toContain('Second referenced do called for test2');
    });
});
