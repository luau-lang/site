---
slug: types/basic-types
title: Primitives and Simple Types
sidebar:
  order: 2
---

## Builtin types

The Luau VM supports 10 primitive types: 

1. `nil`
2. `string`
3. `number`
4. `boolean`
5. `table`
6. `function`
7. `thread`
8. `userdata`
9. `vector`
10. `buffer`

Most of these can be specified by their name and written directly in type annotations:

```luau
local message: string = "Hello"
local count: number = 42
local isReady: boolean = true
local co: thread = coroutine.running()
```

Some types have special syntax: 
* `table` and `function` are not represented by name, but have their dedicated syntax as covered in this [syntax document](../../syntax)
* `userdata` is represented by [concrete types](../roblox-types), and
* `vector` is not representable by name at all

The type checker also provides the builtin types [`unknown`](#unknown-type), [`never`](#never-type), and [`any`](#any-type).

```luau
local s = "foo"
local n = 1
local b = true
local t = coroutine.running()

local a: any = 1
print(a.x) -- Type checker believes this to be ok, but crashes at runtime.
```

#### Special behavior with `nil`

There's a special case where we intentionally avoid inferring `nil` for local variables. This allows you to declare variables first and assign values to them later — if we inferred `nil`, you wouldn't be able to assign other types to these variables.

```luau
local a
local b = nil
```

### `unknown` type

`unknown` is also said to be the _top_ type, that is it's a union of all types.

```luau
local a: unknown = "hello world!"
local b: unknown = 5
local c: unknown = function() return 5 end
```

Unlike `any`, `unknown` will not allow itself to be used as a different type!

```luau
local function unknown(): unknown
    return if math.random() > 0.5 then "hello world!" else 5
end

local a: string = unknown() -- not ok
local b: number = unknown() -- not ok
local c: string | number = unknown() -- not ok
```

In order to turn a variable of type `unknown` into a different type, you must apply [type refinements](../types/refinements.md) on that variable.

```luau
local function unknown(): unknown return 5 end
local x = unknown()
if typeof(x) == "number" then
    print(x) -- x : number
end
```

### `never` type

`never` is also said to be the _bottom_ type, meaning there doesn't exist a value that inhabits the type `never`. In fact, it is the _dual_ of `unknown`. `never` is useful in many scenarios, and one such use case is when type refinements proves it impossible:

```luau
local function unknown(): unknown return 5 end
local x = unknown()
if typeof(x) == "number" and typeof(x) == "string" then
    print(x) -- x : never
end
```

### `any` type

`any` is just like `unknown`, except that it allows itself to be used as an arbitrary type without further checks or annotations. Essentially, it's an opt-out from the type system entirely.

```luau
local x: any = 5
local y: string = x -- no type errors here!
```

## Function types

Let's start with something simple.

```luau
local function f(x) return x end

local a: number = f(1)     -- ok
local b: string = f("foo") -- ok
local c: string = f(true)  -- not ok
```

In strict mode, the inferred type of this function `f` is `<A>(A) -> A` (take a look at [generics](../generics)), whereas in nonstrict we infer `(any) -> any`. We know this is true because `f` can take anything and then return that. If we used `x` with another concrete type, then we would end up inferring that.

Similarly, we can infer the types of the parameters with ease. By passing a parameter into *anything* that also has a type, we are saying "this and that has the same type."

```luau
local function greetingsHelper(name: string)
    return "Hello, " .. name
end

local function greetings(name)
    return greetingsHelper(name)
end

print(greetings("Alexander"))          -- ok
print(greetings({name = "Alexander"})) -- not ok
```

## Variadic types

Luau permits assigning a type to the `...` variadic symbol like any other parameter:

```luau
local function f(...: number)
end

f(1, 2, 3)     -- ok
f(1, "string") -- not ok
```

`f` accepts any number of `number` values.

In type annotations, this is written as `...T`:

```luau
type F = (...number) -> ...string
```

## Type packs

Multiple function return values as well as the function variadic parameter use a type pack to represent a list of types.

When a type alias is defined, generic type pack parameters can be used after the type parameters:

```luau
type Signal<T, U...> = { f: (T, U...) -> (), data: T }
```

> Keep in mind that `...T` is a variadic type pack (many elements of the same type `T`), while `U...` is a generic type pack that can contain zero or more types and they don't have to be the same.

It is also possible for a generic function to reference a generic type pack from the generics list:

```luau
type Signal<T, U...> = { f: (T, U...) -> (), data: T }

local function call<T, U...>(s: Signal<T, U...>, ...: U...)
    s.f(s.data, ...)
end
```

Generic types with type packs can be instantiated by providing a type pack:

```luau
type Signal<T, U...> = { f: (T, U...) -> (), data: T }
local function call<T, U...>(s: Signal<T, U...>, ...: U...) end

local signal: Signal<string, (number, number, boolean)> = {} :: any

call(signal, 1, 2, false)
```

There are also other ways to instantiate types with generic type pack parameters:

```luau
type A<T, U...> = (T) -> U...

type B = A<number, ...string> -- with a variadic type pack
type C<S...> = A<number, S...> -- with a generic type pack
type D = A<number, ()> -- with an empty type pack
```

Trailing type pack argument can also be provided without parentheses by specifying variadic type arguments:

```luau
type List<Head, Rest...> = (Head, Rest...) -> ()

type B = List<number> -- Rest... is ()
type C = List<number, string, boolean> -- Rest is (string, boolean)

type Returns<T...> = () -> T...

-- When there are no type parameters, the list can be left empty
type D = Returns<> -- T... is ()
```

Type pack parameters are not limited to a single one, as many as required can be specified:

```luau
type Callback<Args..., Rets...> = { f: (Args...) -> Rets... }

type A = Callback<(number, string), ...number>
```

## Singleton types (aka literal types)

Luau's type system also supports singleton types, which means it's a type that represents one single value at runtime. At this time, both string and booleans are representable in types.

> We do not currently support numbers as types. For now, this is intentional.

```luau
local foo: "Foo" = "Foo" -- ok
local bar: "Bar" = foo   -- not ok
local baz: string = foo  -- ok

local t: true = true -- ok
local f: false = false -- ok
```

This happens all the time, especially through [type refinements](../type-refinements) and is also incredibly useful when you want to enforce program invariants in the type system! See [tagged unions](../unions-and-intersections/#tagged-unions) for more information.
