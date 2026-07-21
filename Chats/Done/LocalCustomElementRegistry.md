# Scoped Custom Element Registry

## Requirement

DefineCustomElementHandler, line 32 defines the custom element in the global registry.

Extract that line into a method `define` that can be overridden in a subclass. That method should be passed the mounted element.

Define a subclass `DefineScopedCustomElementHandler` where the `define` method defines the custom element in the scoped registry (`mountedElement.customElementRegistry.define...`).

## Implementation

### Changes to DefineCustomElementHandler.ts

1. **Extracted define logic into protected method**:
   ```typescript
   protected define(tagName: string, ElementClass: CustomElementConstructor, mountedElement: Element): void {
       customElements.define(tagName, ElementClass);
   }
   ```

2. **Created DefineScopedCustomElementHandler subclass**:
   ```typescript
   export class DefineScopedCustomElementHandler extends DefineCustomElementHandler {
       protected define(tagName: string, ElementClass: CustomElementConstructor, mountedElement: Element): void {
           const registry = (mountedElement as any).customElementRegistry;
           
           if (!registry) {
               throw new Error('Element does not have a customElementRegistry. Scoped registries require Chrome 146+ or latest WebKit/Safari.');
           }
           
           if (registry.get(tagName)) {
               return;
           }
           
           registry.define(tagName, ElementClass);
       }
   }
   ```

### Benefits

- **Extensibility**: The `define` method can be overridden for different registry strategies
- **Backward compatibility**: Default behavior uses global registry
- **Scoped registry support**: New subclass supports scoped custom element registries
- **Error handling**: Clear error message when scoped registry is not available

### Browser Support

Scoped custom element registries require:
- Chrome 146+
- Latest WebKit/Safari

## Testing

Created comprehensive tests in `tests/test-scoped-registry-handler.html`:
- Global handler defines in global registry
- Scoped handler defines in scoped registry
- Scoped handler throws error without registry

## Status

✅ Implemented and tested

