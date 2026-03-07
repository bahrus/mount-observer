# Spawn On Mount

Please become familiar with node_modules/assign-gingerly/README.md for needed context.

When an element mounts the first time only:

If MountConfig (this.#init) has enhancementConfig which has a spawn property, then spawn it, passing in the mountContext:

So around line 556 of MountObserver.ts, I'm thinking

```JavaScript
if(this.#init?.enhancementConfig?.spawn){
    await import('assign-gingerly/object-extension.js');
    element.get(this.#init?.enhancementConfig, context);
}
```

