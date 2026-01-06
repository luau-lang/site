---
slug: types/generics
title: Generics and Polymorphism
sidebar:
  order: 5
---

The type inference engine was built from the ground up to recognize generics. A generic is simply a type parameter in which another type could be slotted in. It's extremely useful because it allows the type inference engine to remember what the type actually is, unlike `any`.

```luau
type Pair<T> = {first: T, second: T }
-- generics can also have defaults!
type PairWithDefault<T = string> = Pair<T>

local strings: Pair<string> = { first="Hello", second="World" }
local numbers: Pair<number> = { first=1, second=2 }
-- can just treat PairWithDefault as a type that doesnt have generics because it has all of its generics assigned a default!
local more_strings: PairWithDefault = { first = "meow", second = "mrrp" }
```

## Generic functions

As well as generic type aliases like `Pair<T>`, Luau supports generic functions. These are functions that, as well as their regular data parameters, take type parameters. For example, a function which reverses an array is:
```luau
function reverse(a)
  local result = {}
  for i = #a, 1, -1 do
    table.insert(result, a[i])
  end
  return result
end
```
The type of this function is that it can reverse an array, and return an array of the same type. Luau can infer this type, but if you want to be explicit, you can declare the type parameter `T`, for example:
```luau
function reverse<T>(a: {T}): {T}
  local result: {T} = {}
  for i = #a, 1, -1 do
    table.insert(result, a[i])
  end
  return result
end
```
When a generic function is called, Luau infers type arguments, for example
```luau
--!file main.luau
local reverse = require("./reverse")
local x: {number} = reverse({1, 2, 3})
local y: {string} = reverse({"a", "b", "c"})

--!file reverse.luau
function reverse<T>(a: {T}): {T}
  local result: {T} = {}
  for i = #a, 1, -1 do
    table.insert(result, a[i])
  end
  return result
end

return reverse
```
Generic types are used for built-in functions as well as user functions,
for example the type of two-argument `table.insert` is:
```
<T>({T}, T) -> ()
```
Note: Functions don't support having defaults assigned to generics, meaning the following is invalid
```luau
function meow<T = string>(mrrp: T)
     print(mrrp .. " :3")
end
```
