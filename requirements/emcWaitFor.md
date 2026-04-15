# Wait for

---
Human says:

The assign-gingerly package, including the support for enhancements, is primarily synchronous, especially when it comes to parsing the withAttr configured attributes during initialization.

The assign-gingerly library supports some built in parsers for very common requirements (for example, JSON parsing of an attribute).  But what if the parser is not very universally needed and requires a significant number of lines of code?

One such example is the kiro-inspired / implemented [nested-regex-groups](https://github.com/bahrus/nested-regex-groups) parser to use for parsing the attributes for for an enhancement lirary like  [be-switched](https://github.com/bahrus/be-switched).

One requirement I had kiro implement, which kiro thought seemed a bit strange, in anticipation of this requirement, is support for [Custom Element Static Method Parsers](https://github.com/bahrus/assign-gingerly?tab=readme-ov-file#named-parsers-for-reusability-and-json-serialization).

This package contains the EMScript handler that is used in conjunction with the Synthesizer module in this package.  Please read the types/.kiro documentation to get a sense of how that is being used repeatedly:

In particular, from Step 11: Update Tests and Demo Files from types/ConversionInstructions:

```html
<be-hive>
    <script type=emc src="[project-name]/emc.json"></script>
</be-hive>
```

Maybe you have a better suggestion, but the best I can come up with is to define a custom element called nested-regex-groups that has a static method that parses nested grouped regular expressions, and to delay loading of the emc script via:

1.  Define a method in the BeHive custom element, "loadNestedRegexGroupParser", that awaits loading and defining the nested-regex-groups.
2.  Define another script handler, emc-when-ready:

```html
<be-hive>
    <script type=emc-when-ready src="be-switched/emc.json" wait-for=loadNestedRegexGroupParser></script>
</be-hive>
```

This would invoke the method from the containing be-hive custom element container (after awaiting when-defined('be-hive'), which would almost always be defined already due to the loading sequence, but just in case), and only then switch type=emc-when-ready to type=emc.

That's admittedly a lot of moving parts.  

First, do you understand what I'm proposing?
Does it seem implementable?
Do you have a better suggestion?

---

## Kiro's Comments

### Understanding the Proposal

Yes, I understand what you're proposing. Let me summarize to confirm:

**The Problem:**
- Some enhancements (like be-switched) need complex parsers (like nested-regex-groups) that are large and not universally needed
- These parsers need to be available before the enhancement initializes, but you don't want to load them for every enhancement
- The current EMC script processing is synchronous and doesn't have a way to wait for dependencies

**Your Proposed Solution:**
1. Create a custom element (e.g., `<nested-regex-groups>`) that has a static parser method
2. Add a method to BeHive (e.g., `loadNestedRegexGroupParser()`) that loads and defines this custom element
3. Create a new script type `emc-when-ready` with a `wait-for` attribute
4. The handler would:
   - Wait for `be-hive` to be defined
   - Call the method specified in `wait-for` on the be-hive element
   - Wait for that method to complete
   - Change the script type from `emc-when-ready` to `emc` to trigger normal processing

### Implementability

Yes, this is implementable. The pattern is similar to how the current EMCScript handler waits for the `resolved` event. Here's what would be needed:

1. **New Handler**: `EMCWhenReadyScript` handler that matches `script[type="emc-when-ready"]`
2. **Wait Logic**: 
   - `await customElements.whenDefined('be-hive')`
   - Find the nearest `<be-hive>` ancestor
   - Get the method name from `wait-for` attribute
   - Call the method and await its result
   - Change `type` attribute from `emc-when-ready` to `emc`
3. **BeHive Methods**: Add loader methods like `loadNestedRegexGroupParser()` to BeHive

### Alternative Suggestions

I have a few alternative approaches that might be simpler:

#### Alternative 1: Declarative Parser Loading

Instead of requiring methods on BeHive, use a more declarative approach:

```html
<be-hive>
    <!-- Load the parser first -->
    <script type=emc-parser src="nested-regex-groups/parser.js" parser-name="nestedRegexGroups"></script>
    
    <!-- Then load the enhancement that depends on it -->
    <script type=emc src="be-switched/emc.json" requires-parsers="nestedRegexGroups"></script>
</be-hive>
```

**How it works:**
- `emc-parser` scripts load and register parsers with assign-gingerly
- `emc` scripts with `requires-parsers` wait for those parsers to be registered
- No need for custom methods on BeHive
- More declarative and self-documenting

#### Alternative 2: Parser Registry with Promises

Create a global parser registry that tracks loading state:

```html
<be-hive>
    <script type=emc src="be-switched/emc.json" wait-for-parser="nestedRegexGroups"></script>
</be-hive>

<script type=module>
    // Somewhere in be-switched's initialization
    import { registerParser } from 'assign-gingerly/parserRegistry.js';
    
    const parser = await import('nested-regex-groups/parser.js');
    registerParser('nestedRegexGroups', parser.default);
</script>
```

**How it works:**
- EMCScript handler checks for `wait-for-parser` attribute
- If present, waits for that parser to be registered before processing
- Parser registration happens via normal module imports
- No special custom elements or BeHive methods needed

#### Alternative 3: Lazy Parser Loading in withAttrs

Extend the `withAttrs` configuration to support lazy parser loading:

```javascript
// In emc.mjs
export const emc = {
    enhConfig: {
        enhKey: 'BeSwitched',
        spawn: 'be-switched/be-switched.js',
        withAttrs: {
            base: 'be-switched',
            cases: {
                parser: async () => {
                    const { nestedRegexGroupsParser } = await import('nested-regex-groups/parser.js');
                    return nestedRegexGroupsParser;
                }
            }
        }
    }
}
```

**How it works:**
- Parser is specified as an async function in the configuration
- assign-gingerly loads the parser on-demand when parsing that attribute
- No changes to EMCScript handler needed
- Parser is only loaded when actually needed

### My Recommendation

I think **Alternative 1 (Declarative Parser Loading)** is the cleanest because:

1. **Self-documenting**: The HTML clearly shows dependencies
2. **No magic methods**: Doesn't require adding methods to BeHive for each parser
3. **Reusable**: Multiple enhancements can depend on the same parser
4. **Explicit ordering**: The document order makes the loading sequence clear
5. **Synthesizer-friendly**: Works well with the Synthesizer pattern for syndicating across shadow roots

However, your original proposal is also solid and might be preferable if:
- You want to keep parser loading logic in JavaScript rather than HTML
- You prefer method-based APIs over declarative attributes
- You want BeHive to be the central coordinator for all enhancement dependencies

### Questions for You

1. **Scope**: Should parsers be global (available to all enhancements) or scoped (only available within a be-hive instance)?
2. **Error handling**: What should happen if a parser fails to load? Should the enhancement fail gracefully or throw an error?
3. **Caching**: Should parsers be cached once loaded, or reloaded for each enhancement instance?

What do you think? Would you like me to implement your original proposal, or would you prefer to explore one of the alternatives?

## Human Responds I

Yes, you summarized my solution well, and I'm happy to see we are addressing the same concern(s).

I really like alternatives 1 and 2.  If I'm not mistaken, both approaches could be supported in a reinforcing way, rather than a conflicting way, depending on the scenario.  One is more declarative, the other a bit more programmatic.  I'm thinking we could name the attribute name the same, and not care how we got there, correct?

Alternative 1, modified

```html
<be-hive>
    <!-- Load the parser first -->
    <script type=emc-parser src="nested-regex-groups/parser.js" parser-name="nestedRegexGroups"></script>
    
    <!-- Then load the enhancement that depends on it -->
    <script type=emc src="be-switched/emc.json" wait-for-parsers="nestedRegexGroups"></script>
</be-hive>
```

```html
<be-hive>
    <script type=emc src="be-switched/emc.json" wait-for-parsers="nestedRegexGroups"></script>
</be-hive>

<script type=module>
    // Somewhere in be-switched's initialization
    import { registerParser } from 'assign-gingerly/parserRegistry.js';
    
    const parser = await import('nested-regex-groups/parser.js');
    registerParser('nestedRegexGroups', parser.default);
</script>
```

wait-for-parsers could be a space delimited list of parsers that the enhancement needs.

Your three questions are quite apt.  My thoughts on each of them:

### Should parsers be global?

This is a concern.  I am trying to have some influence on the standards, by providing what I think is the best possible solution.  A primary goal I have with my rather ignored standards proposal, is that I would like different enhancement libraries, like HTMX and Alpine and a similar Wordpress library to be able to work together, similar to how custom element libraries from different vendors / core libraries can work together.

So the intention of the synthesizer base class element is to provide a kind of "framework container" between different libraries, ensuring no conflicts.  So I would feel much better about this solution if the parsers:

```html
<be-hive>
    <!-- Load the parser first -->
    <script type=emc-parser src="nested-regex-groups/parser.js" parser-name="nestedRegexGroups"></script>
    
    <!-- Then load the enhancement that depends on it -->
    <script type=emc src="be-switched/emc.json" wait-for-parsers="nestedRegexGroups"></script>
</be-hive>
```

```html
<be-hive>
    <script type=emc src="be-switched/emc.json" wait-for-parsers="nestedRegexGroups"></script>
</be-hive>

<script type=module>
    // Somewhere in be-switched's initialization
    import { registerParser } from 'assign-gingerly/parserRegistry.js';
    
    const parser = await import('nested-regex-groups/parser.js');
    registerParser('nestedRegexGroups', parser.default);
</script>
```

only affects other enhancements registered within the be-hive tag, without trampling on other framework libraries.

2. **Error handling**: What should happen if a parser fails to load? Should the enhancement fail gracefully or throw an error?

I think it should show a helpful error and first do no harm (stop in its tracks).  We (I) should probably check that assign-gingerly already does this.

3. **Caching**:  Yes, this is a definite need.  I don't recall if assign-gingerly already has support for caching, but it is definitely something that needs to be supported.  However, my instinct is to focus on implementing the functionality, making sure some caching approaching is vaguely feasible, then only after the dust settles, clarifying exactly how caching would work.

What are your thoughts?





