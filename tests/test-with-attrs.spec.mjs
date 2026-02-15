import { test, expect } from '@playwright/test';

test.describe('WithAttrs Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-with-attrs.html');
        await page.waitForFunction(() => window.testResults !== undefined);
    });

    test('Test 1: Element with matching attribute mounts', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            let mounted = false;
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        theme: '${base}theme'
                    }
                },
                do: (element) => {
                    mounted = true;
                }
            });
            
            await observer.observe(container);
            
            // Add button with data-theme attribute
            const button = document.createElement('button');
            button.setAttribute('data-theme', 'dark');
            container.appendChild(button);
            
            // Wait for mount
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mounted };
        });
        
        expect(result.mounted).toBe(true);
    });

    test('Test 2: Element without matching attribute does not mount', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            let mounted = false;
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        theme: '${base}theme'
                    }
                },
                do: (element) => {
                    mounted = true;
                }
            });
            
            await observer.observe(container);
            
            // Add button without data-theme attribute
            const button = document.createElement('button');
            container.appendChild(button);
            
            // Wait
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mounted };
        });
        
        expect(result.mounted).toBe(false);
    });

    test('Test 3: Element with enh- prefix mounts', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            let mounted = false;
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        theme: '${base}theme'
                    }
                },
                do: (element) => {
                    mounted = true;
                }
            });
            
            await observer.observe(container);
            
            // Add button with enh-data-theme attribute
            const button = document.createElement('button');
            button.setAttribute('enh-data-theme', 'dark');
            container.appendChild(button);
            
            // Wait for mount
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mounted };
        });
        
        expect(result.mounted).toBe(true);
    });

    test('Test 4: Element with any one of multiple attributes mounts (OR logic)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const mountedElements = [];
            const observer = new MountObserver({
                matching: 'input',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        required: '${base}required',
                        disabled: '${base}disabled'
                    }
                },
                do: (element) => {
                    mountedElements.push(element.id);
                }
            });
            
            await observer.observe(container);
            
            // Add input with data-required
            const input1 = document.createElement('input');
            input1.id = 'input1';
            input1.setAttribute('data-required', '');
            container.appendChild(input1);
            
            // Add input with data-disabled
            const input2 = document.createElement('input');
            input2.id = 'input2';
            input2.setAttribute('data-disabled', '');
            container.appendChild(input2);
            
            // Add input with both
            const input3 = document.createElement('input');
            input3.id = 'input3';
            input3.setAttribute('data-required', '');
            input3.setAttribute('data-disabled', '');
            container.appendChild(input3);
            
            // Add input with neither
            const input4 = document.createElement('input');
            input4.id = 'input4';
            container.appendChild(input4);
            
            // Wait for mounts
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mountedElements };
        });
        
        expect(result.mountedElements).toContain('input1');
        expect(result.mountedElements).toContain('input2');
        expect(result.mountedElements).toContain('input3');
        expect(result.mountedElements).not.toContain('input4');
        expect(result.mountedElements.length).toBe(3);
    });

    test('Test 5: Works with other AND conditions', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const mountedElements = [];
            const observer = new MountObserver({
                matching: 'input',
                withInstance: HTMLInputElement,
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        required: '${base}required'
                    }
                },
                do: (element) => {
                    mountedElements.push(element.id);
                }
            });
            
            await observer.observe(container);
            
            // Add input with data-required (should mount)
            const input1 = document.createElement('input');
            input1.id = 'input1';
            input1.setAttribute('data-required', '');
            container.appendChild(input1);
            
            // Add button with data-required (should NOT mount - wrong element type)
            const button = document.createElement('button');
            button.id = 'button1';
            button.setAttribute('data-required', '');
            container.appendChild(button);
            
            // Add input without data-required (should NOT mount - missing attribute)
            const input2 = document.createElement('input');
            input2.id = 'input2';
            container.appendChild(input2);
            
            // Wait for mounts
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mountedElements };
        });
        
        expect(result.mountedElements).toContain('input1');
        expect(result.mountedElements).not.toContain('button1');
        expect(result.mountedElements).not.toContain('input2');
        expect(result.mountedElements.length).toBe(1);
    });

    test('Test 6: No withAttrs specified - no attribute checking', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            let mounted = false;
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig: {
                    spawn: class TestClass {}
                },
                do: (element) => {
                    mounted = true;
                }
            });
            
            await observer.observe(container);
            
            // Add button without any attributes
            const button = document.createElement('button');
            container.appendChild(button);
            
            // Wait for mount
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mounted };
        });
        
        expect(result.mounted).toBe(true);
    });

    test('Test 7: Custom element with enh- prefix (strict enforcement)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            // Define custom element
            if (!customElements.get('my-element')) {
                customElements.define('my-element', class extends HTMLElement {});
            }
            
            const mountedElements = [];
            const observer = new MountObserver({
                matching: 'my-element',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        theme: '${base}theme'
                    }
                },
                do: (element) => {
                    mountedElements.push(element.id);
                }
            });
            
            await observer.observe(container);
            
            // Add custom element with unprefixed attribute (should NOT mount)
            const elem1 = document.createElement('my-element');
            elem1.id = 'elem1';
            elem1.setAttribute('data-theme', 'dark');
            container.appendChild(elem1);
            
            // Add custom element with enh- prefix (should mount)
            const elem2 = document.createElement('my-element');
            elem2.id = 'elem2';
            elem2.setAttribute('enh-data-theme', 'dark');
            container.appendChild(elem2);
            
            // Wait for mounts
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mountedElements };
        });
        
        expect(result.mountedElements).not.toContain('elem1');
        expect(result.mountedElements).toContain('elem2');
        expect(result.mountedElements.length).toBe(1);
    });

    test('Test 8: Custom element with allowUnprefixed pattern', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            // Define custom elements
            if (!customElements.get('my-widget')) {
                customElements.define('my-widget', class extends HTMLElement {});
            }
            if (!customElements.get('other-widget')) {
                customElements.define('other-widget', class extends HTMLElement {});
            }
            
            const mountedElements = [];
            const observer = new MountObserver({
                matching: 'my-widget, other-widget',
                enhancementConfig: {
                    allowUnprefixed: '^my-',
                    withAttrs: {
                        base: 'data-',
                        theme: '${base}theme'
                    }
                },
                do: (element) => {
                    mountedElements.push(element.id);
                }
            });
            
            await observer.observe(container);
            
            // Add my-widget with unprefixed attribute (should mount - matches pattern)
            const elem1 = document.createElement('my-widget');
            elem1.id = 'elem1';
            elem1.setAttribute('data-theme', 'dark');
            container.appendChild(elem1);
            
            // Add other-widget with unprefixed attribute (should NOT mount - doesn't match pattern)
            const elem2 = document.createElement('other-widget');
            elem2.id = 'elem2';
            elem2.setAttribute('data-theme', 'dark');
            container.appendChild(elem2);
            
            // Add other-widget with enh- prefix (should mount - enh- always works)
            const elem3 = document.createElement('other-widget');
            elem3.id = 'elem3';
            elem3.setAttribute('enh-data-theme', 'dark');
            container.appendChild(elem3);
            
            // Wait for mounts
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mountedElements };
        });
        
        expect(result.mountedElements).toContain('elem1');
        expect(result.mountedElements).not.toContain('elem2');
        expect(result.mountedElements).toContain('elem3');
        expect(result.mountedElements.length).toBe(2);
    });

    test('Test 9: Base attribute checking', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const mountedElements = [];
            const observer = new MountObserver({
                matching: 'div',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-config',
                        theme: '${base}-theme'
                    }
                },
                do: (element) => {
                    mountedElements.push(element.id);
                }
            });
            
            await observer.observe(container);
            
            // Add div with base attribute (should mount)
            const div1 = document.createElement('div');
            div1.id = 'div1';
            div1.setAttribute('data-config', '{}');
            container.appendChild(div1);
            
            // Add div with theme attribute (should mount)
            const div2 = document.createElement('div');
            div2.id = 'div2';
            div2.setAttribute('data-config-theme', 'dark');
            container.appendChild(div2);
            
            // Add div with no attributes (should NOT mount)
            const div3 = document.createElement('div');
            div3.id = 'div3';
            container.appendChild(div3);
            
            // Wait for mounts
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mountedElements };
        });
        
        expect(result.mountedElements).toContain('div1');
        expect(result.mountedElements).toContain('div2');
        expect(result.mountedElements).not.toContain('div3');
        expect(result.mountedElements.length).toBe(2);
    });

    test('Test 10: Template resolution with multiple variables', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            let mounted = false;
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig: {
                    withAttrs: {
                        base: 'data-',
                        prefix: '${base}btn',
                        theme: '${prefix}-theme'
                    }
                },
                do: (element) => {
                    mounted = true;
                }
            });
            
            await observer.observe(container);
            
            // Add button with data-btn-theme attribute
            const button = document.createElement('button');
            button.setAttribute('data-btn-theme', 'dark');
            container.appendChild(button);
            
            // Wait for mount
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return { mounted };
        });
        
        expect(result.mounted).toBe(true);
    });
});
