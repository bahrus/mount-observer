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