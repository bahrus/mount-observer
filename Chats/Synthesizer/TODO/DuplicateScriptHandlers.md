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

