# Use assignFrom for assignOnMount

---

## Human Ask

It would be usesful for assignOnMount to use the more powerful assignFrom rather than assignGingerly, as then some dynamic properties can be set from the mount observer context, or even from other sources with the help of protocol support that assignFrom supports.

By far the biggest question becomes what to pass into the options for the "from" parameter.



