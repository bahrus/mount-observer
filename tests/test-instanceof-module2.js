// Second test module for multiple references with whereInstanceOf
const whereInstanceOf = HTMLDivElement;

const doFunction = function(element, context) {
    if (window.testResults) {
        window.testResults.push(`Module2 do called for ${element.tagName.toLowerCase()}`);
    }
    window.module2DoCalledFor = window.module2DoCalledFor || [];
    window.module2DoCalledFor.push(element.id);
};

export { whereInstanceOf, doFunction as do };
