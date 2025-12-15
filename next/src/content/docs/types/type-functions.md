---
slug: types/type-functions
title: Type Functions
sidebar:
  order: 8
---

Type functions are functions that run during analysis time and operate on types, instead of runtime values. They can use the [types](../types-library) library to transform existing types or create new ones.


Here's a simplified implementation of the builtin type function `keyof`. It takes a table type and returns its property names as a [union](unions-and-intersections#union-types) of [singletons](basic-types#singleton-types-aka-literal-types).

```lua
type function simple_keyof(ty)
    -- Ignoring unions or intersections of tables for simplicity.
    if not ty:is("table") then
        error("Can only call keyof on tables.")
    end

    local union = nil

    for property in ty:properties() do
        union = if union then types.unionof(union, property) else property
    end

    return if union then union else types.singleton(nil)
end

type person = {
    name: string,
    age: number,
}
--- keys = "age" | "name"
type keys = simple_keyof<person>
```

### Type function environment

In addition to the [types](../types-library) library, type functions have access to:

* `assert`, `error`, `print`
* `next`, `ipairs`, `pairs`
* `select`, `unpack`
* `getmetatable`, `setmetatable`
* `rawget`, `rawset`, `rawlen`, `raweq`
* `tonumber`, `tostring`
* `type`, `typeof`
* `math` library
* `table` library
* `string` library
* `bit32` library
* `utf8` library
* `buffer` library
