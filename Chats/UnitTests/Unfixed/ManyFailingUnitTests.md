# Many Failing Unit Tests

## Bruce's Ask

Let's start with this console error I'm seeing quite a bit:

BROWSER: [JavaScript Error: "Loading module from “http://localhost:8000/node_modules/assign-gingerly/waitForSettled.js” was blocked because of a disallowed MIME type (“text/plain”)." {file: "http://localhost:8000/tests/test-mose-multiple-configs.html" line: 0}]

That module has moved to assign-gingerly/utils/waitForSettled.js

Can you update all the paths to this module?

Also:

Synthesizer.ts:2:30 - error TS2307: Cannot find module 'assign-gingerly/waitForEvent.js' or its corresponding type declarations.

2 import { waitForEvent } from 'assign-gingerly/waitForEvent.js';