# Syndicating Mount Observers with Synthesizer

This requirement is to resurrect the legacy/Synthesizer.ts abstract class, but hopefully better, and certainly in accordance with all the changes that have happened to this package.

I am unhappy with how "mountGlobally" works, and will probably create another requirement to retire that functionality.

Namely, the way that mountGlobally discovers elements that have ShadowDOM roots is problematic.  The Synthesizer will provide a fool proof for syndicating mount observers across shadow roots.

Let's focus for now squarely on syndicating to ShadowRoots, and leave the question of syndicating to other customElementRegistries to another requirement.

I can't decide whether this new version should be called "Synthesizer" or "Syndicator".  I'll stick with Synthesizer as far as this explanation.

What Synthesizer needs to do:

1.  Identify the root node.
2.  Ensure that one and only one instance of any custom element that extends Synthesizer does the following:

    1.  Attaches the following builtin to the shadowRoot/document:
        1. builtIns.mountObserverScript
        2. builtIns.scriptExport
        3. builtIns.HTMLInclude
        4. builtIns.hoistTemplate
        5. builtIns.emcScript

    2.  This is done via mount, not globalMount

