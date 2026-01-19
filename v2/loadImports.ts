// Dynamic import loading utilities
// Only loaded when MountInit.import is specified

import { ImportSpec } from './types.js';

export async function loadImports(
    imports: string | ImportSpec | Array<string | ImportSpec | [string, any]>
): Promise<any[]> {
    const importArray = Array.isArray(imports) ? imports : [imports];
    const promises = importArray.map(imp => loadSingleImport(imp));
    return Promise.all(promises);
}

async function loadSingleImport(imp: string | ImportSpec | [string, any]): Promise<any> {
    let url: string;
    let type: string = 'js';

    if (typeof imp === 'string') {
        url = imp;
    } else if (Array.isArray(imp)) {
        url = imp[0];
        type = imp[1]?.type || 'js';
    } else {
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

async function loadCSS(url: string): Promise<CSSStyleSheet> {
    const response = await fetch(url);
    const text = await response.text();
    const sheet = new CSSStyleSheet();
    await sheet.replace(text);
    return sheet;
}

async function loadJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
}

async function loadHTML(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
}
