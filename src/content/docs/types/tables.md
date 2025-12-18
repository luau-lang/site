---
slug: types/tables
title: Table Types
sidebar:
  order: 3
---

From the type checker perspective, each table can be in one of three states. They are: `unsealed table`, `sealed table`, and `generic table`. This is intended to represent how the table's type is allowed to change.

### Unsealed tables

An unsealed table is a table which supports adding new properties, which updates the tables type. Unsealed tables are created using table literals. This is one way to accumulate knowledge of the shape of this table.

```lua
local t = {x = 1} -- {x: number}
t.y = 2           -- {x: number, y: number}
t.z = 3           -- {x: number, y: number, z: number}
```

However, if this local were written as `local t: { x: number } = { x = 1 }`, it ends up sealing the table, so the two assignments henceforth will not be ok.

Furthermore, once we exit the scope where this unsealed table was created in, we seal it.

```lua
local function vec2(x, y)
    local t = {}
    t.x = x
    t.y = y
    return t
end

local v2 = vec2(1, 2)
v2.z = 3 -- not ok
```

Unsealed tables are *exact* in that any property of the table must be named by the type. Since Luau treats missing properties as having value `nil`, this means that we can treat an unsealed table which does not mention a property as if it mentioned the property, as long as that property is optional.

```lua
local t = {x = 1}
local u : { x : number, y : number? } = t -- ok because y is optional
local v : { x : number, z : number } = t  -- not ok because z is not optional
```

### Sealed tables

A sealed table is a table that is now locked down. This occurs when the table type is spelled out explicitly via a type annotation, or if it is returned from a function.

```lua
local t : { x: number } = {x = 1}
t.y = 2 -- not ok
```

Sealed tables are *inexact* in that the table may have properties which are not mentioned in the type.
As a result, sealed tables support *width subtyping*, which allows a table with more properties to be used as a table with fewer properties.

```lua
type Point1D = { x : number }
type Point2D = { x : number, y : number }
local p : Point2D = { x = 5, y = 37 }
local q : Point1D = p -- ok because Point2D has more properties than Point1D
```

### Generic tables

This typically occurs when the symbol does not have any annotated types or were not inferred anything concrete. In this case, when you index on a parameter, you're requesting that there is a table with a matching interface.

```lua
local function f(t)
    return t.x + t.y
           --^   --^ {x: _, y: _}
end

f({x = 1, y = 2})        -- ok
f({x = 1, y = 2, z = 3}) -- ok
f({x = 1})               -- not ok
```

## Table indexers

These are particularly useful for when your table is used similarly to an array.

```lua
local t = {"Hello", "world!"} -- {[number]: string}
print(table.concat(t, ", "))
```

Luau supports a concise declaration for array-like tables, `{T}` (for example, `{string}` is equivalent to `{[number]: string}`); the more explicit definition of an indexer is still useful when the key isn't a number, or when the table has other fields like `{ [number]: string, n: number }`.
