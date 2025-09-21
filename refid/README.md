*mount-observer* has a polyfill for [this proposal](https://github.com/whatwg/html/issues/11585), but with some differences due to the limited ability a polyfill can provide compared to the platform.

## Installation

Any DOM fragment that gets observed by the MountObserver class instance will automatically apply  the rules above.

In the absence of such observing, call:

```JavaScript
import {genIds} from 'mount-observer/refid/genIds.js';
genIds(oElementContainer);
```

## Activation



To activate a scoped id generation, add attribute -id to the last streamed element inside either the fieldset element, or an element adorned by the itemscope attribute, or the (Shadow) root.  

If the -id attribute is not added to the last streamed element, but elsewhere, then the functionality will likely work the same, but may possible miss some elements after the attribute, in the unlikely event that the auto generated id's are created prior to additional elements streaming in.

## Example 1

```html
<fieldset disabled>
    <label>
        LHS: <input data-id={{lhs}}>
    </label>
    
    <label for=rhs>
        RHS: <input data-id={{rhs}}>
    </label>
    
    <template -id defer-🎚️ 🎚️='on if isEqual, based on #{{lhs}} and #{{rhs}}.'>
        <div>LHS === RHS</div>
    </template>
</fieldset>
```

adjusts the DOM so as to become:

```html
<fieldset disabled>
    <label>
        LHS: <input id=gid-0 data-id=lhs>
    </label>
    
    <label for=rhs>
        RHS: <input id=gid-1 data-id=rhs>
    </label>
    
    <template 🎚️='on if isEqual, based on #gid-0 and #gid-1.'>
        <div>LHS === RHS</div>
    </template>
</fieldset>
```

Note that the numbers after gid- will vary depending on previous DOM elements that may have been processed by the ID generator.

## Side Effects

```html
<form>
    <fieldset disabled>
        <label>
            LHS: <input class=my-class data-id={{@. lhs}}>
        </label>
        
        <label for=rhs>
            RHS: <span contenteditable part=my-part data-id={{|% rhs}}>
        </label>
        
        <template -id defer-🎚️ 🎚️='on if isEqual, based on #{{lhs}} and #{{rhs}}.'>
            <div>LHS === RHS</div>
        </template>
    </fieldset>
</form>
```

results in

```html
<form>
    <fieldset>
        <label>
            LHS: <input name=lhs class="my-part lhs" id=gid-0  data-id=lhs>
        </label>
        
        <label for=rhs>
            RHS: <span itemprop=rhs part="my-part rhs" data-id=rhs>
        </label>
        
        <template 🎚️='on if isEqual, based on #gid-0 and #gid-1.'>
            <div>LHS === RHS</div>
        </template>
    </fieldset>
</form>
```

## Example 2

Id's based on the element name

```html
<ways-of-science itemscope>
    <carrot-nosed-woman #></carrot-nosed-woman>
    <a-duck #></a-duck>
    <template -id defer-🎚️
        🎚️="on based on #{{carrot-nosed-woman}}::weight-change and #{{a-duck}}::molting."
        onchange="event.r = Math.abs(event.args[0] - event.args[1]) < 10"
    >
        <div>A witch!</div>
        <div>Burn her!</div>
    </template>
</ways-of-science>
```

results in:

```html
<ways-of-science itemscope>
    <carrot-nosed-woman id=gid-0 data-id=carrot-nosed-woman></carrot-nosed-woman>
    <a-duck id=gid-1 data-id=a-duck></a-duck>
    <template
        🎚️="on based on #gid-0::weight-change and #gid-1::molting."
        onchange="event.r = Math.abs(event.args[0] - event.args[1]) < 10"
    >
        <div>A witch!</div>
        <div>Burn her!</div>
    </template>
</ways-of-science>
```

## By N@me

```html
<form>
    <fieldset disabled>
        <input name=isHappy type="checkbox" @>
        <template -id defer-🎚️ 🎚️='on when #{{isHappy}}.'>
            <my-content></my-content>
        </template>
    </fieldset>
</form>
```

results in:

```html
<form>
    <fieldset>
        <input name=isHappy id=gid-0 data-id=isHappy type="checkbox">
        <template 🎚️='on when #gid-0.'>
            <my-content></my-content>
        </template>
    </fieldset>
</form>
```

## By |temprop

```html
<form>
    <fieldset disabled>
        <data value=true itemprop=isHappy hidden |></data>
        <template -id defer-🎚️ 🎚️='on when #{{isHappy}}.'>
            <my-content></my-content>
        </template>
    </fieldset>
</form>
```

results in:

```html
<form>
    <fieldset>
        <data value=true data-id=isHappy id=gid-0 itemprop=isHappy hidden |></data>
        <template 🎚️='on when #gid-0.'>
            <my-content></my-content>
        </template>
    </fieldset>
</form>
```

