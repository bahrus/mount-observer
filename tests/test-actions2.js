// Second test module for multiple references
// Note: 'do' is a reserved keyword, so we export it using bracket notation
const doFunction = function(element, context) {
    if (window.testResults) {
        window.testResults.push(`Second referenced do called for ${element.id}`);
    }
    window.secondReferencedDoCalled = true;
};

export { doFunction as do };
