# Registering reusable handlers

In our continued desire to:

1.  Make MountInit as JSON serializable as possible, and 
2.  Encourage code reuse

we provide another way to reuse mount observer logic.

We document this code in README.md

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, mountInit, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, mountInit){
      mountedElement.textContent = 'bye';
   }
}

const observer = new MountObserver({
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: (mountedElement, ctx) => {
      new MyHandler(mountedElement, ctx);
   }
});
observer.observe(document);
```

What we can do instead is similar to defining a custom element:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, mountInit, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, mountInit){
      mountedElement.textContent = 'bye';
   }
}

MountObserver.define('myObserver', MyHandler);

const observer = new MountObserver({
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: 'myObserver'
});
observer.observe(document);
```

So we are expanding the do property in MountInit to allow for a string value (or an array of string values)

If any of the string values aren't previously registered via MountObserver.define, an error is thrown.

