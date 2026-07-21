# withMediaMatching

We need to support another AND condition, "withMediaMatching" in the MountConfig interface defined in types.d.ts.

The value can either be a single string, or a MediaQueryList object, and is optional.  If it is a MediaQueryList, use it as is.  If it is a string, call window.matchMedia(string) to create the MediaQueryList.

Essentially, this check should bracket all other requests.  Currently the MountObserver immediately checks all the elements within the passed in Node, before the mutation observer fires.  This shouldn't happen if the withMediaMatching isn't true.  Essentially, the mountObserver needs to "go to sleep", turning off the mutation observer then wake up when the test passes, including catching up by doing the same checks mentioned above during startup.  Be careful, though, the mutation observer can only be aborted rather than ignored if it isn't shared with other MountObserver instances.

When media doesn't match and the observer IS shared, should we:
Keep the shared observer running but just ignore mutations in this instance? Yes
Use a flag like #mediaMatches to skip processing in the mutation callback? Yes

When the withMediaMatching turns false, all previously mounted elements that are still in mounted states should be considered dismounted, and should dispatch the DismountEvent event.  The DismountEvent should provide a reason property in the event, and indicate that the cause of the dismount was due to the media query failing.

The reason property will be an OR condition of strings like:

```TypeScript
type DismountReason = 
    | 'media-query-failed'
    | 'where-element-matches-failed'

interface IDismountEvent {
    reason: DismountReason
       
}
```

The example shows 'where-element-matches-failed' as another reason. Should we also add:

'removed-from-dom' (for the current dismount behavior)?  No, this shouldn't cause a dismount event.
'where-attr-failed'?  No -- attributes going away shouldn't ever cause a dismount event.
'where-instanceof-failed'? No -- elements shouldn't lose instanceOf status

Let's add another boolean property to MountConfig, "getPlayByPlay" which if true, will cause the mountObserver instance to issue  events with names 'mediamatch' and 'mediaunmatch' according to the scenario.

All the events, including these new ones, including MountEvent, DismountEvent, DisconnectEvent, LoadEvent, AttrChangeEvent, should have a property added,  "MountConfig: MountConfig" that passes the full MountConfig object.

Let's not cache the mediaQuery observers across mount observers for now.  Make sure that the mediaQuery observer is aborted when the mountObserver is disconnected. 


If an element was mounted when media matched, then media stops matching, it should immediately be dismounted. Then if the element is then removed from DOM container, and then media matches again - what happens? Nothing -- element is outside the purview of the DOM container still.

Should we create MediaMatchEvent and MediaUnmatchEvent classes in Events.ts?  Yes

What properties should these events have besides MountConfig?  None for now

Shared mutation observer interaction:








