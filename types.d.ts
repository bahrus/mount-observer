// Core types for MountObserver v2 - Polyfill Supported Scenario I

import {EnhancementConfig} from 'assign-gingerly/types.d.ts';

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

export interface MountConfig {
    matching?: string;
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
    enhancementConfig?: EnhancementConfig | EnhancementConfig[];
}



export interface ImportSpec {
    url: string;
    type?: 'js' | 'css' | 'json' | 'html';
}

export interface MountContext {
    modules: any[];
    observer: IMountObserver;
    rootNode: Node;
    MountConfig: MountConfig
}



export type DoCallback = (mountedElement: Element, context: MountContext) => void;

// export interface DoCallbacks {
//     mount?: (mountedElement: Element, context: MountContext) => void;
//     dismount?: (mountedElement: Element, context: MountContext) => void;
//     disconnect?: (mountedElement: Element, context: MountContext) => void;
//     reconnect?: (mountedElement: Element, context: MountContext) => void;
// }

export type MountScope = 
    | 'registry'     // getRootRegistryContainer (default)
    | 'self'         // this element
    | 'root'         // getRootNode()
    | 'shadow'       // shadowRoot (throws if none)
    | Element;       // custom element to observe

export interface MountObserverOptions {
    disconnectedSignal?: AbortSignal;
    scope?: MountScope;
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
    MountConfig: MountConfig;
    mountContext: MountContext;
}

export interface IDismountEvent extends Event {
    mountedElement: Element;
    reason: DismountReason;
    MountConfig: MountConfig;
}


