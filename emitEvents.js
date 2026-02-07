/**
 * Emits events from a mounted element based on the mountedElemEmits configuration.
 * This module is dynamically loaded only when mountedElemEmits is configured.
 */
export async function emitMountedElementEvents(element, mountInit, processedEventsForElement) {
    const configs = Array.isArray(mountInit.mountedElemEmits)
        ? mountInit.mountedElemEmits
        : [mountInit.mountedElemEmits];
    for (const config of configs) {
        await emitSingleEvent(element, mountInit, config, processedEventsForElement);
    }
}
async function emitSingleEvent(element, mountInit, config, processedEventsForElement) {
    // Check if this event should only fire once per element
    if (config.oncePerMountedElement) {
        const eventId = getEventId(config);
        let processedEvents = processedEventsForElement.get(element);
        if (!processedEvents) {
            processedEvents = new Set();
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
        ? processMagicStrings(config.args, element, mountInit)
        : undefined;
    // Construct the event
    let event;
    if (processedArgs === undefined) {
        event = new EventCtor();
    }
    else if (Array.isArray(processedArgs)) {
        // For array args, ensure bubbles is set if second arg is an options object
        if (processedArgs.length === 2 && typeof processedArgs[0] === 'string' && typeof processedArgs[1] === 'object' && processedArgs[1] !== null) {
            // Merge bubbles: true into the options object if not already set
            const options = { bubbles: true, ...processedArgs[1] };
            event = new EventCtor(processedArgs[0], options);
        }
        else {
            event = new EventCtor(...processedArgs);
        }
    }
    else {
        // Single arg - if it's a string (event name), add bubbles: true by default
        if (typeof processedArgs === 'string') {
            event = new EventCtor(processedArgs, { bubbles: true });
        }
        else {
            event = new EventCtor(processedArgs);
        }
    }
    // Apply eventProps if specified
    if (config.eventProps) {
        const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
        const processedProps = processMagicStrings(config.eventProps, element, mountInit);
        assignGingerly(event, processedProps);
    }
    // Dispatch the event from the mounted element
    element.dispatchEvent(event);
}
function resolveEventConstructor(event) {
    if (typeof event === 'string') {
        const EventCtor = globalThis[event];
        if (!EventCtor || typeof EventCtor !== 'function') {
            throw new Error(`Event constructor "${event}" not found in globalThis`);
        }
        return EventCtor;
    }
    return event;
}
function getEventId(config) {
    const eventName = typeof config.event === 'string' ? config.event : config.event.name;
    const argsStr = JSON.stringify(config.args || '');
    return `${eventName}:${argsStr}`;
}
function processMagicStrings(value, element, mountInit) {
    if (typeof value === 'string') {
        if (value === '{{mountedElement}}') {
            return element;
        }
        if (value === '{{mountInit}}') {
            return mountInit;
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => processMagicStrings(item, element, mountInit));
    }
    if (value && typeof value === 'object') {
        const processed = {};
        for (const [key, val] of Object.entries(value)) {
            processed[key] = processMagicStrings(val, element, mountInit);
        }
        return processed;
    }
    return value;
}
