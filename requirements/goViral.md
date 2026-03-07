# builtIns.goViral built in handler

Scoped custom element registries are great, in that they can avoid name clashes in a micro-front end environment.

However there are some scenarios where we really need a mount observer to cross into all the custom element registries.  that's what this handler requirement does.

```HTML
<script type=mountobserver id=my-guid>{
    "matching" : "#my-guid"
    "do": "builtIns.goViral"
    "with": {...} 
}</script>
```

What this does:

1.  Adds a mountObserver that watches for elements from a different custom element scope from the one that matched above
2.  Checks if a WeakReference to that scope has already been set for that registry and the MountConfig of the observer above (this could be tricky to get right).  If found, skips.  If not, immediately add to the WeakReference so no other duplicate mount config gets added for the same custom element registry.
3.  Clones the matching mountobserver above and, if the matching element from another scope has the same rootNode as the one above, sets the id to a different guid.
4.  Appends the clone to the matching element from that different scope.