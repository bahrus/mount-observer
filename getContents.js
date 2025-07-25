export async function getContents(templ) {
    const templWithRemoteContent = templ;
    if (templWithRemoteContent.remoteContent)
        return templWithRemoteContent.remoteContent;
}
