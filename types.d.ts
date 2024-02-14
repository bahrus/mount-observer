export interface MountInit{
    readonly on?: CSSMatch,
    //readonly attribMatches?: Array<AttribMatch>,
    readonly whereAttr?: WhereAttr,  
    readonly whereElementIntersectsWith?: IntersectionObserverInit,
    readonly whereMediaMatches?: MediaQuery,
    readonly whereInstanceOf?: Array<typeof Node>, //[TODO] What's the best way to type this?,
    readonly whereSatisfies?: PipelineProcessor<boolean>,
    readonly import?: ImportString | [ImportString, ImportAssertions] | PipelineProcessor,
    readonly do?: {
        readonly mount?: PipelineProcessor,
        readonly dismount?: PipelineProcessor,
        readonly disconnect?: PipelineProcessor,
        readonly reconfirm?: PipelineProcessor,
        readonly exit?: PipelineProcessor,
    }
    // /**
    //  * Purpose -- there are scenarios where we may only want to affect changes that occur after the initial 
    //  * server rendering, so we only want to mount elements that appear 
    //  */
    // readonly ignoreInitialMatches?: boolean,
}
export interface WhereAttr{
    hasBase: string,
    hasBranchIn?: Array<string>,
    hasRootIn?: Array<string | {
        path: string,
        context: 'BuiltIn' | 'CustomElement' | 'Both'
    }>,
}
type CSSMatch = string;
type ImportString = string;
type MediaQuery = string;

export interface AttribMatch{
    names: string[],
    //for boolean, support true/false/mixed
    // type?: 'number' | 'string' | 'date' | 'json-object' | 'boolean',
    // valConverter?: (s: string) => any,
    // validator?: (v: any) => boolean;
}

export interface IMountObserver {
    // readonly mountInit: MountInit,
    // readonly mountedRefs:  WeakRef<Element>[],
    // readonly dismountedRefs: WeakRef<Element>[],
    observe(within: Node): void;
    unobserve(within: Node): void;
    module?: any;
} 

export interface MountContext{
    stage?: PipelineStage,
    initializing?: boolean,
}

type PipelineStage = 'Inspecting' | 'PreImport' | 'PostImport' | 'Import' 
export type PipelineProcessor<ReturnType = void> = (matchingElement: Element, observer: IMountObserver, ctx: MountContext) => Promise<ReturnType>;

//#region mutation event
export type mutationEventName = 'mutation-event';
export interface MutationEvent{
    mutationRecords: Array<MutationRecord>
}
export type mutationEventHandler = (e: MutationEvent) => void;

export interface AddMutationEventListener {
    addEventListener(eventName: mutationEventName, handler: mutationEventHandler, options?: AddEventListenerOptions): void;
}
//#endregion

interface AttrChangeInfo{
    name: string,
    root?: string,
    base?: string,
    branch?: string,
    leaf?: string, //TODO
    oldValue: string | null,
    newValue: string | null,
    idx: number,
    //parsedNewValue?: any,
}

//#region mount event
export type mountEventName = 'mount';
export interface IMountEvent{
    mountedElement: Element,
}
export type mountEventHandler = (e: IMountEvent) => void;

export interface AddMountEventListener {
    addEventListener(eventName: mountEventName, handler: mountEventHandler, options?: AddEventListenerOptions): void;
}
//#endregion

//#region dismount event
export type dismountEventName = 'dismount';
export interface IDismountEvent {
    dismountedElement: Element
}

export type dismountEventHandler = (e: IDismountEvent) => void;

export interface AddDismountEventListener {
    addEventListener(eventName: dismountEventName, handler: dismountEventHandler, options?: AddEventListenerOptions): void;
}
//#endregion

//#region disconnected event
export type disconnectedEventName = 'disconnect';
export interface IDisconnectEvent {
    disconnectedElement: Element
}

export type disconnectedEventHandler = (e: IDisconnectEvent) => void;

export interface AddDisconnectEventListener {
    addEventListener(eventName: disconnectedEventName, handler: disconnectedEventHandler, options?: AddEventListenerOptions): void;
}
//endregion

//#region attribute change event
export type attrChangeEventName = 'attr-change';
export interface IAttrChangeEvent extends IMountEvent {
    attrChangeInfo: AttrChangeInfo,
}
export type attrChangeEventHander = (e: IAttrChangeEvent) => void;
export interface AddAttrChangeEventistener{
    addEventListener(eventName: attrChangeEventName, handler: attrChangeEventHander, options?: AddEventListenerOptions): void;
}
//#endregion

