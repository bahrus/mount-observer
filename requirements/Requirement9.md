# assign gingerly method

A copy should be made of assign gingerly from the passed in mountInit using structuredClone and stored in a private variable (#assignGingerlySource) so that mutations can be made to it without affecting what was passed in.

The MountObserver class should have a public method called assignGingerly that

1.  Applies the imported package {assignGingerly} assign-gingerly/assignGingerly.js to #assignGingerlySource of the value to copy for future mounted elements.  Object.assign should never be used for this requirement. If assignGingerly is not defined in mountInit, the private field #assignGingerlySource will start out undefined, so in that case the assignGingerly methods should just do a structural clone of the passed in object in that case and assign it to #assignGingerlySource.  If undefined is passed in, delete #assignGingerlySource.  If undefined is passed in, don't modify the mounted elements.
2.  Applies the passed in object to the already mounted elements via the npm package assignGingerly.  If an error occurs, just let JS allow the error to propagate and stop and  allow processing to cease.

What this means is:

```JavaScript
// Constructor
new MountObserver({ asgMt: { disabled: true, value: 'foo' } })

// Later, call method
observer.assignGingerly({ title: 'bar' })

// Future elements get:
 (merge): { disabled: true, value: 'foo', title: 'bar' }
```

In order to o this the current WeakSet #mountedElements will need to be switched to a Set of Weak References:  Set<WeakRef<Element>>.

The signature should be async:

// Option B: Async (since assign-gingerly can be async)
assignGingerly(config: Record<string, any>): Promise<void>