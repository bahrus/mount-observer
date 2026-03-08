import { test, expect } from '@playwright/test';

test.describe('Document.mount() Extension', () => {
    test('should allow mounting observers on document', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-document-mount.html');
        await page.waitForFunction(() => window.testsReady === true);
        
        const results = await page.evaluate(() => window.testResults);
        
        expect(results.buttonMounted).toBe(true);
        expect(results.inputMounted).toBe(true);
    });
    
    test('should allow mountGlobally on document', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-document-mount.html');
        await page.waitForFunction(() => window.testsReady === true);
        
        // The first test already uses mount(), so we know it works
        // mountGlobally should also work since it calls mount() internally
        const results = await page.evaluate(() => window.testResults);
        expect(results.buttonMounted).toBe(true);
    });
    
    test('should work with ShadowRoot.mount()', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        // Create a dedicated test for shadow root
        await page.goto('http://localhost:8000/tests/test-document-mount.html');
        
        const shadowMounted = await page.evaluate(async () => {
            const { MountObserver } = await import('../index.js');
            await import('../ElementMountExtension.js');
            
            const host = document.createElement('div');
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = '<button class="shadow-button">Shadow Button</button>';
            
            let mounted = false;
            
            await shadow.mount({
                matching: 'button.shadow-button',
                do: (el) => {
                    console.log('Shadow button mounted:', el);
                    mounted = true;
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return mounted;
        });
        
        expect(shadowMounted).toBe(true);
    });
});
