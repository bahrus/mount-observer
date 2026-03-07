// Test module to verify class can be reused for multiple tag names
export default class ReusableElement extends HTMLElement {
    connectedCallback() {
        this.textContent = `I am a ${this.localName}`;
    }
}
