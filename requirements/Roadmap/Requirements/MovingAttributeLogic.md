# Moving Attribute Logic to a lower level

I created this folder containing three separate git repos / npm packages, because this requirement is designed to see if we can move more logic to the lower level.

At its lowest level is the assign-gingerly project.  It allows class extensions to built-in elements to be spawned "programmatically" on demand.

At the next level is the mount-observer project, which references assign-gingerly.  It is designed to allow for more declarative, "passive" logic to take hold, so that the spawning of classes can be done based on the presence of attributes or other matching, declarative characteristics of the DOM elements.

mount-observer-script-element builds on top of mount-observer.

My intention is to make interface MountInit in mount-observer soon extend interface IBaseRegistryItem from assign-gingerly.

The main thing that MountInit doesn't yet support that IBaseRegistryItem supports is the "spawn" class constructor option.  Right now, it only supports the "do" function (and declarative handlers).  But it is coming.  

Before doing that, however, I feel like I need to figure out a way to start migrating some of the attribute logic from mount-observer/attrCoordinates.ts to assignGingerly.

I'm thinking what I would like to see happen is that when assign-gingerly's object-extension.ts, in particular ElementEnhancementContainer spawns a new class instance, and in the case of an enhKey being specified, passes in whatever values are there already on oElement.enh.myEnhancement, that gets passed in as part of the initVals, I would like to **also** read the initial values of the observed attributes specified currently in whereAttr?: WhereAttr and map?: MapConfig of mountInit.  But moving whereAttr?: WhereAttr into the assign-gingerly's IBaseRegistryItem seems to be problematic, because the terminology "WhereAttr" makes much more sense in the context of dynamically, declaratively "mounting" based on css matching, rather than programmatically attaching.  Still, in my personal use cases of attributes, I generally only want to read the initial attribute values of an element based on the HTML being server rendered, and not really focus on watching attribute changes after that, preferring to update the spawned class directly via assign gingerly.  But this is part of a standards proposal, and I know other developers prefer the ability to monitor for attribute changes similar to how custom elements work.  So I would like assign-gingerly to have logic that can interpret mapped attributes, parse the initial values and apply that data to the "initVals" passed into the spawned class.  Then mount observer continues to apply mutation observing for attribute changes **after** the initial handshake of the assign-gingerly code.  But the attribute mapping and as much logic as possible is shared, which means moving more logic into assign-gingerly, based on the dependency chain between packages.

The ultimate goal is to provide a more complete coherent, encompassing way of breaking down [this proposal](https://github.com/WICG/webcomponents/issues/1000) into useful primitives.

Could you please suggest and write  some baby steps requirement1.md, requirement2.md, etc files that outlines how we can move forward in the direction outlined above?  Let's not implement anything yet.

This is likely to be an iterative process.  Don't implement anything yet, let's focus on creating a roadmap of steps to take.