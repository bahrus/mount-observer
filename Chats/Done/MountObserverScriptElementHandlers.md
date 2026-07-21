# Mount Observer Script Element Handlers

Please add a built-in handler that:


1.  Specifies instanceof HTMLScriptElement
2.  Matches script elements with type=mountobserver


What the handler does:

Imports ElementMountExtension.js 

If the tag has attribute src, does a JSON import similar to the ScriptNoModule handler.  Otherwise, parses the HTML inside the tag using JSON.parse 

Once the JSON is imported / parsed, does:

```JavaScript
oScriptElement.mount(JSON);
```