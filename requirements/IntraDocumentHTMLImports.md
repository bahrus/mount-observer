# Intra Document HTML Includes, Part I

One of the most useful features of any programming language is the notion of a variable, such as  constant, as it provides for reuse.

This requirement provides a way to reuse HTML fragments declaratively, similar to JavaScript constants.  It is easiest to illustrate this requirement with song lyrics:

```html
<div class=stanza id=Opening>
    <div>I don't care if <span itemprop=day1>Monday</span>'s blue</div>
    <div><span itemprop=day2>Tuesday</slot>'s gray and <span itemprop=day3>Wednesday</span> too</div>
    <div><span itemprop=day4>Thursday</span> I don't care about you</div>
    <div id=Friday>
        <div>It's <span itemprop=day5></span> I'm in love</div>
    </div>
</div>

<div class=stanza id=art>
    <div><span itemprop=day1>Monday</span> you can fall apart</div>
    <div><span itemprop=day2>Tuesday</span> <span itemprop=day3>Wednesday</span> break my heart</div>
    <div>Oh, <span itemprop=day4>Thursday</span> doesn't even start</div>
    <template src=#Friday></template>
</div>
```

... which allows us to reuse the HTML snippet:

```html
<div id=Friday>
    <div>It's <span itemprop=day5></span> I'm in love</div>
</div>
```

via:

```html
<template src=#Friday></template>
```

This should result in

```html
<div class=stanza id=art>
    <div><span itemprop=day1>Monday</span> you can fall apart</div>
    <div><span itemprop=day2>Tuesday</span> <span itemprop=day3>Wednesday</span> break my heart</div>
    <div>Oh, <span itemprop=day4>Thursday</span> doesn't even start</div>
    <template src=#Friday></template>
</div>
```

Things that need to happen:

Let's either copy in and/or improve as needed the legacy/upShadowSearch.ts and export that module in package.json

I think there would be a small performance gain in caching the search with a weak reference, as the anticipation is this could be used in scenarios where we repeatedly refer to the same id (think generating a periotic table of the elements with fancy features like orbitals)


We need a builtIns.HTMLInclude that watches for elements matching

```html
<template src...>
```

and replaces that node with the clone of the remoteContent.

```JavaScript
class HTMLIncludeHandler extends EvtRt {
    static matching = 'template[src^="#"]';
    static whereInstanceOf = HTMLTemplateElement;
    
    mount(mountedElement: Element, mountConfig: MountConfig, context: MountContext): void {
        const template = mountedElement as HTMLTemplateElement;
        const src = template.getAttribute('src');
        if (!src || !src.startsWith('#')) return;
        
        const id = src.substring(1);
        
        // Search up through shadow roots
        const sourceElement = upShadowSearch(template, id);
        
        if (!sourceElement) {
            console.warn(`HTMLInclude: Element with id="${id}" not found`);
            return;
        }
        
        // Clone the source element
        const clone = sourceElement.cloneNode(true);
        
        // Insert before template and remove template
        template.parentNode?.insertBefore(clone, template);
        template.remove();
    }
}
```