---
slug: types-library
title: Type Function Library
sidebar:
  order: 2
---

Luau provides both built-in and user-defined type functions as a way to create and manipulate types during analysis. Check out the [`types` library](#types-library) designed to interact with types for the user-defined type function environment.

## Global type functions

Luau has built-in type functions that provide common operations with types. These type functions can be accessed globally without extra namespacing.

```
type function len(t: type): type
```

Returns the resulting type after applying the unary `#` length operator to `t`.

```
type function unm(t: type): type
```

Returns the resulting type after applying the unary `-` minus operator to `t`.

```
type function add(t1: type, t2: type): type
```

Returns the resulting type after applying the `+` addition operator between `t1` and `t2` as `t1 + t2`.

```
type function sub(t1: type, t2: type): type
```

Returns the resulting type after applying the `-` subtraction operator between `t1` and `t2` as `t1 - t2`.

```
type function mul(t1: type, t2: type): type
```

Returns the resulting type after applying the `*` multiplication operator between `t1` and `t2` as `t1 * t2`.

```
type function div(t1: type, t2: type): type
```

Returns the resulting type after applying the `/` division operator between `t1` and `t2` as `t1 / t2`.

```
type function idiv(t1: type, t2: type): type
```

Returns the resulting type after applying the `//` floor division operator between `t1` and `t2` as `t1 // t2`.

```
type function pow(t1: type, t2: type): type
```

Returns the resulting type after applying the `^` exponent operator between `t1` and `t2` as `t1 ^ t2`.

```
type function mod(t1: type, t2: type): type
```

Returns the resulting type after applying the `%` modulo operator between `t1` and `t2` as `t1 % t2`.

```
type function concat(t1: type, t2: type): type
```

Returns the resulting type after applying the `..` concatenation operator between `t1` and `t2` as `t1 .. t2`.

```
type function lt(t1: type, t2: type): type
```

Returns the resulting type after applying the relational `<` less-than operator between `t1` and `t2` as `t1 < t2`.

```
type function le(t1: type, t2: type): type
```

Returns the resulting type after applying the relational `<=` less-than-or-equals-to operator between `t1` and `t2` as `t1 <= t2`.

```
type function index(obj: type, key: type): type
```

Indexes the given `obj` with the given `key` and returns the resulting type.

```luau
type t = setmetatable<{ [number]: string, foo: number }, {
    __index: { bar: buffer }
}>

local indexIndexer: index<t, number> --> `string`
local indexFoo: index<t, "foo">      --> `number`
local indexBar: index<t, "bar">      --> `buffer`
```

```
type function rawget(obj: type, key: type): type
```

Indexes the given `obj` with the given `key` and returns the resulting type. Unlike `index`, this type function bypasses metatables/`__index`.

```luau
type t = setmetatable<{ [number]: string, foo: number }, {
    __index: { bar: buffer }
}>

local indexIndexer: rawget<t, number> --> `string`
local indexFoo: rawget<t, "foo">      --> `number`
local indexBar: rawget<t, "bar">      --> `nil`
```

```
type function keyof(obj: type): type
```

Returns all property keys of `obj` as a [union](#union-type-instance) of string [singletons](#singleton-type-instance). Note that this type function does not respect [table indexers](../types/tables/#table-indexers).

```
type function rawkeyof(obj: type): type
```

Returns all property keys of `obj` as a [union](#union-type-instance) of string [singletons](#singleton-type-instance). Unlike `keyof`, this type function bypasses metatables/`__index`. This type function also does not respect [table indexers](../types/tables/#table-indexers)

```
type function setmetatable(t: type, mt: type): type
```

Returns a copy of `t` with the given `mt` metatable attached to it.

```
type function getmetatable(t: type): type
```

Returns the attached metatable type for the given `t`, or `nil` if it does not exist.

## `types` library

The `types` library is used to create and transform types, and can only be used within [type functions](../types/type-functions).

### `types` library properties

```
types.any
```

The [any](../types/basic-types#any-type) `type`.

```
types.unknown
```

The [unknown](../types/basic-types#unknown-type) `type`.

```
types.never
```

The [never](../types/basic-types#never-type) `type`.

```
types.boolean
```

The boolean `type`.

```
types.buffer
```

The [buffer](../library#buffer-library) `type`.

```
types.number
```

The number `type`.

```
types.string
```

The string `type`.

```
types.thread
```

The thread `type`.

### `types` library functions

```
types.singleton(arg: string | boolean | nil): type
```

Returns the [singleton](../types/basic-types#singleton-types-aka-literal-types) type of the argument.

```
types.negationof(arg: type): type
```

Returns an immutable negation of the argument type.

```
types.optional(arg: type): type
```

Returns a version of the given type that is now optional.

- If the given type is a [union type](../types/unions-and-intersections#union-types), `nil` will be added unconditionally as a component.
- Otherwise, the result will be a union of the given type and the `nil` type.

```
types.unionof(first: type, second: type, ...: type): type
```

Returns an immutable [union](../types/unions-and-intersections#union-types) of two or more arguments.

```
types.intersectionof(first: type, second: type, ...: type): type
```

Returns an immutable [intersection](../types/unions-and-intersections#intersection-types) of two or more arguments.

```
types.newtable(props: { [type]: type | { read: type?, write: type? } }?, indexer: { index: type, readresult: type, writeresult: type? }?, metatable: type?): type
```

Returns a fresh, mutable table `type`. Property keys must be string singleton `type`s. The table's metatable is set if one is provided.

```
types.newfunction(parameters: { head: {type}?, tail: type? }, returns: { head: {type}?, tail: type? }?, generics: {type}?): type
```

Returns a fresh, mutable function `type`, using the ordered parameters of `head` and the variadic tail of `tail`.

```
types.copy(arg: type): type
```

Returns a deep copy of the argument type.

```
types.generic(name: string?, ispack: boolean?): type
```

Creates a [generic](../types/generics#generic-functions) named `name`. If `ispack` is `true`, the result is a [generic pack](../types/basic-types#type-packs).

### `type` instance

`type` instances can have extra properties and methods described in subsections depending on its tag.

```
type.tag: "nil" | "unknown" | "never" | "any" | "boolean" | "number" | "string" | "singleton" | "negation" | "union" | "intersection" | "table" | "function" | "extern" | "thread" | "buffer"
```

An immutable property holding the type's tag.

```
__eq(arg: type): boolean
```

Overrides the `==` operator to return `true` if `self` is syntactically equal to `arg`. This excludes semantically equivalent types, `true | false` is unequal to `boolean`.

```
type:is(arg: "nil" | "unknown" | "never" | "any" | "boolean" | "number" | "string" | "singleton" | "negation" | "union" | "intersection" | "table" | "function" | "extern" | "thread" | "buffer")
```

Returns `true` if `self` has the argument as its tag.

```
type:issubtypeof(super: type): boolean
```

Returns `true` if `self` is a subtype of the provided `super` type argument.

```luau
type function isString(ty)
    return types.singleton(ty:issubtypeof(types.string))
end

local x: isString<string>  --> `true`
local y: isString<"hello"> --> `true`
local z: isString<false>   --> `false`
```

### Singleton `type` instance

```
singletontype:value(): boolean | nil | "string"
```

Returns the singleton's actual value, like `true` for `types.singleton(true)`.

### Generic `type` instance

```
generictype:name(): string?
```

Returns the name of the [generic](../types/generics#generic-functions) or `nil` if it has no name.

```
generictype:ispack(): boolean
```

Returns `true` if the [generic](../types/generics#generic-functions) is a [pack](../types/basic-types#type-packs), or `false` otherwise.

### Table `type` instance

```
tabletype:setproperty(key: type, value: type?)
```

Sets the type of the property for the given `key`, using the same type for both reading from and writing to the table.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as both the `read type` and `write type` of the property.
- If `value` is `nil`, the property is removed.

```
tabletype:setreadproperty(key: type, value: type?)
```

Sets the type for reading from the property named by `key`, leaving the type for writing this property as-is.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as the `read type`, the `write type` will be unchanged.
- If `key` is not already present, only a `read type` will be set, making the property read-only.
- If `value` is `nil`, the property is removed.

```
tabletype:setwriteproperty(key: type, value: type?)
```


Sets the type for writing to the property named by `key`, leaving the type for reading this property as-is.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as the `write type`, the `read type` will be unchanged.
- If `key` is not already present, only a `write type` will be set, making the property write-only.
- If `value` is `nil`, the property is removed.

```
tabletype:readproperty(key: type): type?
```

Returns the type used for reading values from this property, or `nil` if the property doesn't exist.

```
tabletype:writeproperty(key: type): type?
```

Returns the type used for writing values to this property, or `nil` if the property doesn't exist.

```
tabletype:properties(): { [type]: { read: type?, write: type? } }
```

Returns a table mapping property keys to their read and write types.

```
tabletype:setindexer(index: type, result: type)
```

Sets the table's indexer, using the same type for reads and writes.

```
tabletype:setreadindexer(index: type, result: type)
```

Sets the type resulting from reading from this table via indexing.

```
tabletype:setwriteindexer(index: type, result: type)
```

Sets the type for writing to this table via indexing.

```
tabletype:indexer(): { index: type, readresult: type, writeresult: type }
```

Returns the table's indexer as a table, or `nil` if it doesn't exist.

```
tabletype:readindexer(): { index: type, result: type }?
```

Returns the table's indexer using the result's read type, or `nil` if it doesn't exist.

```
tabletype:writeindexer()
```

Returns the table's indexer using the result's write type, or `nil` if it doesn't exist.

```
tabletype:setmetatable(arg: type)
```

Sets the table's metatable.

```
tabletype:metatable(): type?
```

Gets the table's metatable, or `nil` if it doesn't exist.

### Function `type` instance

```
functiontype:setparameters(head: {type}?, tail: type?)
```

Sets the function's parameters, with the ordered parameters in `head` and the variadic tail in `tail`.

```
functiontype:parameters(): { head: {type}?, tail: type? }
```

Returns the function's parameters, with the ordered parameters in `head` and the variadic tail in `tail`.

```
functiontype:setreturns(head: {type}?, tail: type?)
```

Sets the function's return types, with the ordered parameters in `head` and the variadic tail in `tail`.

```
functiontype:returns(): { head: {type}?, tail: type? }
```

Returns the function's return types, with the ordered parameters in `head` and the variadic tail in `tail`.

```
functiontype:generics(): {type}
```

Returns an array of the function's [generic](../types/generics#generic-functions) `type`s.

```
functiontype:setgenerics(generics: {type}?)
```

Sets the function's [generic](../types/generics#generic-functions) `type`s.

### Negation `type` instance

```
type:inner(): type
```

Returns the `type` being negated.

### Union `type` instance

```
uniontype:components(): {type}
```

Returns an array of the [unioned](../types/unions-and-intersections#union-types) types.

### Intersection `type` instance

```
intersectiontype:components()
```

Returns an array of the [intersected](../types/unions-and-intersections#intersection-types) types.

### Extern `type` instance

```
externtype:properties(): { [type]: { read: type?, write: type? } }
```

Returns the properties of the extern type with their respective `read` and `write` types.

```
externtype:readparent(): type?
```

Returns the type of reading this extern type's parent, or returns `nil` if the parent doesn't exist.

```
externtype:writeparent(): type?
```

Returns the type for writing to this extern type's parent, or returns `nil` if the parent doesn't exist.

```
externtype:metatable(): type?
```

Returns the extern type's metatable, or `nil` if it doesn't exist.

```
externtype:indexer(): { index: type, readresult: type, writeresult: type }?
```

Returns the extern type's indexer, or `nil` if it doesn't exist.

```
externtype:readindexer(): { index: type, result: type }?
```

Returns the result type of reading from the extern type via indexing, or `nil` if it doesn't exist.

```
externtype:writeindexer(): { index: type, result: type }?
```

Returns the type for writing to the extern type via indexing, or `nil` if it doesn't exist.
