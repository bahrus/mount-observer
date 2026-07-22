## Auto Get Enhancement

Please define a very similar built in handler as DefineCustomElementHandler

```JavaScript
document.mount({
    matching: '[my-enhancement]',
    import: './MyEnhancement.js',
    do: 'builtIns.enhanceMountedElement'
});
```

Please read and comprehend /node_modules/assign-gingerly/README.md

What this would do:

1.  Searches the first import for an export that is an object that has a "spawn" constructor.  Call that export "myEnhancementRegistryItem" in what follows
2.  Call oMatchingElement.enh.get(myEnhanementRegistryItem, context);