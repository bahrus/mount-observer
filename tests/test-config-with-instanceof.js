// Configuration module with whereInstanceOf for testing
export const mountConfig = {
    matching: 'button',
    whereInstanceOf: HTMLButtonElement,
    do: (element, context) => {
        element.dataset.instanceofConfigApplied = 'true';
        element.textContent = 'Button config applied';
    }
};
