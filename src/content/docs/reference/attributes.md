---
slug: attributes
title: Attributes
sidebar:
  order: 3
---

Luau supports a set of built-in attributes that can be applied to function declarations to adjust the behavior of the compiler, type analysis, or runtime. This page documents all available attributes and their parameters. Attributes are not user-definable.

For an overview of attribute syntax, see the [syntax reference](../syntax#attributes).

## `@native`

`@native` requests that the function be compiled with native code generation, which can improve performance for compute-heavy functions. It is the function-level equivalent of the `--!native` script directive, and takes no parameters.

```luau
@native
local function fib(n: number): number
    if n <= 1 then return n end
    return fib(n - 1) + fib(n - 2)
end
```

`@native` does not apply recursively to functions defined inside the attributed function; inner functions must be attributed separately:

```luau
@native
local function outer()
    @native
    local function inner()
        -- inner IS natively compiled because it is explicitly attributed
    end

    local function uninstrumented()
        -- this is NOT natively compiled
    end
end
```

## `@deprecated`

`@deprecated` marks a function as deprecated. The linter will warn whenever a deprecated function is called, and the LSP will display it in a visually distinct style in autocompletion.

```luau
@deprecated
local function oldApi()
    -- ...
end

oldApi() -- Warning: Function 'oldApi' is deprecated.
```

To provide more helpful warning messages, use the parameterized form with `use` (the recommended replacement) and `reason` (an explanation):

```luau
@[deprecated {
    use = "newApi()",
    reason = "newApi is faster and supports all value types.",
}]
local function oldApi()
    -- ...
end
```

Both parameters are optional. The resulting warning messages follow this format:

| Attribute | Warning message |
| --------- | --------------- |
| `@deprecated` | `Function 'oldApi' is deprecated.` |
| `@[deprecated {reason = "..."}]` | `Function 'oldApi' is deprecated. <reason>` |
| `@[deprecated {use = "newApi()"}]` | `Function 'oldApi' is deprecated, use 'newApi()' instead.` |
| `@[deprecated {use = "newApi()", reason = "..."}]` | `Function 'oldApi' is deprecated, use 'newApi()' instead. <reason>` |

If the deprecated function is a member of a table or class, the warning message uses `Member 'class.func' is deprecated` instead of `Function 'func' is deprecated`.

## Attributes with parameters

The `@[name(...)]` syntax is used for attributes that accept parameters. Parameters are literal values — `nil`, booleans, numbers, strings, or table constructors. Multiple attributes can be grouped inside a single `@[]`:

```luau
@[deprecated {use = "newApi()"}, native]
local function oldFastApi()
    -- ...
end
```

`@attr`, `@[attr]`, and `@[attr()]` are all equivalent. For single-parameter attributes whose argument is a string or table, the parentheses are optional:

```luau
@[deprecated {use = "newApi()"}]  -- same as @[deprecated({use = "newApi()"})]
local function oldApi() end
```
