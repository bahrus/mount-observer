// Test module for referenced whereInstanceOf
const whereInstanceOf = [HTMLButtonElement, HTMLInputElement];

const doFunction = function(element, context) {
    if (window.testResults) {
        window.testResults.push(`Module do called for ${element.tagName.toLowerCase()}`);
    }
    window.moduleDoCalledFor = window.moduleDoCalledFor || [];
    window.moduleDoCalledFor.push(element.id);
};

export { whereInstanceOf, doFunction as do };
