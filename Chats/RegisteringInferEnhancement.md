# Registering the Infer Enhancement

The core dependency of this package, assign-gingerly, just added a standard enhancement --  https://github.com/bahrus/assign-gingerly#smart-value-assignment-with-infer-enhancement -- that I would like to be automatically registered in the customElementRegistry of the Synthesizer web component instance.  Can you please add code to register the enhancement in the connectedCallback of Synthesizer:

```JavaScript
(this.customElementRegistry || customElements).enhancementRegistry.push(registryItem);
```