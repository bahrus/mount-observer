# Mount Observer Script Element Reuse

As documented in the README.md, we will frequently have the need to inherit mount observer script elements a parent Shadow DOM root to the child Shadow DOM root.

But this requirement is focusing on optimizing that process.

Optimization 1: [DONE]

The first optimization is that in handlers/MountObserverScript.ts, by line 56, the config settings should already be parsed, regardless of whether the JSON was inline or imported.

To allow that parsed config to be reused, set the script element's export property to the parsed config value (similar to line 80 of handlers/ScriptExport.ts).  After doing so, make the script element dispatch a resolved event, added to Events.ts, which has property "export" also.

Optimization 2: [DONE]

Make line 81 of handlers/ScriptExport.ts emit the same event.


Optimization 3: [DONE]

Make handlers/ScriptExport.ts not do anything if it already finds an "export" object attached.

As far as handlers/MountObserverScript.ts:

line 27 should be changed to:

```JavaScript
let config = scriptElement.export
if(!config){
```

followed by the logic up until and including  line 67:

```JavaScript
scriptElement.dispatchEvent(new ResolvedEvent(config));
```

Optimization 4:

handlers/HTMLInclude.js should do something special if two conditions are met:

1.  We cloned a live DOM element (not a template), which will be described shortly  

The code marks that scenario with the comment:

```JavaScript
// Clone the element itself
```

So the code may need to refactored a bit so that the code that calls cloneContent knows whether the clone was done from a template or from a live non template node.

2.  The second condition to do something special is that the mountedElement, the template element that will be replaced, has a different rootNode (via getRootNode()) than the live DOM element that is being cloned

Now what is the special thing that should be done after cloning such a live DOM element?

Search the clone for all DOM elements with localName "script" type "mountobserver".  If the "export" object has not yet attached, use the module assign-gingerly/waitForEvent.ts to wait for the DOM element to emit event "resolved".

Copy the attached "export" property to the cloned script/type=mountObserver element with matching id






<!--
Optimization 5: 

```html
<script type=mountobserver src=#my-id></script>
```

Optimization 6:

```html
<moses-tree id=my-id>
    <script type=mountobserver></script>
</moses-tree>
```

-->




