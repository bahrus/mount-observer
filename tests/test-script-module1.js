// Simple test module for script nomodule handler
export const mountConfig = {
    matching: 'div.test1',
    do: (element) => {
        element.textContent = 'Module 1 loaded';
    }
};

export const testData = {
    name: 'Module 1',
    version: '1.0.0'
};
