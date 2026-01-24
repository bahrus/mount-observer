// Sample custom element for testing lazy loading

export class FancyButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.querySelector('button').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('fancy-click', {
                bubbles: true,
                detail: { message: 'Fancy button clicked!' }
            }));
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    font-size: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                button:hover {
                    transform: scale(1.05);
                }
                button:active {
                    transform: scale(0.95);
                }
            </style>
            <button><slot></slot></button>
        `;
    }
}
