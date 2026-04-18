# Problems with the Design

The design states:

> The Synthesizer element is determined by traversing up the DOM tree (including shadow root boundaries) from the enhanced element to find the nearest ancestor element that extends Synthesizer (be-hive, or any other framework container).

Here's the problem.  The way the HTML markup from the developer point of view will look like is as follows:

Outside ShadowDOM

```html
<html>
<body>
    <div>
        <input id=lhs>
        <input id=rhs>
        <template be-switched='on when #lhs eq #rhs'>
            <div>lhs === rhs
        </template>
    </div>
    ...
    <!-- syndicating be-hive container -->
    <be-hive>
        <script type=emc src=be-switched/emc.json></script>
    </be-hive>
</body>
```

Inside a shadow root:

```html
<my-custom-element>
    #shadowRoot
            <div>
        <input id=lhs>
        <input id=rhs>
        <template be-switched='on when #lhs eq #rhs'>
            <div>lhs === rhs
        </template>
    </div>
    ...
    <!-- subscribing be-hive container pulls in the emc script elements from outside any shadowDOM, i.e. the root document -->
    <be-hive> </be-hive>
</my-custom-element>
```