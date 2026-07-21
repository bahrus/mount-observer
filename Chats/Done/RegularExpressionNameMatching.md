# Regular Expression Name Matching

Please add another AND condition criteria to MountConfig:

```TypeScript
export interface MountConfig {
    ...
    whereLocalNameMatches?: string | RegExp
}
```

That looks at the local name of a potentially matching element to be mounted, and checks if the localName of the element passes the criteria of the regular expression.  If not, it doesn't mount.