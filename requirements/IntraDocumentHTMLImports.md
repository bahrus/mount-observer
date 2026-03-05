# Intra Document HTML Includes, Part I

One of the most useful features of any programming language is the notion of a variable, such as  constant, as it provides for reuse.

The built-in handler we describe here should build on the Hoist Template built-in handler (by referencing oTemplate.remoteContent || oTemplate.content). 

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

A global template needs to be made out of 

```html
<div id=Friday>
    <div>It's <span itemprop=day5></span> I'm in love</div>
</div>
```


We need a builtIns.HTMLInclude that watches for elements matching

```html
<template src...>
```