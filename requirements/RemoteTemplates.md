# Remote Teamplates

If a template has an id:

```html
<my-web-component>
    #shadow
        <template id=my-template>
            <div>My content</div>
        </template>
</my-web-component>
```

The most likely reason for defining a template with an id is that it will be used to clone its contents (potentially conditionally when conditions are met).  But custom elements typically repeat throughout a page, and my timing experiments indicate it performs better to move the template out the web component and reference a single template.

This functionality was previously implemented in a different way, but for the same purpose in legacy/preloadContent.ts.

# built-in handler 

So now let's discuss the requirement, which is to create another built-in handler:

```html
<div>
    <template id=my-template>
        <div>My Content</div>
    </template>
</div>

<script type=mountobserver>{
    "do": "builtIns.globalizeTemplate"
}</script>
```

What this does:

1.  matches within the observedNode (customElementRegistry scope in this case by default) for all template elements that:

    1.  Has an id attribute 
    2.  no src attribute
    3.  parent element is not the head element

2.  Does this logic (correct as needed):

```JavaScript

const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');

if(!('remoteContent') in templ){
    const head = document.head;
    if((<any>window)[remoteTemplElSym] === undefined ){
        (<any>window)[remoteTemplElSym] = 0;
    }
    const id = `mount-observer-${(<any>window)[remoteTemplElSym]++}`;
    const sourceTempl = document.createElement('template');
    sourceTempl.id = id;
    sourceTempl.content.appendChild(templ.content);
    head.append(sourceTempl);
    templ.innerHTML = '';
    templ.setAttribute('src', `#${id}`);
    templ.setAttribute('rel', 'preload');
    (<any>templ)[remoteTemplElSym] = new WeakRef(sourceTempl);
    Object.defineProperty(templ, 'remoteContent', {
        get(){
            const src = this.getAttribute('src');
            const test = (<any>this)[remoteTemplElSym]?.deref();
            if(test !== undefined) return test.content;
            throw 404;
            // if(templ.getAttribute('rel') !== 'preload') throw 'NI';
            // const isIntraDoc = src[0] === '#';
            // if(!isIntraDoc) throw 'NI';
            // const id = src.substring(1);
            // const remoteTempl = upShadowSearch(templ, id);
            // if(!(remoteTempl instanceof HTMLTemplateElement)) throw 404; //not found
            // (<any>templ)[remoteTemplElSym] = new WeakRef(remoteTempl);
            // return remoteTempl.content;
            // return sourceTempl.content;
        }
    }
}


```