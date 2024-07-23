---
layout: single
title:  "Luau Recap: July 2024"
---

Hello everyone!
While the Luau team is actively working on a big rewrite of the type inference and type checking engines (more news about that in the near future), we wanted to go over other changes and updates since the last recap back in October.

## What's new

### Native function attribute

For a better control of what code runs natively, we have introduced new syntax for function attributes:

```luau
@native -- function compiles natively
local function foo()
    ...
end
```

We have also prepared a video for you, going over the native code generation feature and best approaches on using it, including the new attribute:

https://www.youtube.com/watch?v=llR_pNlJDQw

This is the first attribute to become available and we are working on the ability to mark functions as deprecated using the `@deprecated` attribute. More on that in [here](https://github.com/luau-lang/rfcs/blob/2335ab6db9353223fad0065294d15fdcd127c4ea/docs/syntax-attribute-functions-deprecated.md).

### Type information for runtime optimizations

Native code generation works on any code without having to modify it.
In certain situations this means that native compiler cannot be sure about the types involved in the operation.

Consider a simple function, working on a few values:

```luau
local function MulAddScaled(a, b, c)
    return a * b * 0.75 + c * 0.25
end
```

Native compiler assumes that operations are most likely being performed on numbers and generates the appropriate fast path.
But what if the function is actually called with a Vector3 type?

```luau
local intlPos = MulAddScaled(Part.Position, v, Vector3.new(12, 0, 0))
```

To handle this, a slower path was generated to handle any other potential type of the argument. Because this path is not chosen as the first possible option, extra checking overhead prevents code from running as fast as it can.

When we announced the last update, we have already added some support for following types used as arguments.

```luau
local function MulAddScaled(a: Vector3, b: Vector3, c: Vector3)
    return a * b * 0.75 + c * 0.25
end
```

Since then, we have extended this to support type information on locals, following complex types and even inferring results of additional operations.

```luau
type Vertex = { p: Vector3, uv: Vector3, n: Vector3, t: Vector3, b: Vector3, h: number }
type Mesh = { vertices: {Vertex}, indices: {number} }

function calculate_normals(mesh: Mesh)
    for i = 1,#mesh.indices,3 do
        local a = mesh.vertices[mesh.indices[i]]
        local b = mesh.vertices[mesh.indices[i + 1]]
        local c = mesh.vertices[mesh.indices[i + 2]]
        
        local vba = a.p - b.p -- Inferred as a Vector3 operation
        local vca = a.p - c.p

        local n = vba:Cross(vca) -- Knows that Cross returns Vector3
        
        a.n += n -- Inferred as a Vector3 operation
        b.n += n
        c.n += n
    end
end
```

As can be seen, often it's enough to annotate the type of the data structure and correct fast-path vector code will be generated from that without having to specify type of each local or temporary.

Note that native compilation now supports properties/methods of the Vector3 type like `Magnitude`, `Unit`, `Dot`, `Cross`, `Floor` and `Ceil` allowing generation of CPU code that is multiple times faster than a generic Roblox API call.

Even when native compiler doesn't have a specific optimization for a type, like Vector2, UDim2 or Part, if the type can be resolved, shorter code sequences are generated and more optimizations can be made between separate operations.

We are working to extend type inference and faster inline operations for additional Vector3 methods and even operations on Vector2/CFrame in the future.

## Runtime Changes

### Stricter `utf8` library validation

`utf8` library will now correctly validate UTF-8 and reject inputs that have surrogates.
`utf8.len` will return `nil` followed by the byte offset, `utf8.codepoint` and `utf8.codes` will error.
This matches how other kinds of input errors were previously handled by those functions.

Strings that are validated using `utf8.len` will now always work properly with `utf9.nfcnormalize`, `utf8.grafemes`, DataStore APIs and other Roblox engine functions. Custom per-character validation logic is no longer required.

### Imprecise integer number warning

Luau stores numbers as 64-bit floating-point values. Integer values up to 2^53 are supported, but higher numbers might experience rounding.
For example, both 10000000000000000 and 9223372036854775808 are larger than 2^53, but match the rounding, while 10000000000000001 gets rounded down to 10000000000000000.
In cases where rounding takes place, you will get a warning message.
If the large value is intended and rounding can be ignored, just add ".0" to the number to remove the warning:

```luau
local a = 10000000000000001 -- Number literal exceeded available precision and was truncated to closest representable number
local b = 10000000000000001.0 -- Ok, but rounds to 10000000000000000
```

### Leading `|` and `&` in types

It is now possible to start your union and intersection types with a symbol. This can help align the type components more cleanly:

```luau
type Options =
    | { tag: "cat", laziness: number }
    | { tag: "dog", happiness: number }
```

You can find more information and examples in [the proposal](https://github.com/luau-lang/rfcs/blob/leading-bar-ampersand/docs/syntax-leading-bar-and-ampersand.md)

## Native Code Generation

As a reminder, Luau native code generation is now available by default on the server for all experiences.
If you have missed it, you can find the last update in the announcement: https://devforum.roblox.com/t/luau-native-code-generation-preview-update/2961746

## Analysis Improvements

While our main focus is one a type-checking engine rewrite that is nearing completion, we have fixed some of the issues in the current one.

* Relational operator errors are more conservative now and generate less false positive errors
* It is not an error to iterate over table properties when indexer is not part of the type
* Type packs with cycles are now correctly described in error messages
* Improved error message when value that is not a function is being used in a call
* Fixed stability issues which caused Studio to crash
* Improved performance for code bases with large number of scripts and complex types

## Runtime Improvements

When converting numbers to strings in scientific notation, we will now skip the trailing '.'.

For example, `tostring(1e+30)` now outputs '1e+30' instead of '1.e+30'. This improves compatibility with data formats like JSON. But please keep in mind that unless you are using JSON5, Luau can still output 'inf' and 'nan' numbers which might not be supported.

* Construction of tables with 17-32 properties or 33-64 array elements is now 30% faster.
* `table.concat` method is now 2x faster when separator is not used and 40% faster otherwise.
* `table.maxn` method is now 5-14x faster.
* Vector3 constants are now stored in the constant table and avoid runtime construction.
* Operations like 5/x and 5-x with any constant on the left-hand-side are now performed faster, one less minor thing to think about!
* It is no longer possible to crash the server on a hang in the `string` library methods.

## Buffer library and type

As a reminder, `buffer` data type announced as a beta [here](https://devforum.roblox.com/t/introducing-luau-buffer-type-beta/2724894) has been out of beta since December with additional use cases added in February.
We've seen some feedback that people were not aware of the availability, so we use this opportunity as a reminder!

## Luau as a supported language on GitHub

Lastly, if you have open-source or even private projects on GitHub which use Luau, you might be happy to learn that Luau now has official support on GitHub for `.luau` file extension.
This includes recognizing files as using Luau programming language and having support for syntax highlighting.

A big thanks goes to our [open source community](https://github.com/luau-lang/luau) for their generous contributions including pushing for broader Luau support.
