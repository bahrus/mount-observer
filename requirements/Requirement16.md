# 

The following runs when an element mounts:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: '.valid',
   asgMt: {
      '?.style?.color': 'green'
   }
});
observer.observe(document);
```

asgMt gets assigned gingerly when the element mounts.  To apply assignGingerly wheen an element dismounts we need to support:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: '.valid',
   asgMt: {
      '?.style?.color': 'green'
   },
   asgDisMt: {
        '?.style?.color': 'red'
   }
});
observer.observe(document);
```