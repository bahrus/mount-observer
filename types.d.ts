type CSSMatch = string;
type ImportString = string;
type MediaQuery = string;

export interface ImportContext {
    mountInit: MountInit,
    refs:  readonly WeakRef<Element>[],
    observe(within: Node): void;
    unobserve(within: Node): void;

} 
export type PipelineProcessor<ReturnType = void> = (matchingElement: Element, ctx: ImportContext) => Promise<ReturnType>;
export interface ActionPipeline{
    mountIf: PipelineProcessor<boolean>,
    onMount: PipelineProcessor,
    onDismount: PipelineProcessor,
    onDisconnect: PipelineProcessor,
}
export interface MountOptions{
    once?: boolean,
}
export interface MountInit{
    sift:{
        for: CSSMatch,
        //within?: Node,
        havingIntersectionBehavior?: IntersectionObserver,
        matchingMedia: MediaQuery
    }
    do: PipelineProcessor | ActionPipeline,
    intersectionObserverInit?: IntersectionObserverInit,
    containerQuery?: MediaQuery,
    actsOn: {
        instanceOf?: Array<typeof Node>, //[TODO] What's the best way to type this?,
        cssMatch?: string,
    },
    import?: ImportString | [ImportString, ImportAssertions] | PipelineProcessor,
}