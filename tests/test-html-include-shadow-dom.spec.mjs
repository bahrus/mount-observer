import { test, expect } from '@playwright/test';

test.describe('HTMLInclude Shadow DOM Support', () => {
    test('should attach cloned content to shadow root when shadowrootmodeonload is present', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-html-include-shadow-dom.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(200);
        
        // Check that shadow roots were created
        const host1HasShadow = await page.evaluate(() => {
            const host = document.querySelector('.host-element');
            return host?.shadowRoot !== null;
        });
        expect(host1HasShadow).toBe(true);
        
        const host2HasShadow = await page.evaluate(() => {
            const host = document.querySelector('.host-element-2');
            return host?.shadowRoot !== null;
        });
        expect(host2HasShadow).toBe(true);
        
        // Check that templates were removed
        const host1 = page.locator('.host-element');
        await expect(host1.locator('template')).toHaveCount(0);
        
        const host2 = page.locator('.host-element-2');
        await expect(host2.locator('template')).toHaveCount(0);
        
        // Check that shadow DOM has slots
        const hasSlotsInShadow1 = await page.evaluate(() => {
            const host = document.querySelector('.host-element');
            const slots = host?.shadowRoot?.querySelectorAll('slot');
            return slots ? slots.length : 0;
        });
        expect(hasSlotsInShadow1).toBe(2); // greeting slot + default slot
        
        // Check that the rendered/composed content is visible (Playwright sees slotted content)
        const renderedContent1 = await page.locator('.host-element').textContent();
        expect(renderedContent1).toContain('Hello');
        expect(renderedContent1).toContain('World');
        
        const renderedContent2 = await page.locator('.host-element-2').textContent();
        expect(renderedContent2).toContain('Goodbye');
        expect(renderedContent2).toContain('Universe');
        
        // Check that light DOM slots are still present
        const lightDomSlots1 = await page.evaluate(() => {
            const host = document.querySelector('.host-element');
            return Array.from(host?.querySelectorAll('[slot]') || []).map(el => el.textContent);
        });
        expect(lightDomSlots1).toContain('Hello');
        
        // Check that styles are scoped to shadow DOM
        const hasStyle = await page.evaluate(() => {
            const host = document.querySelector('.host-element');
            return host?.shadowRoot?.querySelector('style') !== null;
        });
        expect(hasStyle).toBe(true);
    });
    
    test('should use normal insertion when shadowrootmodeonload is not present', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        // Use goto instead of setContent to ensure proper module loading
        await page.goto('http://localhost:8000/tests/test-html-include-simple.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(200);
        
        const testDiv = page.locator('#test');
        
        // Check that no shadow root was created
        const hasShadow = await page.evaluate(() => {
            const testDiv = document.querySelector('#test');
            // Check all children for shadow roots
            const children = Array.from(testDiv?.children || []);
            return children.some(child => child.shadowRoot !== null);
        });
        expect(hasShadow).toBe(false);
        
        // Check that content was cloned (should have 2: original + clone)
        const clones = await testDiv.locator('div:has(> p:text("Source content"))').count();
        expect(clones).toBe(2);
        
        // Template should be removed
        await expect(testDiv.locator('template[src="#source"]')).toHaveCount(0);
    });
    
    test('should handle invalid shadowrootmodeonload values', async ({ page }) => {
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
            console.log('BROWSER:', msg.text());
        });
        
        await page.goto('http://localhost:8000/tests/test-html-include-simple.html');
        
        // Inject a test case with invalid shadowrootmodeonload
        await page.evaluate(() => {
            const testDiv = document.querySelector('#test');
            const source = document.createElement('div');
            source.id = 'invalid-test-source';
            source.innerHTML = '<p>Invalid test content</p>';
            testDiv.appendChild(source);
            
            const container = document.createElement('div');
            container.className = 'invalid-container';
            const template = document.createElement('template');
            template.setAttribute('src', '#invalid-test-source');
            template.setAttribute('shadowrootmodeonload', 'invalid');
            container.appendChild(template);
            testDiv.appendChild(container);
        });
        
        await page.waitForTimeout(500);
        
        // Check that warning was logged
        const hasWarning = consoleMessages.some(msg => 
            msg.includes('Invalid shadowRootModeOnLoad value')
        );
        expect(hasWarning).toBe(true);
        
        // Check that no shadow root was created
        const hasShadow = await page.evaluate(() => {
            const container = document.querySelector('.invalid-container');
            return container?.shadowRoot !== null;
        });
        expect(hasShadow).toBe(false);
        
        // Template should still be present (operation failed)
        const container = page.locator('.invalid-container');
        await expect(container.locator('template')).toHaveCount(1);
    });
    
    test('should reuse existing shadow root if present', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-html-include-simple.html');
        await page.waitForFunction(() => window.testsReady === true);
        
        // Create a test case with existing shadow root
        await page.evaluate(() => {
            const testDiv = document.querySelector('#test');
            
            // Create source
            const source = document.createElement('div');
            source.id = 'reuse-source';
            source.innerHTML = '<p>New content</p>';
            testDiv.appendChild(source);
            
            // Create container with existing shadow root
            const container = document.createElement('div');
            container.className = 'reuse-container';
            const shadow = container.attachShadow({ mode: 'open' });
            shadow.innerHTML = '<p>Existing content</p>';
            
            // Add template
            const template = document.createElement('template');
            template.setAttribute('src', '#reuse-source');
            template.setAttribute('shadowrootmodeonload', 'open');
            container.appendChild(template);
            
            testDiv.appendChild(container);
        });
        
        await page.waitForTimeout(500);
        
        // Check that shadow root still exists
        const hasShadow = await page.evaluate(() => {
            const container = document.querySelector('.reuse-container');
            return container?.shadowRoot !== null;
        });
        expect(hasShadow).toBe(true);
        
        // Check that new content was appended (both old and new should exist)
        const shadowContent = await page.evaluate(() => {
            const container = document.querySelector('.reuse-container');
            return container?.shadowRoot?.innerHTML;
        });
        expect(shadowContent).toContain('Existing content');
        expect(shadowContent).toContain('New content');
    });
});
