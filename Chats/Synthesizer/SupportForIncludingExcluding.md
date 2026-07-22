# Support for including / excluding import of script elements

The legacy/Synthesizer.ts has a method:

```TypeScript
checkIfAllowed(mose: MOSE){
    if(this.hasAttribute('passthrough')) return false;
    const {id} = mose;
    if(this.hasAttribute('include')){
        const split = this.getAttribute('include')!.split(' ');
        if(!split.includes(id)) return false;
    }
    if(this.hasAttribute('exclude')){
        const split = this.getAttribute('exclude')!.split(' ');
        if(split.includes(id)) return false;
    }
    return true;
}
```

Please implement something similar with the new Synthesizer.

I think we should beef up the security a bit.  If either include or exclude attributes exist, and the script element (mose with the old code above) doesn't have an id, I think we should exclude it.
