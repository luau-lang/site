---
slug: types/type-refinements
title: Type Refinements
sidebar:
  order: 6
---

When we check the type of any lvalue (a global, a local, or a property), what we're doing is we're refining the type, hence "type refinement." The support for this is arbitrarily complex, so go at it!

Here are all the ways you can refine:
1. Truthy test: `if x then` will refine `x` to be truthy.
2. Type guards: `if type(x) == "number" then` will refine `x` to be `number`.
3. Equality: `if x == "hello" then` will refine `x` to be a singleton type `"hello"`.

And they can be composed with many of `and`/`or`/`not`. `not`, just like `~=`, will flip the resulting refinements, that is `not x` will refine `x` to be falsy. 

The `assert(..)` function may also be used to refine types instead of `if/then`.

Using truthy test:
```luau
local maybeString: string? = nil

if maybeString then
    local onlyString: string = maybeString -- ok
    local onlyNil: nil = maybeString       -- not ok
end

if not maybeString then
    local onlyString: string = maybeString -- not ok
    local onlyNil: nil = maybeString       -- ok
end
```

Using `type` test:
```luau
local stringOrNumber: string | number = "foo"

if type(stringOrNumber) == "string" then
    local onlyString: string = stringOrNumber -- ok
    local onlyNumber: number = stringOrNumber -- not ok
end

if type(stringOrNumber) ~= "string" then
    local onlyString: string = stringOrNumber -- not ok
    local onlyNumber: number = stringOrNumber -- ok
end
```

Using equality test:
```luau
function f() return "meow" end
local myString: string = f()

if myString == "hello" then
    local hello: "hello" = myString -- ok because it is absolutely "hello"!
    local copy: string = myString   -- ok
end
```

And as said earlier, we can compose as many of `and`/`or`/`not` as we wish with these refinements:
```luau
local function f(x: any, y: any)
    if (x == "hello" or x == "bye") and type(y) == "string" then
        -- x is of type "hello" | "bye"
        -- y is of type string
    end

    if not (x ~= "hi") then
        -- x is of type "hi"
    end
end
```

`assert` can also be used to refine in all the same ways:
```luau
local stringOrNumber: string | number = "foo"

assert(type(stringOrNumber) == "string")

local onlyString: string = stringOrNumber -- ok
local onlyNumber: number = stringOrNumber -- not ok
```
