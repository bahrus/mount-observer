#  mount-observer "lite"

In many cases, the full power of all the settings MountConfig provides are overkill.  We just want to enhancement elements that have certain attributes, end of storey.

## Proposal

The constructor of MountObserver is currently:

```JavaScript
constructor(init: MountConfig, options: MountObserverOptions = {});
```

Let's make it:


```JavaScript
constructor(config: MountConfig | EnhancementConfig[], options: MountObserverOptions = {});
```

In the case of being passed in the array of EnhancementConfig[], basically dynamically construct the MountConfig object from it:

```JavaScript
constructor(config: MountConfig | EnhancementConfig[], options: MountObserverOptions = {}){
    let init: MountConfig;
    if(Array.isArray(config)){
        init = {
            enhancementConfig: config
        }
    }else{
        init = config;
    }
}
```
