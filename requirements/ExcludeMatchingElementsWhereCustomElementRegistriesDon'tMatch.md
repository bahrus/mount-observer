# Exclude Mounting Elements Where Custom Element Registry doesn't match.

I had a fundamental misunderstanding of how the new scoped registries work.

For starters, this requirement is that before mounting an element, add one more required AND condition -- the customElementRegistry of the possible candidate element must match  the customElementRegistry of the root element being observed (this.#rootNode).

