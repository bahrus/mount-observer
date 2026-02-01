# Emit event from mounted element

```TypeScript
interface EventConstructor {
    {new(): Event}
}
interface EventInfo {
    event: string | EventConstructor,
    args?: [any],
    eventProps?: Record<string, any>,
    includeMountInit?: boolean,
    eventInit?: EventInit,
    once?: boolean,
}

interface MountInit {
    ...
    mountedElemEmits: EventInfo | EventInfo[]
}
```

The event should fire after:

1.  The element passes all criteria and thus mounts.
2.  Any imports specified finish
3.  All the do and do.Mount function callbacks finish
4.  The MountEvent dispatches

The event should be dispatched from the mounted element.