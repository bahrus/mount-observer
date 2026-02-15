// Test module for referenced withInstance
const withInstance = [HTMLButtonElement, HTMLInputElement];

const doFunction = function(element, context) {
    if (window.testResults) {
        window.testResults.push(`Module do called for ${element.tagName.toLowerCase()}`);
    }
    window.moduleDoCalledFor = window.moduleDoCalledFor || [];
    window.moduleDoCalledFor.push(element.id);
};

export { withInstance, doFunction as do };
