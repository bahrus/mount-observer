# Rollback support for Enhancement Config

TypesCript definition types/mount-observer/types.d.ts defines:

```TypeScript
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
```

Let's please remove enhancementConfig, and remove all code and documentation that refers to enhancementConfig.

That includes suppoting passing an array into the MountObserver constructor.