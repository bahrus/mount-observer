// Simple enhancement class for testing EMCScript
// Enhancement classes are Spawners - constructors that take an element and enhance it
export default class TestEnhancement {
    constructor(element, ctx, initVals) {
        this.element = element;
        this.ctx = ctx;
        this.initVals = initVals;
        
        // Apply enhancement to the element
        this.element.classList.add('enhanced');
        this.element.setAttribute('data-enhanced', 'true');
    }
    
    // Cleanup method (called on dispose)
    dispose() {
        this.element.classList.remove('enhanced');
        this.element.removeAttribute('data-enhanced');
    }
}
