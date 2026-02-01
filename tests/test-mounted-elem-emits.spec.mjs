import { test, expect } from '@playwright/test';

test.describe('MountedElemEmits Tests', () => {
    test('should emit simple event from mounted element', async ({ page }) => {
        const logs = [];
        const errors = [];
        
        // Listen for console messages
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            console.log('PAGE LOG:', text);
        });
        page.on('pageerror', err => {
            errors.push(err.message);
            console.log('PAGE ERROR:', err.message);
        });
        
        await page.goto('http://localhost:8000/tests/test-mounted-elem-emits.html');
        await page.waitForTimeout(500);
        
        console.log('All logs:', logs);
        console.log('All errors:', errors);
        
        const eventsReceived = await page.evaluate(() => window.eventsReceived);
        console.log('Events received:', eventsReceived);
        
        // Check that custom-ready event was received from btn1
        const customReadyEvent = eventsReceived.find(e => e.type === 'custom-ready' && e.target === 'btn1');
        expect(customReadyEvent).toBeTruthy();
    });
    
    test('should handle magic strings in event args', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-mounted-elem-emits.html');
        await page.waitForTimeout(200);
        
        // Add a button with data-test attribute
        await page.evaluate(() => {
            const btn = document.createElement('button');
            btn.id = 'magic-test';
            btn.setAttribute('data-test', 'true');
            document.getElementById('container').appendChild(btn);
        });
        
        await page.waitForTimeout(100);
        
        const eventsReceived = await page.evaluate(() => window.eventsReceived);
        
        // Check that element-mounted event was received with magic strings replaced
        const elementMountedEvent = eventsReceived.find(e => e.type === 'element-mounted');
        expect(elementMountedEvent).toBeTruthy();
        expect(elementMountedEvent.hasElement).toBe(true);
        expect(elementMountedEvent.hasConfig).toBe(true);
    });
    
    test('should emit multiple events in order', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-mounted-elem-emits.html');
        await page.waitForTimeout(200);
        
        // Add a button with data-multi attribute
        await page.evaluate(() => {
            const btn = document.createElement('button');
            btn.id = 'multi-test';
            btn.setAttribute('data-multi', 'true');
            document.getElementById('container').appendChild(btn);
        });
        
        await page.waitForTimeout(100);
        
        const eventsReceived = await page.evaluate(() => window.eventsReceived);
        
        // Check that both events were received
        const readyEvent = eventsReceived.find(e => e.type === 'ready' && e.target === 'multi-test');
        const initializedEvent = eventsReceived.find(e => e.type === 'initialized' && e.target === 'multi-test');
        
        expect(readyEvent).toBeTruthy();
        expect(initializedEvent).toBeTruthy();
        
        // Check order (ready should come before initialized)
        const readyIndex = eventsReceived.findIndex(e => e.type === 'ready' && e.target === 'multi-test');
        const initializedIndex = eventsReceived.findIndex(e => e.type === 'initialized' && e.target === 'multi-test');
        expect(readyIndex).toBeLessThan(initializedIndex);
    });
    
    test('should respect oncePerMountedElement flag', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-mounted-elem-emits.html');
        await page.waitForTimeout(200);
        
        // Add a button with data-once attribute
        await page.evaluate(() => {
            const btn = document.createElement('button');
            btn.id = 'once-test';
            btn.setAttribute('data-once', 'true');
            document.getElementById('container').appendChild(btn);
        });
        
        await page.waitForTimeout(100);
        
        let eventsReceived = await page.evaluate(() => window.eventsReceived);
        const initialCount = eventsReceived.filter(e => e.type === 'once-event' && e.target === 'once-test').length;
        expect(initialCount).toBe(1);
        
        // Remove and re-add the same button (simulating dismount/remount)
        await page.evaluate(() => {
            const btn = document.getElementById('once-test');
            btn.remove();
            // Re-add it
            document.getElementById('container').appendChild(btn);
        });
        
        await page.waitForTimeout(100);
        
        eventsReceived = await page.evaluate(() => window.eventsReceived);
        const finalCount = eventsReceived.filter(e => e.type === 'once-event' && e.target === 'once-test').length;
        
        // Should still be 1 (not fired again on remount)
        expect(finalCount).toBe(1);
    });
    
    test('should emit events for dynamically added elements', async ({ page }) => {
        await page.goto('http://localhost:8000/tests/test-mounted-elem-emits.html');
        await page.waitForTimeout(200);
        
        // Click the add button
        await page.click('#addBtn');
        await page.waitForTimeout(100);
        
        const eventsReceived = await page.evaluate(() => window.eventsReceived);
        
        // Check that events were emitted for dynamically added buttons
        const hasActionEvent = eventsReceived.some(e => e.type === 'custom-ready' && e.target.startsWith('btn-action-'));
        const hasTestEvent = eventsReceived.some(e => e.type === 'element-mounted');
        const hasMultiEvents = eventsReceived.some(e => e.type === 'ready' && e.target.startsWith('btn-multi-'));
        const hasOnceEvent = eventsReceived.some(e => e.type === 'once-event' && e.target.startsWith('btn-once-'));
        
        expect(hasActionEvent).toBe(true);
        expect(hasTestEvent).toBe(true);
        expect(hasMultiEvents).toBe(true);
        expect(hasOnceEvent).toBe(true);
    });
});
