# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "AssignGingerly Test" [level=1] [ref=e2]
  - generic [ref=e3]:
    - textbox "This is a test" [disabled] [ref=e4]:
      - /placeholder: Existing input
      - text: Test value
    - textbox "This is a test" [disabled] [ref=e5]:
      - /placeholder: Dynamic input 1
      - text: Test value
  - button "Add Input" [ref=e6]
  - generic [ref=e7]:
    - paragraph [ref=e8]: Observer started
    - paragraph [ref=e9]: "Added input: dynamic-input-1"
```