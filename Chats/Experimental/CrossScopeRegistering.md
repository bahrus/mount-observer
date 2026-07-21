# Cross Scope Registering

Please create a pair of  built in handlers, that together accomplish the following:

1.  One of the handlers Looks for elements that match the pattern of custom elements (have a dash in them), with attribute be-cross-scope-registered.  For example:

```html
<be-hive be-cross-scope-registered></be-hive>
```

The handler waits the following:

```JavaScript
await oBeHive.customElementRegistry.whenDefined('be-hive'); //in this case because of the match name
```

Once this is done, it adds oBeHive.customElementRegistry.get('be-hive') to some sort of EventTarget (perhaps) that the other handler can subscribe to

The second handler does the following:

Any time an element from a different scope than the root node being observed is encountered, does the following logic:

for each of the custom element names found from the first handler:

1.  Checks if any of the custom element constructors found from the first handler are missing from the customElementRegistry of the found element.  If missing, registers it.  Keeps a list of all found registries

2.  Monitors for new custom element constructors found from the first handler, and applies the same checks / registering as needed.