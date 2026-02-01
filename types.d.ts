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
    | 'where-element-matches-failed';

export interface MountInit {
    whereElementMatches: string;
    whereAttr?: WhereAttr;
    whereInstanceOf?: Constructor | Constructor[];
    whereMediaMatches?: string | MediaQueryList;
    whereOutside?: string;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: DoCallback | DoCallbacks;
    loadingEagerness?: 'eager' | 'lazy';
    assignGingerly?: Record<string, any>;
    map?: MapConfig;
    getPlayByPlay?: boolean;
    mountedElemEmits?: EventConfig | EventConfig[];
}

export interface MapConfig {
    [coordinate: string]: MapEntry;
}

export interface MapEntry {
    instanceOf?: string;
    mapsTo?: string;
    /**
     * Only notify the presence of this attribute
     * the first time it is seen
     */
    once?: boolean;
    [key: string]: any;
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
    rootNode: Node;
    mountInit: MountInit
    //observeInfo: ObserveInfo;
}

// export interface ObserveInfo {
//     rootNode: Node;
// }

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

export interface WeakDual<T extends Object>{
    weakSet: WeakSet<T>,
    setWeak: Set<WeakRef<T>>
}

export interface IMountObserver extends EventTarget {
    observe(rootNode: Node): Promise<void>;
    disconnect(): void;
    disconnectedSignal: AbortSignal;
    assignGingerly(config: Record<string, any> | undefined): Promise<void>;
}

export interface IMountEvent extends Event {
    matchingElement: Element;
    modules: any[];
    mountInit: MountInit;
}

export interface IDismountEvent extends Event {
    matchingElement: Element;
    reason: DismountReason;
    mountInit: MountInit;
}

export interface IAttrChangeEvent extends Event {
    changes: AttrChange[];
    mountInit: MountInit;
}

export interface AttrChange {
    value: string | null;
    attrNode: Attr | null;
    mapEntry: MapEntry | null;
    attrName: string;
    coordinate: string;
    element: Element;
}
