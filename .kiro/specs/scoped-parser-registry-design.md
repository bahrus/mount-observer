# Scoped Parser Registry Design - mount-observer

> **Cross-Repository Feature**: This document focuses on changes to the mount-observer package. For the complete design including assign-gingerly changes, see the main design document in the workspace root at `.kiro/specs/scoped-parser-registry/design.md`.

## Overview

This feature adds EMC parser loading and waiting capabilities to mount-observer, enabling lazy-loading of complex parsers for enhancement attributes. Two new script types are introduced:

1. **`<script type="emc-parser">`** - Loads and registers parser modules
2. **`<script type="emc" wait-for-parsers="...">`** - Waits for parsers before processing enhancements

### Key Changes to mount-observer

1. **New `EMCParserScript` handler** - Loads parser modules and registers them with synthesizer element's scoped registry
2. **Modified `EMCScript` handler** - Adds parser waiting logic and stores synthesizer element reference in enhancement config
3. **Synthesizer element discovery** - Find containing synthesizer element from script element (not from enhanced element)

## Context Threading Solution

**The Challenge**: Enhanced elements may not be DOM descendants of the synthesizer element (be-hive), so we can't traverse from enhanced element to find the be-hive.

**The Solution**: The EMCScript handler finds the synthesizer element by traversing up from the **script element** (which IS inside the be-hive), then stores this reference in the enhancement configuration to be passed through SpawnContext.

```
EMCScript.handleMount(scriptElement)
  ↓
  scriptElement.closest('be-hive')  // Script IS inside be-hive
  ↓
  Store synthesizerElement in enhancement config
  ↓
  When element matches enhancement:
    ↓
    SpawnContext includes synthesizerElement
    ↓
    Enhancement constructor receives ctx.synthesizerElement
    ↓
    Passes to parseWithAttrs for scoped parser resolution
```

## New Components

### 1. EMCParserScript Handler

**File**: `mount-observer/handlers/EMCParserScript.ts` (new file)

**Purpose**: Handle `<script type="emc-parser">` elements to load and register parsers.

```typescript
import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types.js';
import { getParserRegistry } from 'assign-gingerly/parserRegistry.js';

export class EMCParserScriptHandler extends EvtRt {
  static matching = 'script[type="emc-parser"]';
  static whereInstanceOf = HTMLScriptElement;
  
  async mount(
    mountedElement: Element,
    mountConfig: MountConfig,
    context: MountContext
  ): Promise<void> {
    const scriptElement = mountedElement as HTMLScriptElement;
    
    // Read attributes
    const src = scriptElement.getAttribute('src');
    const parserName = scriptElement.getAttribute('parser-name');
    
    if (!src) {
      console.error('EMCParserScript: missing src attribute', scriptElement);
      scriptElement.setAttribute('data-parser-error', 'missing src attribute');
      return;
    }
    
    if (!parserName) {
      console.error('EMCParserScript: missing parser-name attribute', scriptElement);
      scriptElement.setAttribute('data-parser-error', 'missing parser-name attribute');
      return;
    }
    
    // Find containing synthesizer element
    const synthesizerElement = this.findContainingSynthesizer(scriptElement);
    if (!synthesizerElement) {
      console.error('EMCParserScript: no containing synthesizer element found', scriptElement);
      scriptElement.setAttribute('data-parser-error', 'no containing synthesizer element');
      return;
    }
    
    try {
      // Dynamic import the parser module
      const module = await import(src);
      
      // Get parser function from default export
      const parser = module.default;
      
      if (typeof parser !== 'function') {
        throw new Error(
          `Parser module "${src}" must export a function as default export. ` +
          `Received: ${typeof parser}`
        );
      }
      
      // Get scoped registry and register parser
      const registry = getParserRegistry(synthesizerElement);
      registry.register(parserName, parser);
      
      // Dispatch event
      scriptElement.dispatchEvent(new CustomEvent('parser-registered', {
        detail: { parserName },
        bubbles: true
      }));
      
      console.log(`Registered parser "${parserName}" from ${src}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to load parser "${parserName}" from "${src}":`, errorMessage);
      scriptElement.setAttribute('data-parser-error', errorMessage);
    }
  }
  
  /**
   * Find the nearest ancestor synthesizer element
   * Traverses up through shadow root boundaries
   */
  private findContainingSynthesizer(element: Element): Element | undefined {
    let current: Node | null = element;
    
    while (current) {
      if (current instanceof Element) {
        // Check for synthesizer marker or known synthesizer tag names
        if (current.hasAttribute('data-synthesizer') || 
            current.localName === 'be-hive' ||
            (current as any).__isSynthesizer === true) {
          return current;
        }
      }
      
      // Try parent element
      if (current.parentElement) {
        current = current.parentElement;
      }
      // Try shadow root host
      else if (current instanceof ShadowRoot) {
        current = current.host;
      }
      // Try parent node (for document fragments)
      else if (current.parentNode) {
        current = current.parentNode;
      }
      else {
        break;
      }
    }
    
    return undefined;
  }
}
```

## Modified Components

### 2. EMCScript Handler

**File**: `mount-observer/handlers/EMCScript.ts`

**Changes**: Add parser waiting logic and synthesizer element storage

```typescript
// Add to existing EMCScript handler

async mount(
  mountedElement: Element,
  mountConfig: MountConfig,
  context: MountContext
): Promise<void> {
  const scriptElement = mountedElement as HTMLScriptElement;
  
  // STEP 1: Find containing synthesizer element
  // The script element IS inside a be-hive (DOM descendant)
  const synthesizerElement = this.findContainingSynthesizer(scriptElement);
  
  // STEP 2: Check for wait-for-parsers attribute
  const waitForParsers = scriptElement.getAttribute('wait-for-parsers');
  
  if (waitForParsers && synthesizerElement) {
    // Parse space-delimited parser names
    const parserNames = waitForParsers.split(/\s+/).filter(name => name.length > 0);
    
    if (parserNames.length > 0) {
      // Get timeout (default: 60000ms = 1 minute)
      const timeoutAttr = scriptElement.getAttribute('data-parser-timeout');
      const timeout = timeoutAttr ? parseInt(timeoutAttr, 10) : 60000;
      
      try {
        // Get scoped registry and wait for parsers
        const registry = getParserRegistry(synthesizerElement);
        await registry.waitFor(parserNames, timeout);
        
        console.log(`Parsers ready: ${parserNames.join(', ')}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`EMCScript parser waiting failed:`, errorMessage);
        scriptElement.setAttribute('data-emc-error', errorMessage);
        return; // Stop processing - don't spawn enhancement
      }
    }
  }
  
  // STEP 3: Load and process EMC configuration
  // ... existing EMC loading code ...
  
  // STEP 4: Store synthesizerElement in enhancement config
  // This needs to be added to the enhancement configuration object
  // so it can be passed through SpawnContext
  if (synthesizerElement) {
    // Assuming enhancementConfig is the loaded configuration object:
    enhancementConfig.synthesizerElement = synthesizerElement;
  }
  
  // STEP 5: Proceed with normal enhancement processing
  // ... existing enhancement registration code ...
}

/**
 * Find the nearest ancestor synthesizer element
 * Traverses up through shadow root boundaries
 */
private findContainingSynthesizer(element: Element): Element | undefined {
  let current: Node | null = element;
  
  while (current) {
    if (current instanceof Element) {
      // Check for synthesizer marker or known synthesizer tag names
      if (current.hasAttribute('data-synthesizer') || 
          current.localName === 'be-hive' ||
          (current as any).__isSynthesizer === true) {
        return current;
      }
    }
    
    // Try parent element
    if (current.parentElement) {
      current = current.parentElement;
    }
    // Try shadow root host
    else if (current instanceof ShadowRoot) {
      current = current.host;
    }
    // Try parent node (for document fragments)
    else if (current.parentNode) {
      current = current.parentNode;
    }
    else {
      break;
    }
  }
  
  return undefined;
}
```

## HTML Usage Examples

### Declarative Parser Loading

```html
<be-hive>
  <!-- Load parser first -->
  <script type="emc-parser" 
          src="nested-regex-groups/parser.js" 
          parser-name="nestedRegexGroups"></script>
  
  <!-- Then load enhancement that depends on it -->
  <script type="emc" 
          src="be-switched/emc.json" 
          wait-for-parsers="nestedRegexGroups"></script>
</be-hive>
```

### Multiple Parsers

```html
<be-hive>
  <script type="emc-parser" src="parser1.js" parser-name="parser1"></script>
  <script type="emc-parser" src="parser2.js" parser-name="parser2"></script>
  
  <!-- Wait for both parsers -->
  <script type="emc" 
          src="my-enhancement/emc.json" 
          wait-for-parsers="parser1 parser2"></script>
</be-hive>
```

### Custom Timeout

```html
<be-hive>
  <script type="emc-parser" src="slow-parser.js" parser-name="slowParser"></script>
  
  <!-- Wait up to 2 minutes -->
  <script type="emc" 
          src="my-enhancement/emc.json" 
          wait-for-parsers="slowParser"
          data-parser-timeout="120000"></script>
</be-hive>
```

### Programmatic Parser Registration

```html
<be-hive id="myHive">
  <script type="emc" 
          src="my-enhancement/emc.json" 
          wait-for-parsers="customParser"></script>
</be-hive>

<script type="module">
  import { registerParser } from 'assign-gingerly/parserRegistry.js';
  
  // Load parser programmatically
  const parser = await import('./custom-parser.js');
  const beHive = document.getElementById('myHive');
  
  registerParser(beHive, 'customParser', parser.default);
</script>
```

## Synthesizer Pattern Integration

### How Syndication Works

The Synthesizer pattern syndicates (copies) EMC scripts from root document to shadow roots:

**Root Document:**
```html
<be-hive>
  <script type="emc-parser" src="parser.js" parser-name="myParser"></script>
  <script type="emc" src="enhancement/emc.json" wait-for-parsers="myParser"></script>
</be-hive>
```

**Shadow Root (subscribes to root):**
```html
<my-custom-element>
  #shadowRoot
    <be-hive>
      <!-- Scripts are syndicated (copied) here by Synthesizer -->
      <!-- Each shadow root's be-hive gets its own parser registry -->
    </be-hive>
</my-custom-element>
```

**Key Points:**
- When scripts are syndicated, they're physically copied into the shadow root's be-hive
- The EMCParserScript handler finds the shadow root's be-hive (not the root document's)
- Each shadow root's be-hive has its own scoped parser registry
- This provides proper isolation between shadow roots

## Error Handling

### Parser Loading Errors

**Scenario**: Parser module fails to load

**Behavior**:
- Log error: `Failed to load parser "{parserName}" from "{src}": {error message}`
- Set `data-parser-error="{error message}"` on script element
- Do not throw (fail gracefully)

**Example**:
```html
<script type="emc-parser" 
        src="broken-parser.js" 
        parser-name="broken"
        data-parser-error="Module not found"></script>
```

### Parser Waiting Timeout

**Scenario**: EMC script waits for parser that never loads

**Behavior**:
- Log error: `Timeout waiting for parsers: {missing parser names}. Check parser-name attributes and script order.`
- Set `data-emc-error="timeout waiting for parsers: {names}"` on script element
- Do not process enhancement

**Example**:
```html
<script type="emc" 
        src="my-enhancement/emc.json" 
        wait-for-parsers="missingParser"
        data-emc-error="Timeout waiting for parsers: missingParser"></script>
```

### Invalid Parser Module

**Scenario**: Parser module doesn't export a function

**Behavior**:
- Throw error: `Parser module "{src}" must export a function as default export. Received: {typeof module.default}`
- Set `data-parser-error` on script element

## Testing Requirements

### Integration Tests

1. **Declarative Parser Loading**:
   - Load parser via emc-parser script
   - Verify parser registered in synthesizer element's scoped registry
   - Use parser in enhancement
   - Verify enhancement processes correctly

2. **Parser Waiting**:
   - EMC script with wait-for-parsers attribute
   - Parser loads after EMC script
   - Verify EMC script waits for parser
   - Verify enhancement processes after parser loads

3. **Parser Waiting Timeout**:
   - EMC script waits for non-existent parser
   - Verify timeout occurs
   - Verify error logged and data-emc-error set
   - Verify enhancement not processed

4. **Multiple Parsers**:
   - Load multiple parsers
   - EMC script waits for all parsers
   - Verify all parsers must be ready before processing

5. **Shadow Root Syndication**:
   - Parser script in root document's be-hive
   - EMC script syndicated to shadow root's be-hive
   - Verify parser accessible in shadow root
   - Verify each shadow root has isolated registry

6. **Programmatic Registration**:
   - Register parser via registerParser()
   - EMC script waits for programmatically registered parser
   - Verify waiting resolves correctly

## Implementation Checklist

- [ ] Create `EMCParserScriptHandler.ts` with full implementation
- [ ] Add `findContainingSynthesizer()` helper method
- [ ] Modify `EMCScript` handler to check `wait-for-parsers` attribute
- [ ] Modify `EMCScript` handler to find and store synthesizer element
- [ ] Implement parser waiting logic with timeout
- [ ] Add error handling and data attributes
- [ ] Register `EMCParserScriptHandler` with MountObserver
- [ ] Write integration tests for all scenarios
- [ ] Update README with emc-parser documentation
- [ ] Create examples demonstrating parser loading patterns

## Related Files

- **Main Design**: `.kiro/specs/scoped-parser-registry/design.md` (workspace root)
- **Requirements**: `.kiro/specs/scoped-parser-registry/requirements.md` (workspace root)
- **assign-gingerly Design**: `assign-gingerly/.kiro/specs/scoped-parser-registry-design.md`
