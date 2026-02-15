# Tentative assignment

mountObserver currently supports assignOnMount and assignOnDismount, which uses assignGingerly.

With the latest package update of the assign-gingerly npm package, there is another function, assignTentatively, which has the ability to be reverse.

So for this, I don't think it makes sense to have both onMount and onDismount, as the intention is that the equivalent onDismount will simply reverse whatever change was made during the onMount.

So I would like to implement this feature.  The question is what to call this alternative assignment?

I.e. assignOnMount => assignGingerlyOnMount.  ??? => assignTentativelyOnMount.