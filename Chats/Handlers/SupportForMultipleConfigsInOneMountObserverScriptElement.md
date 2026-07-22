# Support for multiple configs in one mount config

This should be supported:

```html
<script type="mountobserver">[
{ "do": "builtIns.hoistTemplate"},
{ "do": "builtIns.HTMLInclude"}
]</script>
```

---

## Immplementatino Notes

Yes, it was implemented. The `MountObserverScriptHandler` checks for `Array.isArray(config)` and iterates through each config, calling `scriptElement.mount(singleConfig)` for each one. So `[{ "do": "builtIns.hoistTemplate"}, { "do": "builtIns.HTMLInclude"}]` inside a single `<script type="mountobserver">` works correctly.