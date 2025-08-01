const proxies = new WeakMap<Element, ProxyConstructor>();
Object.defineProperty(Element.prototype, 'refs', {
    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target, prop) {
                    if (prop === 'itemref') {
                        return target.getAttribute('itemref')?.split(/\s+/).map(id => document.getElementById(id)) || [];
                    }
                    if (prop === 'labelledby') {
                        return target.getAttribute('aria-labelledby')?.split(/\s+/).map(id => document.getElementById(id)) || [];
                    }
                    return Reflect.get(target, prop);
                },
                set(target, prop, value) {
                    if (prop === 'itemref' || prop === 'aria-labelledby') {
                        target.setAttribute(prop, value.join(' '));
                        return true;
                    }
                    return Reflect.set(target, prop, value);
                }
            };
            proxies.set(this, new Proxy(this, handler));
        }
    }
})