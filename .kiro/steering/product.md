# Product Overview

mount-observer is a JavaScript/TypeScript library that provides a MountObserver API for observing and acting on CSS matches in the DOM. It enables lazy loading of custom elements, progressive enhancement, and "binding from a distance" patterns.

## Core Capabilities

- **Lazy Loading**: Automatically import and register custom elements when they appear in the DOM
- **CSS-Based Observation**: Monitor elements matching complex CSS selectors with lifecycle callbacks
- **Progressive Enhancement**: Attach behaviors and set properties on elements as they mount/dismount
- **Intersection & Media Queries**: Conditionally load resources based on viewport visibility and media conditions
- **Shadow DOM Support**: Works across shadow boundaries with inheritance patterns and [scoped custom element registries](https://developer.chrome.com/blog/scoped-registries)

## Key Use Cases

- Lazy loading custom element definitions only when needed
- Binding behaviors to elements matching CSS selectors without direct references
- Conditionally loading resources based on element visibility, media queries, or container queries
- Progressive enhancement of HTML as it streams in
- Managing element lifecycle (mount, dismount, disconnect, reconnect)

## Distribution

Published as an npm package with ES module exports. Provides both JavaScript and TypeScript definitions.
