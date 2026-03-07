// Another test module for script nomodule handler
export const mountConfig = {
    matching: 'div.test2',
    do: (element) => {
        element.textContent = 'Module 2 loaded';
    }
};

export const testData = {
    name: 'Module 2',
    version: '2.0.0'
};
