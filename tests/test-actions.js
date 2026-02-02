// Test module for reference property
// Note: 'do' is a reserved keyword, so we export it using bracket notation
const doFunction = function(element, context) {
    if (window.testResults) {
        window.testResults.push(`Referenced do called for ${element.id}`);
        window.testResults.push(`Has modules: ${Array.isArray(context.modules)}`);
        window.testResults.push(`Has observer: ${context.observer !== undefined}`);
        window.testResults.push(`Has rootNode: ${context.rootNode !== undefined}`);
        window.testResults.push(`Has mountInit: ${context.mountInit !== undefined}`);
    }
    if (window.results) {
        window.results.referencedCalled = true;
    }
    window.referencedDoCalled = true;
};

export { doFunction as do };
