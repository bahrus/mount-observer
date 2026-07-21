# Loading Enhancement Config From Module

1.  I think I made a mistake when I specked out requirements/RegisterEnhancementConfig-DONE.md.  The registration should only happen after we check and finish imports if applicable.

2.  MountConfig supports a reference property explained in the README.md with title ### How the reference property works

We should allow  modules to export the enhancementConfig:

```JavaScript
// module ButtonEnhancement.js
// Define an enhancement class
class ButtonEnhancement {
   constructor(element, ctx, initVals) {
      this.element = element;
      this.onClick = this.onClick.bind(this);
      element.addEventListener('click', this.onClick);
   }
   
   onClick(e) {
      console.log('Button clicked!', this.element);
   }
}

export const enhancementConfig = {
    spawn: ButtonEnhancement,
    enhKey: 'buttonEnh'
}

//myModule.js

const observer = new MountObserver({
   matching: 'button[data-enhance]',
   import: './ButtonEnhancement.js',
   reference: 0
});
observer.observe(document);
```

... and this should behave exactly like the  ### Basic spawn usage example in ReadME.md

3.  We should allow multiple enhancementConfigs

export interface MountConfig {
    
    enhancementConfig?: EnhancementConfig | EnhancementConfig[];
}

4.  Just like other uses of reference, iterate through the inline enhancementConfig first, then apply all the imported references, if applicable.

