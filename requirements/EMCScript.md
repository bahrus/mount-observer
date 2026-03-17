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
`${localName}.${enhKey}`
```

One of the first things the handler needs to do is to construct a true MountConfig object from the EMC config.  That config won't have the enhConfig part, if withAttrs is defined, will use module assign-gingerly/buildCSSQuery.js to combine whatever matching value was provided with the EMC config, with the withAttrs values, to form the matching string.  This mount observer config should be used to watch for mounts, similar to the mountobserver script element.

Once an element "mounts" from the moungConfig, the handler does the following:

1.  Checks if the mounted element already has property oMountedElement.enh[enhKey].  If so, does nothing.

2.  