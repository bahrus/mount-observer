import { test, expect } from '@playwright/test';

test.describe('HTMLInclude Shadow DOM Nested Templates', () => {
    test('should attach shadow root with nested template structure', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-html-include-shadow-nested.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(500);
        
        // Check that shadow root was created on the chorus element
        const hasShadow = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            return chorus?.shadowRoot !== null;
        });
        expect(hasShadow).toBe(true);
        
        // Check that the main template was removed
        const chorus = page.locator('.chorus');
        const mainTemplate = await chorus.locator('> template[src="#chorus"]').count();
        expect(mainTemplate).toBe(0);
        
        // Check that light DOM slots are still present
        const lightDomSlots = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            return Array.from(chorus?.querySelectorAll('[slot]') || []).map(el => ({
                slot: el.getAttribute('slot'),
                text: el.textContent
            }));
        });
        
        expect(lightDomSlots.length).toBe(6);
        expect(lightDomSlots.some(s => s.slot === 'verb1' && s.text === "can't")).toBe(true);
        expect(lightDomSlots.some(s => s.slot === 'pronoun1' && s.text === 'me')).toBe(true);
        expect(lightDomSlots.some(s => s.slot === 'subjectIs1' && s.text === 'I am')).toBe(true);
        
        // Check that shadow DOM contains the expected structure from the chorus template
        const shadowStructure = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            const shadow = chorus?.shadowRoot;
            if (!shadow) return null;
            
            return {
                hasNoMatterWhat: shadow.textContent?.includes('No matter what they say'),
                hasInEveryWay: shadow.textContent?.includes('In every single way'),
                hasWordsBring: shadow.textContent?.includes('Words'),
                slotCount: shadow.querySelectorAll('slot').length,
                // Nested templates are NOT processed automatically (expected behavior)
                nestedTemplateCount: shadow.querySelectorAll('template[src]').length
            };
        });
        
        expect(shadowStructure?.hasNoMatterWhat).toBe(true);
        expect(shadowStructure?.hasInEveryWay).toBe(true);
        expect(shadowStructure?.hasWordsBring).toBe(true);
        expect(shadowStructure?.slotCount).toBeGreaterThan(0);
        
        // Nested templates remain unprocessed (this is expected - observer doesn't auto-observe shadow roots)
        expect(shadowStructure?.nestedTemplateCount).toBe(3);
        
        // Verify that slots are working by checking rendered content
        const renderedText = await page.locator('.chorus').textContent();
        
        // The rendered text should include slotted light DOM content
        expect(renderedText).toContain("can't");
        expect(renderedText).toContain('me');
        expect(renderedText).toContain('I am');
    });
    
    test('should allow manual observation of shadow root for nested templates', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        
        await page.goto('http://localhost:8000/tests/test-html-include-shadow-nested.html');
        await page.waitForFunction(() => window.testsReady === true);
        await page.waitForTimeout(500);
        
        // Manually observe the shadow root to process nested templates
        await page.evaluate(async () => {
            const { MountObserver } = await import('../index.js');
            const chorus = document.querySelector('.chorus');
            if (chorus?.shadowRoot) {
                const shadowObserver = new MountObserver({
                    do: 'builtIns.HTMLInclude'
                });
                await shadowObserver.observe(chorus.shadowRoot);
            }
        });
        
        await page.waitForTimeout(500);
        
        // Now nested templates should be processed
        const nestedTemplateCount = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            const shadow = chorus?.shadowRoot;
            if (!shadow) return -1;
            
            return shadow.querySelectorAll('template[src]').length;
        });
        
        // After observing the shadow root, nested templates should be processed (removed)
        expect(nestedTemplateCount).toBe(0);
        
        // Check that the nested content was inserted
        const hasBeautifulContent = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            const shadow = chorus?.shadowRoot;
            return shadow?.textContent?.includes('beautiful');
        });
        expect(hasBeautifulContent).toBe(true);
        
        const hasDontBringMeDown = await page.evaluate(() => {
            const chorus = document.querySelector('.chorus');
            const shadow = chorus?.shadowRoot;
            return shadow?.textContent?.includes("So don't you bring me down today");
        });
        expect(hasDontBringMeDown).toBe(true);
    });
});
