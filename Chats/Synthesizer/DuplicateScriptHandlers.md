# Duplicate Script Handlers

I am testing one of the first instances of using the [Synthesizer](/mount-observer/Synthesizer.ts) code.

The example is [Demo 1](/demo/Demo1.html).

In the interest of transparency, I should mention that I implement [a recent tweak](/mount-observer/Chats/Synthesizer/InversionOfDependencies.md#human-response-iii), which could explain possibly some of this (not sure).

The issues I'm seeing aren't a disaster, but a bit of a nuisance:

Console.log's show:

```
ScopedParserRegistry.js:16 Parser "parse-grouped-capture-statements" already registered in scoped registry, overwriting
register @ ScopedParserRegistry.js:16
mount @ EMCParserScript.js:61
await in mount
EvtRt @ EvtRt.js:12
EMCParserScriptHandler @ EMCParserScript.js:14
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
(anonymous) @ imp-h.js:100
await in (anonymous)
(anonymous) @ imp-h.js:55
[NEW] Explain Console errors by using Copilot in Edge: click  to explain an error. Learn moreDon't show again
ScopedParserRegistry.js:16 Parser "parse-grouped-capture-statements" already registered in scoped registry, overwriting
register @ ScopedParserRegistry.js:16
mount @ EMCParserScript.js:61
await in mount
EvtRt @ EvtRt.js:12
EMCParserScriptHandler @ EMCParserScript.js:14
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
append @ TemplateMaker.js:83
connectedCallback @ TemplateMaker.js:56
value @ assignFeatures.js:277
defineWithFeatures @ defineWithFeatures.js:62
await in defineWithFeatures
mount @ CedeScript.js:96
await in mount
EvtRt @ EvtRt.js:12
CedeScriptHandler @ CedeScript.js:37
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
(anonymous) @ be-hive.js:4
ScopedParserRegistry.js:16 Parser "parse-grouped-capture-statements" already registered in scoped registry, overwriting
register @ ScopedParserRegistry.js:16
mount @ EMCParserScript.js:61
await in mount
EvtRt @ EvtRt.js:12
EMCParserScriptHandler @ EMCParserScript.js:14
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
append @ TemplateMaker.js:83
connectedCallback @ TemplateMaker.js:56
value @ assignFeatures.js:277
defineWithFeatures @ defineWithFeatures.js:62
await in defineWithFeatures
mount @ CedeScript.js:96
await in mount
EvtRt @ EvtRt.js:12
CedeScriptHandler @ CedeScript.js:37
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
(anonymous) @ be-hive.js:4
ScopedParserRegistry.js:16 Parser "parse-pattern-statements" already registered in scoped registry, overwriting
register @ ScopedParserRegistry.js:16
mount @ EMCParserScript.js:61
await in mount
EvtRt @ EvtRt.js:12
EMCParserScriptHandler @ EMCParserScript.js:14
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
append @ TemplateMaker.js:83
connectedCallback @ TemplateMaker.js:56
value @ assignFeatures.js:277
defineWithFeatures @ defineWithFeatures.js:62
await in defineWithFeatures
mount @ CedeScript.js:96
await in mount
EvtRt @ EvtRt.js:12
CedeScriptHandler @ CedeScript.js:37
#handleMatch @ MountObserver.js:585
(anonymous) @ MountObserver.js:434
#processNode @ MountObserver.js:428
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:100
await in #activateHandlers
connectedCallback @ Synthesizer.js:71
(anonymous) @ be-hive.js:4
```

And if I inspect what ends up inside one of the be-hive elements, I see lots of duplicates:

```html
<scratch-box enh-soak-up="
        name, checked as value 
        from #gid-1
    " imp-h="scratch-box/root.html" data-imp-h="a-bb0b25cb-7d66-469b-8ea7-45d8deb54e68">


        
    <span slot="labelTxt" soak-up="
        textContent, itemprop 
        from #gid-0
    ">Create demo</span>
    <script type="cede" data-extends="el-maker" src="scratch-box/features.json"></script>
    #shadow-root
        ...
        <be-hive hidden="">
            
            
            <!-- <template data-dest="head">
                <link rel=stylesheet href="https://fonts.googleapis.com/css?family=Indie+Flower">
            </template> -->
        <script type="emc-parser" src="be-hive/parsers/parse-pattern-statements.js" parser-name="parse-pattern-statements"></script><script type="emc-parser" src="be-hive/parsers/parse-grouped-capture-statements.js" parser-name="parse-grouped-capture-statements"></script><script type="emc-parser" src="be-hive/parsers/parse-grouped-capture-statements.js" parser-name="parse-grouped-capture-statements"></script><script type="emc" src="be-gone/emc.json" id="be-hive.BeGone"></script><script type="emc" src="soak-up/emc.json" wait-for-parsers="parse-pattern-statements" id="be-hive.soakUp"></script><script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script><script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script></be-hive>

</scratch-box>
```

Feel free to (temporarily) add console messages to any ts/js files, and I can refresh the browser and report the results. Note that mount-observer is a typescript project and I have background compiling in place.

---

## KIMI Findings and Fixes:

I traced the duplicate handler issue to `mount-observer/Synthesizer.ts` and applied a fix.

**Root cause**

In `#initializeSubscriber()` a subscriber first moves its local scripts up to the root `<be-hive>` syndicator, then processes all scripts already in the syndicator, and finally adds a listener for `AddedScriptElementEvent`.

Because `appendChild` to the syndicator is synchronous but the syndicator’s `MutationObserver` callback runs as a microtask after the synchronous subscriber setup finishes, the same moved script is seen twice:

1. once from the initial `syndicator.querySelectorAll(...)` loop that clones it back into the subscriber, and
2. once from the `AddedScriptElementEvent` that fires immediately afterward, which clones it again.

That is why the inspected `<be-hive>` contained two copies of `parse-grouped-capture-statements` and two copies of `be-bound/🪢.json`, and why `EMCParserScript` warned about registering the same parser twice.

**Fix**

Two changes in `mount-observer/Synthesizer.ts`:

1. Added `#alreadyHasEquivalentScript()` and a guard in `#processScript()` that skips cloning a script if the subscriber already has a script with the same `type` and `src`. This prevents both the initial-query/event-broadcast double-clone and duplicates when a reconnect tries to re-clone.
2. Added an `#isSubscriberInitialized` guard in `#initializeSubscriber()` so a reconnecting subscriber does not re-add event listeners or re-run the move-and-clone routine.

The background compiler has already updated `mount-observer/Synthesizer.js` to match.

**Caveat**

The deduplication key is `type + src`, which matches the existing move-to-syndicator logic. If you ever put two scripts of the same `type` and `src` but different `parser-name` or `id` in the same synthesizer, only one will be kept. That should be rare in this setup.

Next step is to refresh the browser in Demo 1 and confirm the duplicate scripts and the `already registered` warnings disappear.

---

## Human Response I

Looking much better.  No more console warnings, no degradation of functionality and much fewer duplicates in be-hive:

```html
<be-hive hidden="">
            
            
            <!-- <template data-dest="head">
                <link rel=stylesheet href="https://fonts.googleapis.com/css?family=Indie+Flower">
            </template> -->
        <script type="emc-parser" src="be-hive/parsers/parse-pattern-statements.js" parser-name="parse-pattern-statements"></script><script type="emc-parser" src="be-hive/parsers/parse-grouped-capture-statements.js" parser-name="parse-grouped-capture-statements"></script><script type="emc" src="be-gone/emc.json" id="be-hive.BeGone"></script><script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script><script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script><script type="emc" src="soak-up/emc.json" wait-for-parsers="parse-pattern-statements" id="be-hive.soakUp"></script></be-hive>
```

I am however still seeing two entries of:

```HTML
<script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script>
<script type="emc" src="be-bound/🪢.json" wait-for-parsers="parse-grouped-capture-statements" id="be-hive.🪢"></script>
```

Any idea why?

## KIMI Response I

Yes — the remaining duplicate is a **race in `#processScript()`**.

`#processScript` is `async` because it waits for the script's `export` property. The synchronous DOM deduplication guard (`#alreadyHasEquivalentScript`) runs before the async wait, so two overlapping calls for the same `be-bound/🪢.json` script can both observe an empty subscriber, both await the export, and then both append a clone. The initial `querySelectorAll` loop and the subsequent `AddedScriptElementEvent` broadcast from the local-script move are exactly the two overlapping calls.

**Additional fix**

Added an in-flight set to `Synthesizer.ts`:

- New private field `#inFlightScripts = new Set<string>()`.
- New helper `#scriptKey()` returns `"${type}|${src}"` for src-bearing scripts.
- In `#processScript()`:
  1. DOM-based equivalent check (existing).
  2. In-flight check: if the same key is already being processed, return immediately.
  3. Add the key, run the async export/clone/append logic, and remove the key in a `finally` block.

This prevents concurrent calls for the same script from both appending clones, while still allowing different scripts to be processed in parallel.

The background compiler has already updated `mount-observer/Synthesizer.js`.

Please refresh Demo 1 again and check whether the second `be-bound/🪢.json` clone is gone.
