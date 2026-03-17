This requireement is to support a built in handler similar to the MountObserverScript handler that looks for mountobserver script elements.

This one looks for emc script elements:

```html
<script type="emc">{
    "matching": "div, template",
    ...
}</script>
```

Like mountobserver script elements, the JSON can either be inline or specified as a bare import map supported JSON import via the src attribute.  Note that I've made some code corrections to how the mountobserver JSON import gets resolved.


Unlike the mountobserver script elements, the JSON can only be an object, not an array.

The JSON is expected to follow the EMC interface defined in the type definition file types/mount-observer/types.d.ts.  It is basically the MountConfig object, but 

Once the JSON is parsed, it should be attached the "export" property of the script element, and event resolved should fire.

If no id is specified for the script element, the id should be set to:

```JavaScript
`${oScriptElement.parentElement.localName}.${enhKey}`
```

One of the first things the handler needs to do is to construct a true MountConfig object from the EMC config.  That config won't have the enhConfig part, if withAttrs is defined, will use module assign-gingerly/buildCSSQuery.js to combine whatever matching value was provided with the EMC config, with the withAttrs values, to form the matching string.  This mount observer config should be used to watch for mounts, similar to the mountobserver script element.

Once an element "mounts" from the moungConfig, the handler does the following:

1.  Checks if the mounted element already has property oMountedElement.enh[enhKey].  If so, does nothing.

2.  Get the enhancementRegistry from the customElementRegistry of the script element, and Use assign-gingerly/assignGingerly.ts class, findByEnhKey to see if an enhancement with the specified enhKey has already been registered.  If not, do step 3.

3.  
    1.  Do a dynamic import of the specified spawn string to import a module, and uses code similar to private findSuitableClass(module: any): typeof HTMLElement  in DefineCustomElement.ts.  In fact, I think that function should be extracted to a separate import module that we can reuse.

    2. An enhancement config is constructed from the enhCofig object, combined with the class found in step 3.1 above.

    3.  Register the enhancement config in the enhancement registry.

4.  Using the enhancementConfig found in either step 2 or step 3, spawn an instance of the class via:

```JavaScript
oMountedElement.enh.get(enhancementConfig);
```