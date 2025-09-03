import { nudge } from './nudge.js';
import { getCount } from './getCount.js';
const attrMap = {
    '@': 'name',
    '|': 'itemprop',
};
export function genIds(enhancedElement) {
    const { parentElement } = enhancedElement;
    if (parentElement === null)
        throw 404;
    //first find all elements with attribute #
    const hashIds = Array.from(parentElement.querySelectorAll('[\\#]'));
    const uniqueCheck = new Set();
    for (const hi of hashIds) {
        if (!(hi instanceof HTMLElement))
            continue;
        const { localName } = hi;
        if (uniqueCheck.has(localName))
            throw 500;
        uniqueCheck.add(localName);
        let sideEffects = '';
        const hashValue = hi.getAttribute('#');
        if (hashValue) {
            sideEffects = `${hashValue} `;
        }
        hi.dataset.id = `{{${sideEffects}${localName}}}`;
        hi.removeAttribute('#');
    }
    const dataIds = Array.from(parentElement.querySelectorAll('[data-id^="{{"][data-id$="}}"]'));
    const ids = [];
    for (const di of dataIds) {
        if (!(di instanceof HTMLElement))
            continue;
        const unparsedID = di.dataset.id;
        const inner = unparsedID?.substring(2, unparsedID.length - 2);
        if (!inner)
            continue;
        const split = inner.split(' ');
        const id = split.length === 2 ? split[1] : split[0];
        if (ids.includes(id))
            throw 500;
        ids.push(id);
    }
    const allChildren = Array.from(parentElement.querySelectorAll('*'));
    allChildren.push(parentElement);
    const idLookup = {};
    const base = 'gen-id-';
    for (const child of allChildren) {
        const attrs = child.attributes;
        for (const attr of attrs) {
            const { name, value } = attr;
            if (!name.startsWith('data-'))
                continue;
            if (name === 'data-id') {
                if (!value.startsWith('{{') || !value.endsWith('}}'))
                    continue;
                const inner = value.substring(2, value.length - 2);
                const split = inner.split(' ');
                const id = split.length === 2 ? split[1] : split[0];
                if (!(id in idLookup)) {
                    idLookup[id] = `${base}-${getCount(base)}`;
                }
                if (split.length === 2) {
                    const sideEffects = split[0];
                    for (const char of sideEffects) {
                        switch (char) {
                            case '@':
                            case '|':
                                child.setAttribute(attrMap[char], id);
                                break;
                            case '%':
                                child.part.add(id);
                                break;
                            case '.':
                                child.classList.add(id);
                                break;
                        }
                    }
                }
                child.id = idLookup[id];
                child.setAttribute('data-id', id);
            }
            else {
                let newValue = value;
                for (const id of ids) {
                    const token = `{{${id}}}`;
                    if (!newValue.includes(token))
                        continue;
                    if (!(id in idLookup)) {
                        idLookup[id] = `${base}-${getCount(base)}`;
                    }
                    newValue = newValue.replaceAll(token, idLookup[id]);
                }
                if (newValue === value)
                    continue;
                child.setAttribute(name.substring(5), newValue);
                child.removeAttribute(name);
            }
        }
        for (const attr of attrs) {
            const { name, value } = attr;
            if (!name.startsWith('defer-'))
                continue;
            const nameWithoutDefer = name.substring(6);
            const attrWithoutDefer = child.getAttributeNode(nameWithoutDefer);
            if (attrWithoutDefer === null)
                continue;
            const valueWithoutDefer = attrWithoutDefer.value;
            let newValue = valueWithoutDefer;
            let changeMade = false;
            for (const id of ids) {
                const token = `{{${id}}}`;
                if (!newValue.includes(token))
                    continue;
                if (!(id in idLookup)) {
                    idLookup[id] = `${base}-${getCount(base)}`;
                }
                newValue = newValue.replaceAll(token, idLookup[id]);
                changeMade = true;
            }
            //child.setAttribute(nameWithoutDefer, newValue);
            if (changeMade)
                attrWithoutDefer.value = newValue;
            nudge(child, name);
        }
    }
    if ('disabled' in parentElement) {
        nudge(parentElement);
    }
}
