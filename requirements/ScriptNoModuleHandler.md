# Script NoModule Built in Handler

Please define a built in handler that:

1.  Specifies it applies only to instances of HTMLScriptElement
2.  Has attribute nomodule
3.  Has a src attribute.
4.  Optionally, has a with-type attribute

What this does:

1.  Reads the value of the src attribute
2.  If with-type attribute is specified, does an import(srcAttr, {with: {type: withTypeAttr}});
3.  If not, just does an import(srcAttr);
4.  Stores the value at oScriptElement.export