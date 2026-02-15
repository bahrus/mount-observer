# withInstance

```html
<marquee direction="left">This text scrolls from right to left</marquee>
```

```JavaScript
const observer = new MountObserver({
   whereElementMatches: '[direction="left"]',
   withInstance: HTMLMarqueeElement,
   do: (el, {modules, observer, observeInfo}) => {
      el.direction='right';
      el.textContent = 'This text scrolls from right to left';
   }
   
});
observer.observe(document);
```

As is always the case, each "where..." is an and condition.

Even though withInstance is probably cheaper than the whereElementMatches, the way we use querySelectorAll means the order of the checks should be:

1.  whereElementMatches
2.  whereAttr
3.  withInstance

*withInstance* should also support an array of constructors.  Both should be supported.

Elements that inherit from the constructor satisfies the condition.

