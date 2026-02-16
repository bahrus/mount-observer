import { test, expect } from '@playwright/test';

test.describe('Spawn On Mount', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-spawn-on-mount.html');
        await page.waitForFunction(() => window.setupComplete === true);
    });

    test('should spawn enhancement on mount', async ({ page }) => {
        const elements = await page.locator('.spawn-target').all();
        
        for (const element of elements) {
            // Check that element was enhanced
            const enhanced = await element.getAttribute('data-enhanced');
            expect(enhanced).toBe('true');
            
            // Check that enhancement instance exists
            const hasEnhancement = await element.evaluate((el) => {
                return el.enh.testEnh instanceof window.TestEnhancement;
            });
            expect(hasEnhancement).toBe(true);
            
            // Check that element reference is correct
            const elementMatches = await element.evaluate((el) => {
                return el.enh.testEnh.element === el;
            });
            expect(elementMatches).toBe(true);
        }
    });

    test('should pass mount context to spawned enhancement', async ({ page }) => {
        const element = await page.locator('.spawn-target').first();
        
        // Check that mountContext was passed
        const hasMountContext = await element.evaluate((el) => {
            const enh = el.enh.testEnh;
            return enh.mountContext !== null && 
                   enh.mountContext.observer !== undefined &&
                   enh.mountContext.modules !== undefined &&
                   enh.mountContext.rootNode !== undefined &&
                   enh.mountContext.MountConfig !== undefined;
        });
        expect(hasMountContext).toBe(true);
    });

    test('should spawn enhancement only once per element', async ({ page }) => {
        const element = await page.locator('.spawn-target').first();
        
        // Get the enhancement instance
        const firstInstance = await element.evaluate((el) => {
            return el.enh.testEnh;
        });
        
        // Trigger remount by removing and re-adding element
        await element.evaluate((el) => {
            const parent = el.parentNode;
            parent.removeChild(el);
            setTimeout(() => parent.appendChild(el), 10);
        });
        
        await page.waitForTimeout(50);
        
        // Get the enhancement instance again
        const secondInstance = await element.evaluate((el) => {
            return el.enh.testEnh;
        });
        
        // Should be the same instance (spawn only happens once)
        expect(firstInstance).toEqual(secondInstance);
    });

    test('should spawn with withAttrs parsing', async ({ page }) => {
        // This test verifies that spawn works with enhancementConfig
        // The withAttrs parsing is handled by assign-gingerly's enh.get()
        
        // Add element dynamically
        await page.evaluate(() => {
            const container = document.getElementById('test-container');
            const div = document.createElement('div');
            div.className = 'spawn-with-attrs dynamic';
            div.setAttribute('data-test-value', '123');
            container.appendChild(div);
        });
        
        await page.waitForTimeout(100);
        
        const element = await page.locator('.spawn-with-attrs.dynamic').first();
        
        // Check that enhancement exists (spawn happened)
        const hasEnh = await element.evaluate((el) => {
            return el.enh.testEnh2 !== undefined;
        });
        expect(hasEnh).toBe(true);
        
        // Check that the enhancement was constructed properly
        const hasElement = await element.evaluate((el) => {
            return el.enh.testEnh2?.element === el;
        });
        expect(hasElement).toBe(true);
        
        // Check that withAttrs parsed the attribute value
        const value = await element.evaluate((el) => {
            return el.enh.testEnh2?.value;
        });
        expect(value).toBe('123');
    });

    test('should respect canSpawn guard', async ({ page }) => {
        // Add element without data-allow attribute (should not spawn)
        await page.evaluate(() => {
            const container = document.getElementById('test-container');
            const div1 = document.createElement('div');
            div1.className = 'spawn-guarded';
            div1.id = 'no-allow';
            container.appendChild(div1);
        });
        
        await page.waitForTimeout(50);
        
        const noAllowElement = await page.locator('#no-allow');
        const notGuarded = await noAllowElement.getAttribute('data-guarded');
        expect(notGuarded).toBeNull();
        
        // Add element with data-allow attribute (should spawn)
        await page.evaluate(() => {
            const container = document.getElementById('test-container');
            const div2 = document.createElement('div');
            div2.className = 'spawn-guarded';
            div2.id = 'with-allow';
            div2.setAttribute('data-allow', 'true');
            container.appendChild(div2);
        });
        
        await page.waitForTimeout(50);
        
        const withAllowElement = await page.locator('#with-allow');
        const isGuarded = await withAllowElement.getAttribute('data-guarded');
        expect(isGuarded).toBe('true');
    });

    test('should spawn before do callback', async ({ page }) => {
        let doCallbackOrder = [];
        
        await page.evaluate(() => {
            window.doCallbackOrder = [];
            
            class OrderTestEnhancement {
                constructor(oElement) {
                    window.doCallbackOrder.push('spawn');
                }
            }
            
            const config = {
                matching: '.order-test',
                enhancementConfig: {
                    spawn: OrderTestEnhancement,
                    enhKey: 'orderEnh'
                },
                do: (element) => {
                    window.doCallbackOrder.push('do');
                }
            };
            
            const observer = new window.MountObserver(config);
            observer.observe(document.body);
            
            const container = document.getElementById('test-container');
            const div = document.createElement('div');
            div.className = 'order-test';
            container.appendChild(div);
        });
        
        await page.waitForTimeout(50);
        
        doCallbackOrder = await page.evaluate(() => window.doCallbackOrder);
        expect(doCallbackOrder).toEqual(['spawn', 'do']);
    });

    test('should work with dynamic elements', async ({ page }) => {
        // Add element dynamically
        await page.evaluate(() => {
            const container = document.getElementById('test-container');
            const div = document.createElement('div');
            div.className = 'spawn-target dynamic';
            div.setAttribute('data-value', '999');
            container.appendChild(div);
        });
        
        await page.waitForTimeout(50);
        
        const element = await page.locator('.spawn-target.dynamic');
        
        // Check that element was enhanced
        const enhanced = await element.getAttribute('data-enhanced');
        expect(enhanced).toBe('true');
        
        // Check that enhancement instance exists
        const hasEnhancement = await element.evaluate((el) => {
            return el.enh.testEnh instanceof window.TestEnhancement;
        });
        expect(hasEnhancement).toBe(true);
    });
});
