# builtIns.goViral built in handler

Me:

Scoped custom element registries are great, in that they can avoid name clashes in a micro-front end environment.

However there are some scenarios where we really need a mount observer to cross into all the custom element registries.  I'm floundering to figure out how to do that, for some critical observers.  


For example, I would really like to make support for the mount observer script element to work across the board, and cross over into elements with different registries as seamlessly as possible.  Maybe a little bit of "buy-in" should be needed, and I'm thinking that the most elegant solution for buy-in to work would be to write a web component can attach these core mount observers into any ShadowRoot, any family of nested elements having the same scope, but simply plopping such an element.  I'm thinking this package won't have the base custom element.  I'm leaning towards making another package that depends on this one, [mount-observer-script-elements](https://github.com/bahrus/mount-observer-script-element) support this.  But at a minimum we need to figure out what can help with that effort, adding the needed primitives to this package.

Right now, to bootstrap support for the builtIns.mountObserverScript and 

```TypeScript
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Handler provides matching and whereInstanceOf via static properties
    document.observe({
        do: 'builtIns.mountObserverScript'
    });
```

So the web component mentioned above could do something like:

```TypeScript
import { MountObserver } from 'mount-observer/MountObserver.js';
const checkForMountObserverScript = Symbol.for('some-guid-string-for-mount-observer-script');
class MyCommonBuiltInHandlerHandler{
    async connectedCallback(){
        if(!this.customElementRegistry[checkForMountObserverScript]){
            this.customElementRegistry[checkForMountObserverScript] = true;
            const {MountObserver} = await import('mount-observer/MountObserver.js');
            (this.shadowRoot || this).observe({
                do: 'builtIns.mountObserverScript'
            })
        }
        
    }
}
customElements.define('some-guid-string', MyCommonBuiltInHandlerHandler);
```

So now, plopping an instance of the custom element above inside the shadowRoot or a child of an element in a different custom scope registry should do the trick.

But now the most annoying thing we have to do is register this custom element in every scoped registry, which is almost as much work as the bootstrap code needed above.

How can we leverage all the infrastructure this package supports, and "go against the grain" of how scoped custom element registries are supposed to work, and make sure every registry gets this one custom element ('some-guid-string') added?

---

## Proposed Solution: Registry Propagation via Template Injection

After studying the mount-observer architecture, here's a creative solution that leverages existing patterns:

### Core Concept: Self-Propagating MOSE Templates

Instead of trying to register custom elements across registries or clone script elements, use the **HTMLInclude handler** combined with a **registry-crossing observer** to inject bootstrap templates into new registry scopes.

### Architecture

1. **Bootstrap Template**: A template containing the MOSE scripts you want in every registry
2. **Registry Watcher**: An observer that watches for elements in different registries
3. **Template Injection**: When a new registry is detected, inject the bootstrap template
4. **Idempotency**: Use a Symbol on the registry to prevent duplicate injection

### Implementation Pattern

```html
<!-- Define the bootstrap template once in the global scope -->
<template id="mount-observer-bootstrap">
    <script type="mountobserver">
    {
        "do": "builtIns.mountObserverScript"
    }
    </script>
    
    <script type="mountobserver">
    {
        "do": "builtIns.hoistTemplate"
    }
    </script>
    
    <script type="mountobserver">
    {
        "do": "builtIns.HTMLInclude"
    }
    </script>
    
    <script type="mountobserver">
    {
        "do": "builtIns.generateIds"
    }
    </script>
</template>

<!-- Bootstrap in global scope -->
<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Activate handlers in global scope
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
    
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
    
    // Watch for elements in different registries and inject bootstrap
    new MountObserver({
        matching: '*',
        whereDifferentCustomElementRegistry: true,
        shouldMount: (el) => {
            // Only mount on elements that have a shadow root or are registry roots
            return el.shadowRoot !== null || el.customElementRegistry !== undefined;
        },
        do: 'builtIns.propagateBootstrap'
    }).observe(document);
</script>
```

### The `builtIns.propagateBootstrap` Handler

```typescript
export class PropagateBootstrapHandler extends EvtRt {
    static matching = '*';
    static whereDifferentCustomElementRegistry = true;
    
    // Symbol to track which registries have been bootstrapped
    static #bootstrappedRegistries = Symbol.for('mount-observer-bootstrapped-registries');
    
    mount(mountedElement: Element, mountConfig: MountConfig, context: MountContext): void {
        const registry = mountedElement.customElementRegistry;
        
        // Skip if no registry or already bootstrapped
        if (!registry) return;
        
        // Initialize the global set if needed
        if (!(globalThis as any)[PropagateBootstrapHandler.#bootstrappedRegistries]) {
            (globalThis as any)[PropagateBootstrapHandler.#bootstrappedRegistries] = new WeakSet();
        }
        
        const bootstrappedSet = (globalThis as any)[PropagateBootstrapHandler.#bootstrappedRegistries];
        
        if (bootstrappedSet.has(registry)) {
            return; // Already bootstrapped this registry
        }
        
        // Mark as bootstrapped immediately to prevent race conditions
        bootstrappedSet.add(registry);
        
        // Find the bootstrap template
        const bootstrapTemplateId = mountConfig.bootstrapTemplateId || 'mount-observer-bootstrap';
        const bootstrapTemplate = upShadowSearch(mountedElement, bootstrapTemplateId);
        
        if (!bootstrapTemplate) {
            console.warn(`PropagateBootstrap: Template #${bootstrapTemplateId} not found`);
            return;
        }
        
        // Determine where to inject
        const targetNode = mountedElement.shadowRoot || mountedElement;
        
        // Clone and inject the bootstrap template
        const clone = bootstrapTemplate instanceof HTMLTemplateElement
            ? bootstrapTemplate.content.cloneNode(true)
            : bootstrapTemplate.cloneNode(true);
        
        // Prepend to ensure handlers are available before other content
        targetNode.prepend(clone);
        
        // The MOSE handler will automatically activate the injected scripts
    }
}
```

### Key Advantages

1. **No Custom Element Registration**: Doesn't require registering a custom element in every registry
2. **Leverages Existing Infrastructure**: Uses `whereDifferentCustomElementRegistry`, `HTMLInclude`, and MOSE patterns
3. **Declarative**: Bootstrap configuration is pure HTML/JSON
4. **Idempotent**: WeakSet prevents duplicate bootstrapping
5. **Flexible**: Can customize which handlers to propagate via the template
6. **Automatic Activation**: MOSE handler automatically processes injected scripts

### Usage Pattern

```html
<!-- In your app -->
<template id="mount-observer-bootstrap">
    <!-- Core handlers you want everywhere -->
    <script type="mountobserver">{"do": "builtIns.mountObserverScript"}</script>
    <script type="mountobserver">{"do": "builtIns.HTMLInclude"}</script>
</template>

<!-- Component with scoped registry -->
<my-component>
    #shadow (with scoped registry)
        <!-- Bootstrap is automatically injected here -->
        <!-- Now MOSEs work in this shadow root -->
        <script type="mountobserver">
        {
            "matching": "button",
            "import": "./button.js",
            "do": "builtIns.defineCustomElement"
        }
        </script>
</my-component>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // One-time global setup
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
    
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
    
    new MountObserver({
        do: 'builtIns.propagateBootstrap',
        bootstrapTemplateId: 'mount-observer-bootstrap'
    }).observe(document);
</script>
```

### Alternative: Registry-Aware Element.mount() Extension

For even more convenience, extend `element.mount()` to automatically propagate to child registries:

```typescript
// In ElementMountExtension.js
Element.prototype.mountGlobally = async function(config: MountConfig) {
    // Mount in current registry
    await this.mount(config);
    
    // Also watch for child registries and mount there too
    const propagator = new MountObserver({
        matching: '*',
        whereDifferentCustomElementRegistry: true,
        shouldMount: (el) => el.shadowRoot !== null,
        do: async (el) => {
            const target = el.shadowRoot || el;
            await target.mount(config);
        }
    });
    
    await propagator.observe(this);
    
    return this;
};
```

Usage:
```javascript
// This observer will propagate to all child registries automatically
await document.mountGlobally({
    do: 'builtIns.mountObserverScript'
});
```

### Why This Works

1. **Registry Detection**: `whereDifferentCustomElementRegistry: true` finds elements in new registries
2. **Template Reuse**: HTMLInclude pattern for sharing bootstrap configuration
3. **Automatic Activation**: MOSE handler processes injected scripts automatically
4. **Memory Efficient**: WeakSet allows GC of unused registries
5. **No Circular References**: Template injection is one-way (parent → child registries)
6. **Opt-in**: Components must have shadow roots to receive bootstrap
7. **Composable**: Works with existing `with` property for sub-observers

### Comparison to Original Proposal

| Aspect | Original | This Proposal |
|--------|----------|---------------|
| Mechanism | Clone MOSE scripts | Inject bootstrap template |
| Tracking | WeakRef + MountConfig comparison | WeakSet of registries |
| Circular refs | Possible with self-matching | Prevented by one-way injection |
| Flexibility | Fixed MOSE cloning | Customizable template content |
| Integration | New handler pattern | Leverages existing patterns |
| Idempotency | Complex config hashing | Simple registry WeakSet |

This solution feels more aligned with mount-observer's declarative, template-based philosophy while solving the cross-registry bootstrapping problem elegantly.

---
---

I like your suggestions.  

I would like to start with only implementing the second alternative (the mountGlobally) for now.  

I think, though, we will need two propagators:


```typescript
// In ElementMountExtension.js
Element.prototype.mountGlobally = async function(config: MountConfig) {
    // Mount in current registry
    await this.mount(config);
    
    // Also watch for child registries and mount there too
    const crossCustomElementRegistryPropagator = new MountObserver({
        matching: '*',
        whereDifferentCustomElementRegistry: true,
        //shouldMount: (el) => el.shadowRoot !== null,
        do: async (el) => {
            //wait for custom element to be defined so has the chance to 
            //add shadowRoot
            const {localName} = el;
            if(localName.includes('-')){
                await el.customElementRegistry.whenDefined(localName);
            }
            const target = el.shadowRoot || el;
            await target.mount(config);
        }
    });
    
    await crossCustomElementRegistryPropagator.observe(this);

    const crossShadowRootPropagator = new MountObserver({
        whereLocalNameMatches: /-/,
        do: async (el) => {
            const {localName} = el;
            await el.customElementRegistry.whenDefined(localName);
            const {shadowRoot} = el;
            if(shadowRoot === null) return;
            await shadowRoot.mount(config);
        }
    })
    
    return this;
};
```
