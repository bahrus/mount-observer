import {waitForEvent} from './waitForEvent.js';
import {TemplateWithRemoteContent} from './ts-refs/mount-observer/types.js';

export async function getContent(templ: HTMLTemplateElement, target?: DocumentFragment | ShadowRoot | Document | Element) {
    const templWithRemoteContent = templ as TemplateWithRemoteContent;
    if(templWithRemoteContent.remoteContent) return templWithRemoteContent.remoteContent;
    await waitForEvent(templ, 'load');
    if(templWithRemoteContent.remoteContent) return templWithRemoteContent.remoteContent;
    throw 500; //remote content not loaded
}
