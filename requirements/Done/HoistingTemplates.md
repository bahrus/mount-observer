# Hoisting Templates

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
    "do": "builtIns.hoistTemplate"
}</script>
```

What this does:

1.  matches within the observedNode (customElementRegistry scope in this case by default) for all template elements that:

    1.  Has an id attribute 
    2.  no src attribute
    3.  templ.isConnected = false (discovered while cloning another template getting ready to be added to shadowRoot), or is connected but root node is a shadow root.  The Mount Observer automatically checks for the conditions being fulfilled even before the fragment becomes connected. 

2.  Does this logic (correct as needed):

```JavaScript

class HoistTemplateHandler extends EvtRt {
    static matching = 'template[id]:not([src])';
    static whereInstanceOf = HTMLTemplateElement;
    
    static shouldMount(el) {
        const template = el;
        // Case 1: Not connected (being cloned)
        if (!template.isConnected) return true;
        
        // Case 2: Connected but in a shadow root
        const root = template.getRootNode();
        return root instanceof ShadowRoot;
    }
    
    mount(element, context) {
        hoistTemplate(element);
    }
}

//use compact guid to ensure uniqueness, no one externally
//should care what it is (basically private)
const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');

if(!templ.hasOwnProperty('remoteContent')){
    const {head} = document;
    if((<any>globalThis)[remoteTemplElSym] === undefined ){
        (<any>globalThis)[remoteTemplElSym] = 0;
    }
    const id = `mount-observer-${(<any>globalThis)[remoteTemplElSym]++}`;
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
            throw new Error('Hoisted template not found or was garbage collected');

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

Don't implement the commented code yet (or put the commented code in the implementation).  This is just something to refer to for future requirements.