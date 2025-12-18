---
slug: types
title: An introduction to Luau types
sidebar:
  order: 1
---

Luau supports a gradual type system through the use of type annotations and type inference. These types are used to provide warnings, errors, and suggestions for our developers. Type checking helps you find bugs early - while you're writing code - rather than discovering when your program crashes at runtime.

## Type inference modes

Luau offers three different modes that control how strictly it checks your types. You can set the mode by adding one of the following to the top of your file:

* `--!nocheck`,
* `--!nonstrict` (default), and
* `--!strict`

##### `--!nocheck`

`nocheck` mode completely disables the type inference engine for the file. 

With this mode enabled, we don't provide any feedback on the types, so scripts with errors (like following example that tries to add a `string` and a `number`) will not raise a typecheck error, even though the program errors when executed.

Try pressing the `Check` and `Run` buttons to try out this snippet:

```luau
--!nocheck
local foo = 1
local x = "hello " + foo -- No error, type checking is disabled
print(foo)
```

If, instead, you want to catch these kinds of errors before running your code, you can enable type checking with the `--!nonstrict` or `--!strict` modes. Both of these modes analyze your types and provide helpful feedback, but they differ slightly in how strictly they enforce type safety.

##### `--!nonstrict`

In `nonstrict` mode, the type checker is more forgiving: if we can't figure out what type something is early on, we infer the type could be anything (the `any` type) and let you proceed without errors.

This means that if we define a variable without initializing it or specifying its type:

```luau
--!nonstrict

local foo
foo = 1
foo = "hello " + foo -- Still no error, foo is 'any'
```

The type checker can't tell what type `foo` should be when it's first declared, so in `nonstrict` mode it infers `any` - allowing the addition to proceed without warnings, even though it will error at runtime.

##### `--!strict`

In `strict` mode, Luau is is smarter about tracking types across statements. Given the previous example now in `strict` mode:

```luau
--!strict

local foo
foo = 1
foo = "hello " + foo
```

We finally see an error! The type checker sees `foo = 1` on line 4 and infers that `foo` must be a `number`. Then, when you try to add `"hello "` and `foo`, `strict` mode catches our error of trying to add a `string` and a `number`, which isn't allowed. (tip: hover over the erroneous lines to see the error message!)

In `strict` mode, variables won't be inferred as `any` unless you explicitly annotate them that way. This means the type checker works harder to figure out what types your variables should be, catching more potential bugs before your code runs.

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
