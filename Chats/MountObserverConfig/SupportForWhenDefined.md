# Support for whenDefined

This requirement is to add another AND condition for mounting:

```TypeScript
export interface MountConfig<TKeys extends string = string> {
    ...
    whenDefined?: string | string[]
}
```

This would be based on the customElementRegistry of the node being observed.

I think this check should be the first check, before anything else needs to be checked, as it is a simple promise and "turns on" but never turns off, so need not be ever checked again during any of the other tests.