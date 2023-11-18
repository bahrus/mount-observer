export interface MountInit{
    readonly match: CSSMatch,
    readonly whereElementIntersectsWith: IntersectionObserverInit,
    readonly whereMediaMatches: MediaQuery,
    readonly whereInstanceOf?: Array<typeof Node>, //[TODO] What's the best way to type this?,
    readonly whereSatisfies: PipelineProcessor<boolean>,
    readonly import?: ImportString | [ImportString, ImportAssertions] | PipelineProcessor,
    readonly do?: {
        readonly onMount: PipelineProcessor,
        readonly onDismount: PipelineProcessor,
        readonly onDisconnect: PipelineProcessor,
        readonly onReconfirmed: PipelineProcessor,
        readonly onOutsideRootNode: PipelineProcessor,
    }
    
}
type CSSMatch = string;
type ImportString = string;
type MediaQuery = string;

export interface MountContext {
    // readonly mountInit: MountInit,
    // readonly mountedRefs:  WeakRef<Element>[],
    // readonly dismountedRefs: WeakRef<Element>[],
    observe(within: Node): void;
    unobserve(): void;
    module?: any;
} 

type PipelineStage = 'Inspecting' | 'PreImport' | 'PostImport' | 'Import'
export type PipelineProcessor<ReturnType = void> = (matchingElement: Element, ctx: MountContext, stage?: PipelineStage) => Promise<ReturnType>;

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

//#region mount event
export type mountEventName = 'mount';
export interface IMountEvent{
    mountedElement: Element
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

