# upShadowSearch should skip root nodes that aren't in the same registry as the ref element

Something like this is needed:

```JavaScript

        if ('getElementById' in rn && rn.customElementRegistry === ref.customElementRegistry) {
            const test = rn.getElementById(id);
            if (test) return test;
        }
```