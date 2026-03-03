# Access to Mounted Elements

Please add a getter to MountObserver class:

```JavaScript
export class MountObserver{
    get mountedElements(): Element[]{

    }
}
```

What this does is:

Looks at #mountedElements and does a deref() as needed and returns an array of elements which is undefined.

