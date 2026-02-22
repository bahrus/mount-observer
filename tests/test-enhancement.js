// Test enhancement for EnhanceMountedElementHandler

class ButtonEnhancement {
    constructor(element, ctx, initVals) {
        this.element = element;
        this.ctx = ctx;
        this.clickCount = 0;
        this.initialized = true;
        
        // Add click listener
        this.onClick = this.onClick.bind(this);
        element.addEventListener('click', this.onClick);
        
        // Apply initial values if provided
        if (initVals) {
            Object.assign(this, initVals);
        }
    }
    
    onClick(e) {
        this.clickCount++;
        this.element.setAttribute('data-clicks', this.clickCount.toString());
    }
    
    dispose() {
        if (this.element) {
            this.element.removeEventListener('click', this.onClick);
        }
    }
}

// Export as registry item with spawn property
export default {
    spawn: ButtonEnhancement,
    enhKey: 'buttonEnh'
};
