// Core types for MountObserver v2 - Polyfill Supported Scenario I

export interface MountInit {
    whereElementMatches: string;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: DoCallback | DoCallbacks;
    loadingEagerness?: 'eager' | 'lazy';
}

export interface ImportSpec {
    url: string;
    type?: 'js' | 'css' | 'json' | 'html';
}

export interface MountContext {
    modules: any[];
    observer: IMountObserver;
    observeInfo: ObserveInfo;
}

export interface ObserveInfo {
    rootNode: Node;
}

export type DoCallback = (matchingElement: Element, context: MountContext) => void;

export interface DoCallbacks {
    mount?: (matchingElement: Element, context: MountContext) => void;
    dismount?: (matchingElement: Element, context: MountContext) => void;
    disconnect?: (matchingElement: Element, context: MountContext) => void;
    reconnect?: (matchingElement: Element, context: MountContext) => void;
}

export interface MountObserverOptions {
    disconnectedSignal?: AbortSignal;
}

export interface IMountObserver extends EventTarget {
    observe(rootNode: Node): void;
    disconnect(): void;
    disconnectedSignal: AbortSignal;
}

export interface IMountEvent extends Event {
    matchingElement: Element;
    modules: any[];
}

export interface IDismountEvent extends Event {
    matchingElement: Element;
}

export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const loadEventName = 'load';
