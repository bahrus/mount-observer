// Core types for MountObserver v2 - Polyfill Supported Scenario I

export interface MountInit {
    whereElementMatches: string;
    whereAttr?: WhereAttr;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: DoCallback | DoCallbacks;
    loadingEagerness?: 'eager' | 'lazy';
    assignGingerly?: Record<string, any>;
}

export type BranchValue = string | { [key: string]: BranchValue[] };

export interface WhereAttr {
    hasBuiltInRootIn?: string[];
    hasCERootIn?: string[];
    hasBase: string;
    hasBranchIn?: BranchValue[];
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
