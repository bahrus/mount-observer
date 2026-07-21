# Support for With

For more complex scenarios, we need the ability to group multiple mount observers together, as the functionality we are looking for needs to apply actions from one observer to others.  To support this, add setting "with", that allows for a name / value pair of mount observer sub observers that the main mount observer needs access to:

```TypeScript

export interface MountConfig<TKeys = any> {
    //please correct the Typescript mapping below, I probably don't have that quite right
    with?: {[key: keyof TKeys  & string]: MountConfig}
}
```

This would cause the mountObserver to create sub mountObservers corresponding to each of the MountConfigs, on the same root element passed in the observe method.

This look of mount observers would be made available to the do method and the mount event:


```TypeScript
export interface MountContext<TKeys = any> {
    modules: any[];
    observer: IMountObserver;
    rootNode: Node;
    MountConfig: MountConfig;
    //again, correct the TypeScript mapping, probably not right
    withObservers: {[key: keyof TKeys & string]: IMountObserver}
}
```

BTW, shouldn't MountConfig start with a capital M above?  I think that may have been an oversight?  Can we correct that with this requirement?
