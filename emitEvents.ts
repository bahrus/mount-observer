import type { EventConfig, EventConstructor, MountConfig } from './types.d.ts';

/**
 * Emits events from a mounted element based on the mountedElemEmits configuration.
 * This module is dynamically loaded only when mountedElemEmits is configured.
 */
export async function emitMountedElementEvents(
    element: Element,
    MountConfig: MountConfig,
    processedEventsForElement: WeakMap<Element, Set<string>>
): Promise<void> {
    const configs = Array.isArray(MountConfig.mountedElemEmits) 
        ? MountConfig.mountedElemEmits 
        : [MountConfig.mountedElemEmits!];

    for (const config of configs) {
        await emitSingleEvent(element, MountConfig, config, processedEventsForElement);
    }
}

async function emitSingleEvent(
    element: Element,
    MountConfig: MountConfig,
    config: EventConfig,
    processedEventsForElement: WeakMap<Element, Set<string>>
): Promise<void> {
    // Check if this event should only fire once per element
    if (config.oncePerMountedElement) {
        const eventId = getEventId(config);
        let processedEvents = processedEventsForElement.get(element);
        
        if (!processedEvents) {
            processedEvents = new Set<string>();
            processedEventsForElement.set(element, processedEvents);
        }
        
        if (processedEvents.has(eventId)) {
            return; // Already emitted for this element
        }
        
        processedEvents.add(eventId);
    }

    // Resolve event constructor
    const EventCtor = resolveEventConstructor(config.event);

    // Process args with magic string substitution
    const processedArgs = config.args !== undefined 
        ? processMagicStrings(config.args, element, MountConfig)
        : undefined;

    // Construct the event
    let event: Event;
    if (processedArgs === undefined) {
        event = new EventCtor();
    } else if (Array.isArray(processedArgs)) {
        // For array args, ensure bubbles is set if second arg is an options object
        if (processedArgs.length === 2 && typeof processedArgs[0] === 'string' && typeof processedArgs[1] === 'object' && processedArgs[1] !== null) {
            // Merge bubbles: true into the options object if not already set
            const options = { bubbles: true, ...processedArgs[1] };
            event = new EventCtor(processedArgs[0], options);
        } else {
            event = new EventCtor(...processedArgs);
        }
    } else {
        // Single arg - if it's a string (event name), add bubbles: true by default
        if (typeof processedArgs === 'string') {
            event = new EventCtor(processedArgs, { bubbles: true });
        } else {
            event = new EventCtor(processedArgs);
        }
    }

    // Apply eventProps if specified
    if (config.eventProps) {
        const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
        const processedProps = processMagicStrings(config.eventProps, element, MountConfig);
        assignGingerly(event, processedProps);
    }

    // Dispatch the event from the mounted element
    element.dispatchEvent(event);
}

function resolveEventConstructor(event: string | EventConstructor): EventConstructor {
    if (typeof event === 'string') {
        const EventCtor = (globalThis as any)[event];
        if (!EventCtor || typeof EventCtor !== 'function') {
            throw new Error(`Event constructor "${event}" not found in globalThis`);
        }
        return EventCtor;
    }
    return event;
}

function getEventId(config: EventConfig): string {
    const eventName = typeof config.event === 'string' ? config.event : config.event.name;
    const argsStr = JSON.stringify(config.args || '');
    return `${eventName}:${argsStr}`;
}

function processMagicStrings(value: any, element: Element, MountConfig: MountConfig): any {
    if (typeof value === 'string') {
        if (value === '{{mountedElement}}') {
            return element;
        }
        if (value === '{{MountConfig}}') {
            return MountConfig;
        }
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => processMagicStrings(item, element, MountConfig));
    }

    if (value && typeof value === 'object') {
        const processed: any = {};
        for (const [key, val] of Object.entries(value)) {
            processed[key] = processMagicStrings(val, element, MountConfig);
        }
        return processed;
    }

    return value;
}
