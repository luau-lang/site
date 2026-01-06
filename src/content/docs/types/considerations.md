---
slug: types/considerations
title: Additional Considerations
sidebar:
  order: 10
---

## Module interactions

Let's say that we have two modules, `Foo` and `Bar`. Luau will try to resolve the paths if it can find any `require` in any scripts. In this case, when you say `./bar`, Luau will resolve it as: relative to this script, go to my sibling script named Bar.

```luau
--!file foo.luau
local Bar = require("./bar")

local baz1: Bar.Baz = 1     -- not ok
local baz2: Bar.Baz = "foo" -- ok

print(Bar.Quux)         -- ok
print(Bar.FakeProperty) -- not ok

Bar.NewProperty = true -- not ok

--!file bar.luau
export type Baz = string

local module = {}

module.Quux = "Hello, world!"

return module
```

There are some caveats here though. For instance, the require path must be resolvable statically, otherwise Luau cannot accurately type check it.

### Cyclic module dependencies

Cyclic module dependencies can cause problems for the type checker.  In order to break a module dependency cycle a typecast of the module to `any` may be used:
```luau
--!hidden mode=nocheck
local myModule = require(MyModule) :: any
```
