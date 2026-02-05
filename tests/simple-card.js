// Test module with single named export
export class SimpleCard extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<div style="border: 1px solid #ccc; padding: 10px;">Simple Card</div>';
    }
}
