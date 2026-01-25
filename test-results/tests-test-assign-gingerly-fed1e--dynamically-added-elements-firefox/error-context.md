# Page snapshot

```yaml
- generic [ref=e1]:
  - heading "AssignGingerly Test" [level=1] [ref=e2]
  - generic [ref=e3]:
    - textbox "This is a test" [disabled] [ref=e4]:
      - /placeholder: Existing input
      - text: Test value
    - textbox "This is a test" [disabled] [ref=e5]:
      - /placeholder: Dynamic input 1
      - text: Test value
    - textbox "This is a test" [disabled] [ref=e6]:
      - /placeholder: Dynamic input 2
      - text: Test value
    - textbox "This is a test" [disabled] [ref=e7]:
      - /placeholder: Dynamic input 3
      - text: Test value
  - button "Add Input" [active] [ref=e8]
  - generic [ref=e9]:
    - paragraph [ref=e10]: Observer started
    - paragraph [ref=e11]: "Added input: dynamic-input-1"
    - paragraph [ref=e12]: "Added input: dynamic-input-2"
    - paragraph [ref=e13]: "Added input: dynamic-input-3"
```