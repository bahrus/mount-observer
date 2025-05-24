//using Symbol.for, which is easily hackaable, because if two different entry points 
//come from different versions of mount-observer, things could get out of sync.
//Not an issue if this was built into the browser, but it is an issue for a custom a library.
//Do not make this file exportable, it is only for internal use.
export const arr = Symbol.for('MHtiI353KU+aKBDlz/jR+A');
