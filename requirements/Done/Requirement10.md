# Emit event from mounted element

```TypeScript
type EventConstructor = {new(...args: any[]): Event};
interface EventConfig {
    event: string | EventConstructor,
    //event constructor arguments
    args?: any | [any],
    eventProps?: Record<string, any>,
    oncePerMountedElement?: boolean,
}



interface MountInit {
    ...
    mountedElemEmits: EventConfig | EventConfig[]
}
```

## Explanation

Let's talk about the "event" specifier that is either a string or an EventConstructor

If it is a string, it needs to point to the name of a globally accessible (via window or globalThis) built-in event, such as 'Event', or 'CommandEvent'.  So the code does something like:

```JavaScript
const evtConstructor = globalThis['CommandEvent'];
```

If such a thing isn't found as a constructor, do:

```JavaScript
throw new Error(`Event constructor "${eventName}" not found in globalThis`);
```

The most common scenario would be:

```JavaScript
const mountInit = {
    mountedElemEmits: {
        event: 'Event',
        args: 'my-event-name'
    }
}
```

which is equivalent to:

```JavaScript
const mountInit = {
    mountedElemEmits: {
        event: Event,
        args: 'my-event-name',
    }
}
```

which would do:  

```JavaScript
oMountedElement.dispatchEvent(new Event('my-event-name'));
```

The reason specifying the event via a string is important is that an important goal of MountInit is that it supports JSON as much as possible.

If args is a single value, treat is as the first argument.

## Multiple Events

You can dispatch multiple events by providing an array:

```javascript
const mountInit = {
    mountedElemEmits: [
        { event: 'Event', args: 'ready' },
        { event: 'Event', args: 'initialized'}
    ]
}
```

Events are dispatched in array order, sequentially.

## Magic strings

Along the lines of supporting JSON, there are two special strings that need to be treated specially if they appear anywhere in the list of args, or the RHS of eventProps:

```JavaScript
'{{mountInit}}'
```

and 

```JavaScript
'{{mountedElement}}'
```

The substitution should take place at any level of depth.

```JavaScript
args: ['command', ['{{mountedElement}}', 'other-value']]
```

would also get substituted.

Here's another example:

```JavaScript
const mountInit = {
    mountedElemEmits: {
        event: 'CommandEvent',
        args: ['command', {
            source: '{{mountedElement}}',
            bubbles: true
        }]
    }
}
```

which would do:

```JavaScript
const ce = new CommandEvent('command', {
    source: mountedElement,
    bubbles: true
});
mountedElement.dispatchEvent(ce);
```

## eventProps

The eventProps gets applied right after instantiating the event constructor, and before calling dispatch.  It should be applied via assignGingerly.

## oncePerMountedElement

When `oncePerMountedElement: true`, the event will only be dispatched once per element, even if the element dismounts and remounts.


Implementation uses a WeakMap `#processedEventsForElement` that maps:

- Key: Element
- Value: Set<string> of event identifiers that have been dispatched

The event identifier is generated from the EventConfig (e.g., combining event name and args).

If the element is garbage collected, the WeakMap entry is automatically cleaned up.

## When the event fires

The event should fire after:

1.  The element passes all criteria and thus mounts.
2.  Any imports specified finish
3.  All the do and do.Mount function callbacks finish
4.  The MountEvent dispatches

The event should be dispatched from the mounted element.

## Error Handling

- If the event constructor string is not found in globalThis: throw Error as discussed
- If event construction fails: let the error propagate
- If event dispatch fails: let the error propagate
- If assignGingerly fails on eventProps: let the error propagate

All errors will stop the mount process for that element.