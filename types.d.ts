export interface MountInit{
    readonly match: CSSMatch,
    readonly whereElementIntersectsWith: IntersectionObserverInit,
    readonly whereMediaMatches: MediaQuery,
    readonly whereInstanceOf?: Array<typeof Node>, //[TODO] What's the best way to type this?,
    readonly whereSatisfies: PipelineProcessor<boolean>,
    readonly import?: ImportString | [ImportString, ImportAssertions] | PipelineProcessor,
    readonly do: {
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

} 

type PipelineStage = 'PreImport' | 'PostImport'
export type PipelineProcessor<ReturnType = void> = (matchingElement: Element, ctx: MountContext, stage: PipelineStage) => Promise<ReturnType>;

