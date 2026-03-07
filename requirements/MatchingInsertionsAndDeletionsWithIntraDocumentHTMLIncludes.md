# Matching Insertions and Deletions With Intra Document HTML Includes

Please implement the function described [here](https://github.com/bahrus/be-inclusive) with the built in HTMLInclude handler.

Something that wasn't clarified with that Readme is this also allows for "nulling out" content:

```html
<div itemscope id=love>
    ...
    <data value=false itemprop=todayIsFriday>It's Thursday</data>
</div>

...

<template src=#ove>
    <data value=true itemprop=todayIsFriday -i="value "></data>
</template>
```

results in:

```html
<div itemscope id=love>
    ...
    <data value=false itemprop=todayIsFriday>It's Thursday</data>
</div>

...

<div itemscope>
    <data value=true itemprop=todayIsFriday -i="value "></data>
</div>
```

The implementation can be seen [here](https://github.com/bahrus/be-inclusive/blob/baseline/be-inclusive.js) in case that helps clarify anything.