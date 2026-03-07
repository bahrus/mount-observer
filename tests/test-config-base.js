// Base configuration module for testing configFrom
export const mountConfig = {
    matching: '.test-config',
    do: (element, context) => {
        element.dataset.baseConfigApplied = 'true';
        element.textContent = 'Base config applied';
    }
};
