---
inclusion: always
---

# MountObserver API Documentation

## MountInit Configuration

The `MountInit` object configures what elements the MountObserver should observe and act upon.

### Condition Logic

**AND Conditions**: All `where*` properties in the `MountInit` object form an AND condition. An element must satisfy ALL specified `where*` conditions to mount.

For example:
```javascript
{
    whereElementMatches: 'input, button',
    whereInstanceOf: HTMLInputElement
}
```
This will only match elements that are BOTH (`input` or `button`) AND instances of HTMLInputElement.
