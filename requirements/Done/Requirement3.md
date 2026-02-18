# whereAttr

Please add to the steering document(s) that each of the "where*" conditions in the MountConfig object forms an "and" condition with other where* conditions if present.

So we already have *matching.

On top of that, we want to add the following and condition:

```JavaScript
//bare import specifier
import {MountObserver} from 'mount-observer/MountObserver.js';
const mo = new MountObserver({
   whereAttr:{
      hasBuiltInRootIn: ['', 'data', 'enh', 'data-enh'],
      hasCERootIn: ['', 'data', 'enh', 'data-enh'],
      hasBase: 'my-enhancement',
      hasBranchIn: [
        '', //allow for standalone base attribute
        {
            'hello': ['', 'how-are-you', 'hows-it-going']
        }
        {
            'goodbye': ['', 'last-words', 'ps':['', 'pps']]
        }
      ]
   }
});
```

The meaning of "hasBuiltInRootIn" vs "hasCERootIn" is this:

```html
<input my-greetings>
<input data-my-greetings>
<input enh-my-greetings>
<input data-enh-my-greetings>
```

will all mount.

Within the whereAttr, each valid combination of the has* values form a valid "or" condition.  The empty string '' indicates that the additional branch is not required for a valid match.

However, when it comes to custom elements (CE)'s:

```html
<!-- this will not mount -->
<my-custom-element my-greetings></my-custom-element>
<!-- these will mount -->
<my-custom-element data-my-greetings></my-custom-element>
<my-custom-element enh-my-greetings></my-custom-element>
<my-custom-element data-enh-my-greetings></my-custom-element>
```

The hasBranchIn setting is a recursive setting that allows for n-level deep keys based on the - delimiter (by default).

So these will mount:

```html
<input my-greetings="courtesy of great american family">
<your-custom-element 
    enh-my-greetings="courtesy of hallmark" 
    enh-my-greetings-hello="select from gloomy section"
    enh-my-greetings-hello-how-are-you="one day closer to death"
    enh-my-greetings-good-bye="select from funny section"
    enh-my-greetings-good-bye-last-words="smell you later"
>
...
</your-custom-element>
```

will mount.  Again, if the adorned element isn't a custom element, the enh- isn't required based on the instructions above in MountConfig.

To customize the keys, the syntax looks as follows:

```JavaScript
//bare import specifier
import {MountObserver} from 'mount-observer/MountObserver.js';
const mo = new MountObserver({
   whereAttr:{
      hasBuiltInRootIn: ['', 'data', 'enh', 'data-enh'],
      hasCERootIn: ['', 'data', 'enh', 'data-enh'],
      hasBase: '[_]my-enhancement',
      hasBranchIn: [
        '', //allow for standalone base attribute
        {
            '[:]hello': ['', '[--]how-are-you', '[--]hows-it-going']
        }
        {
            '[--]goodbye': ['', '[---]last-words', '[----]ps':['', 'pps']]
        }
      ]
   }
});
```

So this won't mount on the html above, but will instead mount on:

```html
<input my-greetings="courtesy of great american family">
<your-custom-element 
    enh_my-greetings="courtesy of hallmark" 
    enh_my-greetings:hello="select from gloomy section"
    enh_my-greetings:hello--how-are-you="one day closer to death"
    enh_my-greetings::good-bye="select from funny section"
    enh_my-greetings::good-bye---last-words="smell you later"
    enh_my-greetings::good-bye----ps-pps="bon voyage"
>
...
</your-custom-element>
```

Keep in mind that in the next requirement (not yet specified), once an element mounts due to attributes such as these, we will need to dispatch a different event anytime any of the attributes go away or change in value, but that is outside of the scope if this requirement, but it would be good to keep that in mind as it may affect the design of this requirement.

Note that the presence of the base attribute is also an or condition, so this should also mount:

```html
<your-custom-element 
    enh_my-greetings::good-bye----ps-pps="bon voyage"
>
...
</your-custom-element>
```









