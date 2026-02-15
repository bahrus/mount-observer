import { test, expect } from '@playwright/test';

test.describe('Enhancement Registry Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tests/test-enhancement-registry.html');
        await page.waitForFunction(() => window.testResults !== undefined);
    });

    test('Test 1: No enhancementConfig provided - no registry interaction', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const observer = new MountObserver({
                matching: 'button',
                do: (element) => {
                    element.dataset.enhanced = 'true';
                }
            });
            
            await observer.observe(container);
            
            return {
                registryCount: window.testResults.registry.getItems().length
            };
        });
        
        expect(result.registryCount).toBe(0);
    });

    test('Test 2: enhancementConfig provided - successfully registered', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const enhancementConfig = {
                spawn: class TestEnhancement {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig
            });
            
            await observer.observe(container);
            
            const items = window.testResults.registry.getItems();
            return {
                registryCount: items.length,
                isRegistered: items.includes(enhancementConfig)
            };
        });
        
        expect(result.registryCount).toBe(1);
        expect(result.isRegistered).toBe(true);
    });

    test('Test 3: Same observer observes twice - only registered once (reference equality)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            // Create a second container with its own registry
            const container2 = document.createElement('div');
            container2.id = 'test-container-2';
            container2.customElementRegistry = {
                enhancementRegistry: window.testResults.registry
            };
            document.body.appendChild(container2);
            
            const enhancementConfig = {
                spawn: class TestEnhancement {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig
            });
            
            await observer.observe(container);
            
            // Try to observe again with a different observer instance but same config
            const observer2 = new MountObserver({
                matching: 'input',
                enhancementConfig  // Same object reference
            });
            
            await observer2.observe(container2);
            
            const items = window.testResults.registry.getItems();
            return {
                registryCount: items.length,
                isRegistered: items.includes(enhancementConfig)
            };
        });
        
        expect(result.registryCount).toBe(1);
        expect(result.isRegistered).toBe(true);
    });

    test('Test 4: Multiple observers with same enhancementConfig object - only registered once', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const sharedConfig = {
                spawn: class SharedEnhancement {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer1 = new MountObserver({
                matching: 'button',
                enhancementConfig: sharedConfig
            });
            
            const observer2 = new MountObserver({
                matching: 'input',
                enhancementConfig: sharedConfig  // Same object reference
            });
            
            await observer1.observe(container);
            await observer2.observe(container);
            
            const items = window.testResults.registry.getItems();
            return {
                registryCount: items.length,
                isRegistered: items.includes(sharedConfig)
            };
        });
        
        expect(result.registryCount).toBe(1);
        expect(result.isRegistered).toBe(true);
    });

    test('Test 5: Multiple observers with different enhancementConfig objects - both registered', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const config1 = {
                spawn: class Enhancement1 {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const config2 = {
                spawn: class Enhancement2 {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer1 = new MountObserver({
                matching: 'button',
                enhancementConfig: config1
            });
            
            const observer2 = new MountObserver({
                matching: 'input',
                enhancementConfig: config2  // Different object
            });
            
            await observer1.observe(container);
            await observer2.observe(container);
            
            const items = window.testResults.registry.getItems();
            return {
                registryCount: items.length,
                hasConfig1: items.includes(config1),
                hasConfig2: items.includes(config2)
            };
        });
        
        expect(result.registryCount).toBe(2);
        expect(result.hasConfig1).toBe(true);
        expect(result.hasConfig2).toBe(true);
    });

    test('Test 6: Re-observe after disconnect - still only registered once (reference equality)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container = document.getElementById('test-container');
            
            const enhancementConfig = {
                spawn: class TestEnhancement {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig
            });
            
            await observer.observe(container);
            observer.disconnect();
            
            // Re-observe with same observer
            await observer.observe(container);
            
            const items = window.testResults.registry.getItems();
            return {
                registryCount: items.length,
                isRegistered: items.includes(enhancementConfig)
            };
        });
        
        expect(result.registryCount).toBe(1);
        expect(result.isRegistered).toBe(true);
    });

    test('Test 7: Multiple root nodes - registers in each registry separately', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { MountObserver } = await import('../MountObserver.js');
            const container1 = document.getElementById('test-container');
            
            // Create a second container with its own registry
            const container2 = document.createElement('div');
            container2.id = 'test-container-2';
            const registry2 = {
                items: [],
                push(item) { this.items.push(item); },
                getItems() { return this.items; },
                findByEnhKey(enhKey) { return this.items.find(item => item.enhKey === enhKey); },
                findBySymbol(symbol) { return this.items.find(item => item.symlinks && symbol in item.symlinks); }
            };
            container2.customElementRegistry = {
                enhancementRegistry: registry2
            };
            document.body.appendChild(container2);
            
            const enhancementConfig = {
                spawn: class TestEnhancement {
                    constructor(element) {
                        this.element = element;
                    }
                }
            };
            
            const observer = new MountObserver({
                matching: 'button',
                enhancementConfig
            });
            
            await observer.observe(container1);
            observer.disconnect();
            await observer.observe(container2);
            
            return {
                registry1Count: window.testResults.registry.getItems().length,
                registry2Count: registry2.getItems().length,
                registry1Has: window.testResults.registry.getItems().includes(enhancementConfig),
                registry2Has: registry2.getItems().includes(enhancementConfig)
            };
        });
        
        expect(result.registry1Count).toBe(1);
        expect(result.registry2Count).toBe(1);
        expect(result.registry1Has).toBe(true);
        expect(result.registry2Has).toBe(true);
    });
});
