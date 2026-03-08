## Intra document html imports with Shadow DOM support

Please enhance the built in handler HTMLInclude so that if the template element has attribute shadowRootModeOnLoad (case insensitive), then, instead of doing and insert of the clone (around line 222):

```TypeScript
template.parentNode?.insertBefore(clone, template);
```

It will instead behave similar to how the platform supports [declarative shadow dom](https://web.dev/articles/declarative-shadow-dom):

```html
<host-element>
  <template shadowrootmode="open">
    <slot></slot>
  </template>
  <h2>Light content</h2>
</host-element>
```

In particular, in this case it will:

1.  Check if the parent element has a shadowRoot.  If not, it will create it.
2.  It will append the clone to the shadowRoot.
3.  As before, delete the template element.no

Check if the parent element has shadow

```html
<template id=chorus>
   <template src=#beautiful>
      <span slot=subjectIs>
            <slot name=subjectIs1></slot>
      </span>
   </template>

   <div>No matter what they say</div>
   <div prop-pronoun>Words
      <slot name=verb1></slot> bring
      <slot name=pronoun1></slot> down</div>
   <div>Oh no</div>
   <template src=#beautiful>
      <span slot=subjectIs>
            <slot name=subjectIs2></slot>
      </span>
   </template>
   <div>In every single way</div>
   <div>Yes words
      <slot name=verb2></slot> bring
      <slot name=pronoun2></slot> down
   </div>
   <div>Oh no</div>

   <template src=#down></template>
</template>

<div class=chorus>
   <template src=#chorus shadowRootModeOnLoad=open></template>
   <span slot=verb1>can't</span>
   <span slot=verb2>can't</span>
   <span slot=pronoun1>me</span>
   <span slot=pronoun2>me</span>
   <span slot=subjectIs1>I am</span>
   <span slot=subjectIs2>I am</span>
</div>
```