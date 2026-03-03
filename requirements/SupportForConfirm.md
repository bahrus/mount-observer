# Support for shouldMount

Since calls to the do method is only  called once when all checks are fulfilled, it is useful to provide the developer the ability to add a custom JavaScript check outside the do action:

```TypeScript

export type ShouldMountCallback<TKeys extends string = string> = (mountedElement: Element, context: MountContext<TKeys>) => boolean | Promise<true | false | 'checkAgain'>;

export interface MountConfig<TKeys extends string = string> {
    shouldMount: ShouldMountCallback
}
```

This is always the very last check after all the other declarative AND condition checks have passed.

If the shouldMount returns true, the do is called and the mountEvent dispatches.  If false, it doesn't.  If a promise is returned:

When the promise is fulfilled, if true is returned, proceed with the do action / mount event.  If false, do nothing, wait for more mutation events / changes to other observers still being watched, and keep checking all the other conditions with each mutation event, and if they all pass, check shouldMount again.  'checkAgain' means if all the other AND conditions are still fulfilled, check the shouldMount condition again before proceeding to mount.