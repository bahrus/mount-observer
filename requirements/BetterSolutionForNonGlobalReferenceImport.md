# Better Solution for Non Global Reference Import

The solution for how to integrate non JSON serializable settings, starting with the do function, feels a little clunky.

This is a new proposal / polyfill version, so maintaining backwards compatibility is a not a big concern.  I would rather find the right solution.

I can't really think of a scenario where I would want to schedule multiple do functions.  Some of the recent functionality we added, like the code:

```TypeScript
#mergeHandlerDefaults(config: MountConfig): MountConfig {
    const doValue = config.do;
        
    // Only process if do is a string (single handler reference)
    if (typeof doValue !== 'string') {
        return config;
    }
```

kind of overlooks the possibility of a combination of do functions, some of which are strings, I think.

I like how we absorb static settings on the handler class into the config settings.  The only downside if the handler class is it has to have a unique name throughout the application, as described in the readme, beginning at section

## Registering reusable handlers with MountObserver.define

We need to support a similar pattern in a way that doesn't require registering unique names for more custom, less generic functionality.

For this we had the "reference" property, which would use the imports settings, to find a limited subset of settings -- the do function and whereInstanceOf.

I'm thinking instead we should have:

```TypeScript

// my-package/my-settings.js

export const mountConfig: MountConfig = {
   select: 'div > p + p ~ span[class$="name"]', // not supported by polyfill
   withMediaMatching: '(max-width: 1250px)',
   whereObservedRootSizeMatches: '(min-width: 700px)',
   whereElementIntersectsWith:{
      rootMargin: "0px",
      threshold: 1.0,
   },
   whereInstanceOf: [HTMLMarqueeElement], //or 'HTMLMarqueeElement'
   whereLangIn: ['en-GB'], // Cannot be implemented - see https://github.com/whatwg/html/issues/7039
   whereConnectionHas:{
      effectiveTypeIn: ["slow-2g"],
   },
   import: ['./my-element-small.css', {type: 'css'}],
   do: function(mountedElement, ctx){
      console.log({mountedElement, ctx});
   }
}



 // my-module.js


export interface MountConfig {
    
}

const observer = new MountObserver({
   ...
    //to be removed
    reference?: number | number[];
    //new approach
    //module reference to merge into the settings
    //inline settings take precedence
    settingsModuleImport: 'my-package/my-settings.js'
   
});
observer.observe(document);
```

settingsModuleImport can only specify one ESM import, which is expected to export const with name mountConfig.  If no such constant is found, an error is thrown.