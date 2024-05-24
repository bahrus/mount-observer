import {} from 
export abstract class Synthesizer extends HTMLElement{
    #mutationObserver: MutationObserver | undefined;

    connectedCallback(){
        this.hidden = true;
    }
    disconnectedCallback(){
        if(this.#mutationObserver !== undefined){
            this.#mutationObserver
        }
    }
}