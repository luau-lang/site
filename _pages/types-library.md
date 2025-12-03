---
permalink: /types-library
title: Type Function API Reference
toc: true
---

The `types` library is used to create and transform types, and can only be used within [type functions](typecheck/type-functions).

### `types` library properties

```luau
types.any
```

The [any](typecheck/basic-types#any-type) `type`.

```luau
types.unknown
```

The [unknown](typecheck/basic-types#unknown-type) `type`.

```luau
types.never
```

The [never](typecheck/basic-types#never-type) `type`.

```luau
types.boolean
```

The boolean `type`.

```luau
types.buffer
```

The [buffer](library#buffer-library) `type`.

```luau
types.number
```

The number `type`.

```luau
types.string
```

The string `type`.

```luau
types.thread
```

The thread `type`.

## `types` library functions

```luau
types.singleton(arg: string | boolean | nil): type
```

Returns the [singleton](typecheck/basic-types#singleton-types-aka-literal-types) type of the argument.

```luau
types.negationof(arg: type): type
```

Returns an immutable negation of the argument type.

```luau
types.optional(arg: type): type
```

Returns a version of the given type that is now optional.

- If the given type is a [union type](typecheck/unions-and-intersections#union-types), `nil` will be added unconditionally as a component.
- Otherwise, the result will be a union of the given type and the `nil` type.

```luau
types.unionof(first: type, second: type, ...: type): type
```

Returns an immutable [union](typecheck/unions-and-intersections#union-types) of two or more arguments.

```luau
types.intersectionof(first: type, second: type, ...: type): type
```

Returns an immutable [intersection](typecheck/unions-and-intersections#intersection-types) of two or more arguments.

```luau
types.newtable(props: { [type]: type | { read: type?, write: type? } }?, indexer: { index: type, readresult: type, writeresult: type? }?, metatable: type?): type
```

Returns a fresh, mutable table `type`. Property keys must be string singleton `type`s. The table's metatable is set if one is provided.

```luau
types.newfunction(parameters: { head: {type}?, tail: type? }, returns: { head: {type}?, tail: type? }?, generics: {type}?): type
```

Returns a fresh, mutable function `type`, using the ordered parameters of `head` and the variadic tail of `tail`.

```luau
types.copy(arg: type): type
```

Returns a deep copy of the argument type.

```luau
types.generic(name: string?, ispack: boolean?): type
```

Creates a [generic](typecheck/generics#generic-functions) named `name`. If `ispack` is `true`, the result is a [generic pack](typecheck/basic-types#type-packs).

### `type` instance

`type` instances can have extra properties and methods described in subsections depending on its tag.

```luau
type.tag: "nil" | "unknown" | "never" | "any" | "boolean" | "number" | "string" | "singleton" | "negation" | "union" | "intersection" | "table" | "function" | "class" | "thread" | "buffer"
```

An immutable property holding the type's tag.

```luau
__eq(arg: type): boolean
```

Overrides the `==` operator to return `true` if `self` is syntactically equal to `arg`. This excludes semantically equivalent types, `true | false` is unequal to `boolean`.

```luau
type:is(arg: "nil" | "unknown" | "never" | "any" | "boolean" | "number" | "string" | "singleton" | "negation" | "union" | "intersection" | "table" | "function" | "class" | "thread" | "buffer")
```

Returns `true` if `self` has the argument as its tag.

### Singleton `type` instance

```luau
singletontype:value(): boolean | nil | "string"
```

Returns the singleton's actual value, like `true` for `types.singleton(true)`.

### Generic `type` instance

```luau
generictype:name(): string?
```

Returns the name of the [generic](typecheck/generics#generic-functions) or `nil` if it has no name.

```luau
generictype:ispack(): boolean
```

Returns `true` if the [generic](typecheck/generics#generic-functions) is a [pack](typecheck/basic-types#type-packs), or `false` otherwise.

### Table `type` instance

```luau
tabletype:setproperty(key: type, value: type?)
```

Sets the type of the property for the given `key`, using the same type for both reading from and writing to the table.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as both the `read type` and `write type` of the property.
- If `value` is `nil`, the property is removed.

```luau
tabletype:setreadproperty(key: type, value: type?)
```

Sets the type for reading from the property named by `key`, leaving the type for writing this property as-is.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as the `read type`, the `write type` will be unchanged.
- If `key` is not already present, only a `read type` will be set, making the property read-only.
- If `value` is `nil`, the property is removed.

```luau
tabletype:setwriteproperty(key: type, value: type?)
```


Sets the type for writing to the property named by `key`, leaving the type for reading this property as-is.

- `key` is expected to be a string singleton type, naming the property.
- `value` will be set as the `write type`, the `read type` will be unchanged.
- If `key` is not already present, only a `write type` will be set, making the property write-only.
- If `value` is `nil`, the property is removed.

```luau
tabletype:readproperty(key: type): type?
```

Returns the type used for reading values from this property, or `nil` if the property doesn't exist.

```luau
tabletype:writeproperty(key: type): type?
```

Returns the type used for writing values to this property, or `nil` if the property doesn't exist.

```luau
tabletype:properties(): { [type]: { read: type?, write: type? } }
```

Returns a table mapping property keys to their read and write types.

```luau
tabletype:setindexer(index: type, result: type)
```

Sets the table's indexer, using the same type for reads and writes.

```luau
tabletype:setreadindexer(index: type, result: type)
```

Sets the type resulting from reading from this table via indexing.

```luau
tabletype:setwriteindexer(index: type, result: type)
```

Sets the type for writing to this table via indexing.

```luau
tabletype:indexer(): { index: type, readresult: type, writeresult: type }
```

Returns the table's indexer as a table, or `nil` if it doesn't exist.

```luau
tabletype:readindexer(): { index: type, result: type }?
```

Returns the table's indexer using the result's read type, or `nil` if it doesn't exist.

```luau
tabletype:writeindexer()
```

Returns the table's indexer using the result's write type, or `nil` if it doesn't exist.

```luau
tabletype:setmetatable(arg: type)
```

Sets the table's metatable.

```luau
tabletype:metatable(): type?
```

Gets the table's metatable, or `nil` if it doesn't exist.

### Function `type` instance

```luau
functiontype:setparameters(head: {type}?, tail: type?)
```

Sets the function's parameters, with the ordered parameters in `head` and the variadic tail in `tail`.

```luau
functiontype:parameters(): { head: {type}?, tail: type? }
```

Returns the function's parameters, with the ordered parameters in `head` and the variadic tail in `tail`.

```luau
functiontype:setreturns(head: {type}?, tail: type?)
```

Sets the function's return types, with the ordered parameters in `head` and the variadic tail in `tail`.

```luau
functiontype:returns(): { head: {type}?, tail: type? }
```

Returns the function's return types, with the ordered parameters in `head` and the variadic tail in `tail`.

```luau
functiontype:generics(): {type}
```

Returns an array of the function's [generic](typecheck/generics#generic-functions) `type`s.

```luau
functiontype:setgenerics(generics: {type}?)
```

Sets the function's [generic](typecheck/generics#generic-functions) `type`s.

### Negation `type` instance

```luau
type:inner(): type
```

Returns the `type` being negated.

### Union `type` instance

```luau
uniontype:components(): {type}
```

Returns an array of the [unioned](typecheck/unions-and-intersections#union-types) types.

### Intersection `type` instance

```luau
intersectiontype:components()
```

Returns an array of the [intersected](typecheck/unions-and-intersections#intersection-types) types.

### Class `type` instance

```luau
classtype:properties(): { [type]: { read: type?, write: type? } }
```

Returns the properties of the class with their respective `read` and `write` types.

```luau
classtype:readparent(): type?
```

Returns the type of reading this class' parent, or returns `nil` if the parent class doesn't exist.

```luau
classtype:writeparent(): type?
```

Returns the type for writing to this class' parent, or returns `nil` if the parent class doesn't exist.

```luau
classtype:metatable(): type?
```

Returns the class' metatable, or `nil` if it doesn't exist.

```luau
classtype:indexer(): { index: type, readresult: type, writeresult: type }?
```

Returns the class' indexer, or `nil` if it doesn't exist.

```luau
classtype:readindexer(): { index: type, result: type }?
```

Returns result type of reading from the class via indexing, or `nil` if it doesn't exist.

```luau
classtype:writeindexer(): { index: type, result: type }?
```

Returns the type for writing to the class via indexing, or `nil` if it doesn't exist.
