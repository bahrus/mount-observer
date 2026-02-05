// Test module with multiple HTMLElement classes (should error)
export class FirstElement extends HTMLElement {
    connectedCallback() {
        this.textContent = 'First';
    }
}

export class SecondElement extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Second';
    }
}
