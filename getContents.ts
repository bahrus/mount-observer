export async function getContents(templ: HTMLTemplateElement){
    const templWithRemoteContent = templ as HTMLTemplateElement & { remoteContent?: DocumentFragment };
    if(templWithRemoteContent.remoteContent) return templWithRemoteContent.remoteContent;
}