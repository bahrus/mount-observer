// Dynamic import loading utilities
// Only loaded when MountConfig.import is specified
import { arr } from 'assign-gingerly/handlers/arr.js';
export async function loadImports(imports) {
    const importArray = arr(imports);
    const promises = importArray.map(imp => loadSingleImport(imp));
    return Promise.all(promises);
}
async function loadSingleImport(imp) {
    let url;
    let type = 'js';
    if (typeof imp === 'string') {
        url = imp;
    }
    else if (Array.isArray(imp)) {
        url = imp[0];
        type = imp[1]?.type || 'js';
    }
    else {
        url = imp.url;
        type = imp.type || 'js';
    }
    switch (type) {
        case 'css':
            return loadCSS(url);
        case 'json':
            return loadJSON(url);
        case 'html':
            return loadHTML(url);
        default:
            return import(url);
    }
}
async function loadCSS(url) {
    const response = await fetch(url);
    const text = await response.text();
    const sheet = new CSSStyleSheet();
    await sheet.replace(text);
    return sheet;
}
async function loadJSON(url) {
    const response = await fetch(url);
    return response.json();
}
async function loadHTML(url) {
    const response = await fetch(url);
    return response.text();
}
