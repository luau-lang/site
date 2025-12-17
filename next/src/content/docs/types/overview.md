---
slug: types
title: An introduction to Luau types
sidebar:
  order: 1
---

Luau supports a gradual type system through the use of type annotations and type inference.

## Type inference modes

Luau offers three different modes that control how strictly it checks your types. You can set the mode by adding one of the following to the top of your file:

* `--!nocheck`,
* `--!nonstrict` (default), and
* `--!strict`

`nocheck` mode will simply not start the type inference engine whatsoever.

As for the other two, they are largely similar but with one important difference: in nonstrict mode, we infer `any` for most of the types if we couldn't figure it out early enough. This means that given this snippet:

```lua
local foo = 1
```

We can infer `foo` to be of type `number`, whereas the `foo` in the snippet below is inferred `any`:

```lua
local foo
foo = 1
```

However, given the second snippet in strict mode, the type checker would be able to infer `number` for `foo`.

## Structural type system

Luau's type system is structural by default, which is to say that we inspect the shape of two tables to see if they are similar enough. This was the obvious choice because Lua 5.1 is inherently structural.

```lua
type A = {x: number, y: number, z: number?}
type B = {x: number, y: number, z: number}

local a1: A = {x = 1, y = 2}        -- ok
local b1: B = {x = 1, y = 2, z = 3} -- ok

local a2: A = b1 -- ok
local b2: B = a1 -- not ok
```

## Type casts

Expressions may be typecast using `::`.  Typecasting is useful for specifying the type of an expression when the automatically inferred type is too generic.

For example, consider the following table constructor where the intent is to store a table of names:
```lua
local myTable = {names = {}}
table.insert(myTable.names, 42)         -- Inserting a number ought to cause a type error, but doesn't
```

In order to specify the type of the `names` table a typecast may be used: 

```lua
local myTable = {names = {} :: {string}}
table.insert(myTable.names, 42)         -- not ok, invalid 'number' to 'string' conversion
```

A typecast itself is also type checked to ensure that one of the conversion operands is the subtype of the other or `any`:
```lua
local numericValue = 1
local value = numericValue :: any             -- ok, all expressions may be cast to 'any'
local flag = numericValue :: boolean          -- not ok, invalid 'number' to 'boolean' conversion
```

When typecasting a variadic or the result of a function with multiple returns, only the first value will be preserved. The rest will be discarded.
```luau
function returnsMultiple(...): (number, number, number)
    print(... :: string) -- "x"
    return 1, 2, 3
end

print(returnsMultiple("x", "y", "z")) -- 1, 2, 3
print(returnsMultiple("x", "y", "z") :: number) -- 1
```
