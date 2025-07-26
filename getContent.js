import { waitForEvent } from './waitForEvent.js';
export async function getContent(templ) {
    const templWithRemoteContent = templ;
    if (templWithRemoteContent.remoteContent)
        return templWithRemoteContent.remoteContent;
    await waitForEvent(templ, 'load');
    if (templWithRemoteContent.remoteContent)
        return templWithRemoteContent.remoteContent;
    throw 500; //remote content not loaded
}
