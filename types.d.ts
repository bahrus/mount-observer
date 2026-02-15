// Core types for MountObserver v2 - Polyfill Supported Scenario I

export type Constructor = new (...args: any[]) => any;

export type EventConstructor = {new(...args: any[]): Event};

export interface EventConfig {
    event: string | EventConstructor;
    args?: any | any[];
    eventProps?: Record<string, any>;
    oncePerMountedElement?: boolean;
}

export type DismountReason = 
    | 'media-query-failed'
    | 'with-matching-failed';

export interface MountInit {
    matching: string;
    withInstance?: Constructor | Constructor[];
    withMediaMatching?: string | MediaQueryList;
    withScopePerimeter?: string;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: string | DoCallback | (string | DoCallback)[];
    loadingEagerness?: 'eager' | 'lazy';
    assignOnMount?: Record<string, any>;
    assignOnDismount?: Record<string, any>;
    stageOnMount?: Record<string, any>;
    getPlayByPlay?: boolean;
    mountedElemEmits?: EventConfig | EventConfig[];
    reference?: number | number[];
    //allow handler classes or functions
    //to be passed some custom information
    customData?: unknown;
}



export interface ImportSpec {
    url: string;
    type?: 'js' | 'css' | 'json' | 'html';
}

export interface MountContext {
    modules: any[];
    observer: IMountObserver;
    rootNode: Node;
    mountInit: MountInit
}



export type DoCallback = (mountedElement: Element, context: MountContext) => void;

// export interface DoCallbacks {
//     mount?: (mountedElement: Element, context: MountContext) => void;
//     dismount?: (mountedElement: Element, context: MountContext) => void;
//     disconnect?: (mountedElement: Element, context: MountContext) => void;
//     reconnect?: (mountedElement: Element, context: MountContext) => void;
// }

export interface MountObserverOptions {
    disconnectedSignal?: AbortSignal;
}

export interface WeakDual<T extends Object>{
    weakSet: WeakSet<T>,
    setWeak: Set<WeakRef<T>>
}

export interface IMountObserver extends EventTarget {
    observe(rootNode: Node): Promise<void>;
    disconnect(): void;
    disconnectedSignal: AbortSignal;
    assignGingerly(config: Record<string, any> | undefined): Promise<void>;
    getNotifier(element: Element): EventTarget;
}

export interface IMountEvent extends Event {
    mountedElement: Element;
    modules: any[];
    mountInit: MountInit;
    mountContext: MountContext;
}

export interface IDismountEvent extends Event {
    mountedElement: Element;
    reason: DismountReason;
    mountInit: MountInit;
}


