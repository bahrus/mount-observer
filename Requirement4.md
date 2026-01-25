As soon as an element mounts due to attributes as described in Requirement3.md, we need another event to fire, with the initial discovery of the matching attribute(s) but also subsequent changes in values of those attributes, including the removal of the attribute.

The event should be added to Events.ts

The event should pass the matching object found in MountInit's "map config setting.

So for example:

```JavaScript
const mo = new MountObserver({
    whereAttr:{
        hasBase: 'my-greetings',
        hasBranchIn: [
            '', //allow for standalone base attribute
            {
                'hello': ['', 'how-are-you', 'hows-it-going']
            }
            {
                'goodbye': ['', 'last-words', {'ps':['', 'pps']}]
            }
        ]
    },
    //optional
    map: {
        //base attribute my-greetings
        '0': {
            instanceOf: 'Object',
            mapsTo: '.'
        },
        //my-greetings-hello
        '1': {
            instanceOf: 'Boolean',
            mapsTo: 'isHello'
        },
        //my-greetings-hello-how-are-you
        '1.1': {
            instanceOf: 'String',
            mapsTo: 'firstHelloGreeting'
        },
        //my-greetings-hello-hows-it-going
        '1.2': {...},
        //my-greetings-goodbye
        '2':{...},
        //my-greetings-goodbye-last-words
        '2.1':{...},
        //my-greetings-goodbye-ps
        '2.2':{...},
        //my-greetings-goodbye-ps-pps
        '2.2.1':{...}
    },
}),
```

The event should include an array of matching attributes that were discovered / added / removed, and the event should provide:

1.  The string / null value of the attribute.
2.  The Attribute Node object (null when an attribute goes away).
3.  The object with corresponding "coordinates" contained within the map config setting of MountInit.
4.  The full name of the attribute without any manipulation
5.  The coordinates (e.g. '2.2.1').  Include the trailing '.0' if specified (even though not needed).
6.  The element whose attributes are changing.

These events should fire immediately on initial mount, after the mount / dismount / etc. events if any one or more of the attributes being observed is present.  It should continue to fire after that when of the original list of values change, and also when any of the full list of attributes being watched for are added.  Or an attribute was present, and then removed.  The event should only fire from the mountObserver instance, not from the element itself.

The mutation observer currently in MountObserver needs to monitor for attributes: true, whether or not map is present.  The scope of attributes to observe is the entire list of attribute combinations specified by MountInit, not just the initial ones discovered.

Event batching should occur so that if multiple attributes change in the same mutation, one single event should fire with the array of attribute changes.

The name of the event should be attrchange.

If map is not provided then the item mentioned in 3. above should be null.

The mapping '0', '1', '1.1', '2.2.1', etc is based on a kind of "decimal system'.  '0' is equivalent to '0.0', which is allowed, due to the first empty string in hasBranchIn. '1' refers to the 1 index in the top level branch.  I've placed the corresponding above each example in the map, so hopefully the pattern is clear.

To be clear, the coordinate system is zero based, but like with the decimal system, the last ".0" is assumed if not present, so "1.0" points to the same place in the hasBranchIn as "1".  Both should be accepted, and considered equivalent.

Only one Event type for all these scenarios should be defined in Events.ts.  Properties of the event should be used to indicate what scenario is encountered as needed.  I think the value of null is enough to infer that the attribute was removed.  

*Include in the event array only attributes that:*

- Currently have a value (not null), OR
- Previously had a value but are now removed (null)


*Exclude from the event array:*

- Attributes that don't exist and never existed (weren't present before and still aren't)