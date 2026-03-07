# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - text: Testing MountObserver with builtIns.generateIds...
    - text: "ERROR: No handler defined for builtIns.generateIds"
    - text: "Stack: Error: No handler defined for builtIns.generateIds at #validateDoHandlers (http://localhost:8000/MountObserver.js:113:27) at new MountObserver (http://localhost:8000/MountObserver.js:94:37) at http://localhost:8000/tests/id-generation-integration.html:48:34 at http://localhost:8000/tests/id-generation-integration.html:111:11"
  - group [ref=e3]:
    - generic [ref=e4]:
      - text: "LHS:"
      - textbox "LHS:" [disabled] [ref=e5]
    - generic [ref=e6]:
      - text: "RHS:"
      - textbox [disabled] [ref=e7]
```