# Support for different scope

First, I significantly simplified the logic in line around line 506 of MountObserver.ts

New Logic:

```JavaScript
// Check that element's customElementRegistry matches root node's registry
const rootNode = this.#rootNode?.deref();
if (rootNode) {
    const registriesMatch = (rootNode as any).customElementRegistry === (element as any).customElementRegistry;
    if(!registriesMatch) return false;
    
}
```

Old Logic:

```JavaScript
const rootRegistry = (rootNode as any).customElementRegistry;

// If root has a registry, find the element's registry root and compare
if (rootRegistry) {
    const elementRegistryRoot = getRegistryRoot(element);
    const elementRegistry = elementRegistryRoot ? (elementRegistryRoot as any).customElementRegistry : undefined;
    
    // If registries don't match, exclude this element
    if (rootRegistry !== elementRegistry) {
        return false;
    }
}
```

This logic was put in place as part of the effort of implement requirement found in requirements/Done/ExcludeMatchingElementsWhereCustomElementRegistriesDon'tMatch.md.

I think that the more complicated code was based on a fundamental misunderstanding of how scoped custom element registries work.  Maybe I'm wrong.  If you think I'm wrong, explain why.  If you agree with me, please look for any documentation  such as steering documents that led to this overly complicated code, and correct the documentation to prevent such overcomplicated code in the future.

Now, for the new requirement:

Add another where condition to MountConfig:

```TypeScript
export interface MountConfig {
    ...
    whereDifferentScope?: boolean
}
```

If that setting is set to true, apply the opposite logic:

```JavaScript
if(registriesMatch) return false;
```

