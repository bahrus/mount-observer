# Inversion of dependency

The synthesizer functionality works by syndicating enhancements down through shadow DOM.  But it requires a root level element to manage the flow.  So the markup looks like:

```html
<be-hive>
    <script type=emc-parser 
            src="be-hive/parsers/parse-grouped-capture-statements.js" 
            parser-name=parse-grouped-capture-statements></script>
    <script type=emc 
            src="be-bound/🪢.json" 
            wait-for-parsers=parse-grouped-capture-statements></script>
</be-hive>
<input id=alternativeRating type=number>
<form 🪢='between ?.rating?.value@change and #alternativeRating.'>
    <div part=rating-stars class="rating__stars">
        <input id="rating-1" class="rating__input rating__input-1" type="radio" name="rating" value="1">
        <input id="rating-2" class="rating__input rating__input-2" type="radio" name="rating" value="2">
        <input id="rating-3" class="rating__input rating__input-3" type="radio" name="rating" value="3">
        <input id="rating-4" class="rating__input rating__input-4" type="radio" name="rating" value="4">
        <input id="rating-5" class="rating__input rating__input-5" type="radio" name="rating" value="5">
    </div>  
</form>
```

So here's the problem.  What if a web component has a dependency on one or more such enhancements.  How can it carefully "bootstrap" itself by pushing the be-hive element up, if needed?

For example:

Suppose we import a web component via a url, which streams in HTML.  The HTML looks like this:

```html
<html>
    <head>
        ...
    </head>
<!-- Streamed in --->
<scratch-box>
    <template shadowrootmode=open>
        <style adopt>
        </style>
        <form itemscope class="checkbox-wrapper">
            <!--  length of the path is 270px -->
            <input 🪢 name=${value} type="checkbox" id="option"/>

        </form>
        <be-hive>
            <template data-dest="rootSyn">
                <script type=emc-parser 
                        src="be-hive/parsers/parse-grouped-capture-statements.js" 
                        parser-name=parse-grouped-capture-statements></script>
                <script type=emc 
                        src="be-bound/🪢.json" 
                        wait-for-parsers=parse-grouped-capture-statements></script>
            </template>
            <template data-dest="head">
                <link rel=stylesheet href="https://fonts.googleapis.com/css?family=Indie+Flower">
            </template>
        </be-hive>

    </template>
</scratch-box>
```

What this does:

1.  The Synthesizer custom element looks for all templates with attribute data-dest.  It removes them from the children of be-hive, but hold on to them in memory for what happens below (note:  there is a chance that it won't find them all at first because the HTML is streamed in -- how to deal with that?)
2.  If data-dest=rootSyn, it:
    1.  Searches for element at document root matching the name of the parent.  If not found, creates one.
    2.  For each element inside the template, searches for a matching script in the root synthesizer element, based on matching attributes.  If non founds, inserts it.
3.  If data-dest=head
    1.  For each child inside the template, searches the head element for an element matching the attributes and tag name.
    2.  If not found, inserts the element.
