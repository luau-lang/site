---
permalink: /typecheck/unions-and-intersections
title: Union and Intersection Types
toc: true
---

## Union types

A union type represents *one of* the types in this set. If you try to pass a union onto another thing that expects a *more specific* type, it will fail.

For example, what if this `string | number` was passed into something that expects `number`, but the passed in value was actually a `string`?

```lua
local stringOrNumber: string | number = "foo"

local onlyString: string = stringOrNumber -- not ok
local onlyNumber: number = stringOrNumber -- not ok
```

Note: it's impossible to be able to call a function if there are two or more function types in this union.

### Tagged unions

Tagged unions are just union types! In particular, they're union types of tables where they have at least _some_ common properties but the structure of the tables are different enough. Here's one example:

```lua
type Ok<T> = { type: "ok", value: T }
type Err<E> = { type: "err", error: E }
type Result<T, E> = Ok<T> | Err<E>
```

This `Result<T, E>` type can be discriminated by using type refinements on the property `type`, like so:

```lua
if result.type == "ok" then
    -- result is known to be Ok<T>
    -- and attempting to index for error here will fail
    print(result.value)
elseif result.type == "err" then
    -- result is known to be Err<E>
    -- and attempting to index for value here will fail
    print(result.error)
end
```

Which works out because `value: T` exists only when `type` is in actual fact `"ok"`, and `error: E` exists only when `type` is in actual fact `"err"`.


## Intersection types

An intersection type represents *all of* the types in this set. It's useful for two main things: to join multiple tables together, or to specify overloadable functions.

```lua
type XCoord = {x: number}
type YCoord = {y: number}
type ZCoord = {z: number}

type Vector2 = XCoord & YCoord
type Vector3 = XCoord & YCoord & ZCoord

local vec2: Vector2 = {x = 1, y = 2}        -- ok
local vec3: Vector3 = {x = 1, y = 2, z = 3} -- ok
```

```lua
type SimpleOverloadedFunction = ((string) -> number) & ((number) -> string)

local f: SimpleOverloadedFunction

local r1: number = f("foo") -- ok
local r2: number = f(12345) -- not ok
local r3: string = f("foo") -- not ok
local r4: string = f(12345) -- ok
```

Note: it's impossible to create an intersection type of some primitive types, e.g. `string & number`, or `string & boolean`, or other variations thereof.

Note: Luau still does not support user-defined overloaded functions. Some of Roblox and Lua 5.1 functions have different function signature, so inherently requires overloaded functions.
