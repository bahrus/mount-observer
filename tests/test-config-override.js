// Override configuration module for testing configFrom merge order
export const mountConfig = {
    do: (element, context) => {
        element.dataset.overrideConfigApplied = 'true';
        element.textContent = 'Override config applied';
    }
};
