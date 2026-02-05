// Test module with default export
export default class FancyButton extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Fancy Button!';
        this.style.padding = '10px';
        this.style.backgroundColor = '#007bff';
        this.style.color = 'white';
        this.style.border = 'none';
        this.style.borderRadius = '4px';
    }
}
