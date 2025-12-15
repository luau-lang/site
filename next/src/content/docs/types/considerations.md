---
slug: types/considerations
title: Additional Considerations
sidebar:
  order: 10
---

## Module interactions

Let's say that we have two modules, `Foo` and `Bar`. Luau will try to resolve the paths if it can find any `require` in any scripts. In this case, when you say `script.Parent.Bar`, Luau will resolve it as: relative to this script, go to my parent and get that script named Bar.

```lua
-- Module Foo
local Bar = require(script.Parent.Bar)

local baz1: Bar.Baz = 1     -- not ok
local baz2: Bar.Baz = "foo" -- ok

print(Bar.Quux)         -- ok
print(Bar.FakeProperty) -- not ok

Bar.NewProperty = true -- not ok
```

```lua
-- Module Bar
export type Baz = string

local module = {}

module.Quux = "Hello, world!"

return module
```

There are some caveats here though. For instance, the require path must be resolvable statically, otherwise Luau cannot accurately type check it.

### Cyclic module dependencies

Cyclic module dependencies can cause problems for the type checker.  In order to break a module dependency cycle a typecast of the module to `any` may be used:
```lua
local myModule = require(MyModule) :: any
```
