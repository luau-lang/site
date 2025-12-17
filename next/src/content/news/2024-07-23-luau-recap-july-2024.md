---
title:  "Luau Recap: July 2024"
date: 2024-07-23
---

Hello everyone!

While the Luau team is actively working on a big rewrite of the type inference and type checking engines (more news about that in the near future), we wanted to go over other changes and updates since our last recap back in October.

## Official Luau mascot

Luau has recently adopted a Hawaiian monk seal mascot named Hina, after the Hawaiian goddess of the moon.

Please welcome Hina the Seal!

![Hina the Seal](../../assets/images/mascot.png)

## Native Code Generation

We are happy to announce that the native code feature is out from the 'Preview' state and is fully supported for X64 (Intel/AMD) or A64 (ARM) processor architectures.

As a refresher, native code generation is the feature that allows Luau scripts that have been previously executed by interpreting bytecode inside the Luau VM to instead compile to machine code that the CPU understands and executes directly.

Since the release of the Preview, we have worked on improving code performance, memory use of the system, correctness and stability.

Some highlights:

* Improved performance of the [bit32 library](https://luau-lang.org/library#bit32-library) functions
* Improved performance of numerical loops
* Optimized table array and property lookups
* Added native support for new [buffer type](https://luau-lang.org/library#buffer-library) operations
* Code optimizations based on knowing which types are returned from operations
* Code optimizations based on function argument type annotations
  * This includes support for [SIMD operations](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) for annotated vector arguments

There are many other small improvements in generated code performance and size and we have plans for additional optimizations.

### Native function attribute

For a better control of what code runs natively, we have introduced new syntax for function attributes:

```lua
@native -- function compiles natively
local function foo()
    ...
end
```

This is the first attribute to become available and we are working on the ability to mark functions as deprecated using the `@deprecated` attribute. More on that [here](https://github.com/luau-lang/rfcs/blob/2335ab6db9353223fad0065294d15fdcd127c4ea/docs/syntax-attribute-functions-deprecated.md).

### Type information for runtime optimizations

Native code generation works on any code without having to modify it.
In certain situations, this means that the native compiler cannot be sure about the types involved in the operation.

Consider a simple function, working on a few values:

```lua
local function MulAddScaled(a, b, c)
    return a * b * 0.75 + c * 0.25
end
```

Native compiler assumes that operations are most likely being performed on numbers and generates the appropriate fast path.

But what if the function is actually called with a vector type?

```lua
local intlPos = MulAddScaled(Part.Position, v, vector(12, 0, 0))
```

To handle this, a slower path was generated to handle any other potential type of the argument. Because this path is not chosen as the first possible option, extra checking overhead prevents code from running as fast as it can.

When we announced the last update, we had already added some support for following the types used as arguments.

```lua
local function MulAddScaled(a: vector, b: vector, c: vector)
    return a * b * 0.75 + c * 0.25
end
```

> **_NOTE:_** `vector` type is not enabled by default, check out `defaultOptions` and `setupVectorHelpers` functions in `Conformance.test.cpp` file as an example of the `vector` library setup.

Since then, we have extended this to support type information on locals, following complex types and even inferring results of additional operations.

```lua
type Vertex = { p: vector, uv: vector, n: vector, t: vector, b: vector, h: number }
type Mesh = { vertices: {Vertex}, indices: {number} }

function calculate_normals(mesh: Mesh)
    for i = 1,#mesh.indices,3 do
        local a = mesh.vertices[mesh.indices[i]]
        local b = mesh.vertices[mesh.indices[i + 1]]
        local c = mesh.vertices[mesh.indices[i + 2]]

        local vba = a.p - b.p -- Inferred as a vector operation
        local vca = a.p - c.p

        local n = vba:Cross(vca) -- Knows that Cross returns vector

        a.n += n -- Inferred as a vector operation
        b.n += n
        c.n += n
    end
end
```

As can be seen, often it's enough to annotate the type of the data structure and correct fast-path vector code will be generated from that without having to specify the type of each local or temporary.

> **_NOTE:_** Advanced inference and operation lowering is enabled by using custom `HostIrHooks` callbacks. Check out 'Vector' test with 'IrHooks' option in `Conformance.test.cpp` and `ConformanceIrHooks.h` file for an example of the setup.

Note that support for native lowering hooks allows generation of CPU code that is multiple times faster than a generic metatable call.

Even when native compiler doesn't have a specific optimization for a type, if the type can be resolved, shorter code sequences are generated and more optimizations can be made between separate operations.

> **_NOTE:_** `HostIrHooks` callbacks also enable type inference and lowering for your custom userdata types. Check out 'NativeUserdata' test with 'IrHooks' option in `Conformance.test.cpp` and `ConformanceIrHooks.h` file for an example of the setup.

## Runtime changes

### Stricter `utf8` library validation

`utf8` library will now correctly validate UTF-8 and reject inputs that have surrogates.
`utf8.len` will return `nil` followed by the byte offset, `utf8.codepoint` and `utf8.codes` will error.
This matches how other kinds of input errors were previously handled by those functions.

Strings that are validated using `utf8.len` will now always work properly with `utf8.nfcnormalize` and `utf8.graphemes` functions. Custom per-character validation logic is no longer required to check if a string is valid under `utf8` requirements.

### Imprecise integer number warning

Luau stores numbers as 64-bit floating-point values. Integer values up to 2^53 are supported, but higher numbers might experience rounding.

For example, both 10000000000000000 and 9223372036854775808 are larger than 2^53, but match the rounding, while 10000000000000001 gets rounded down to 10000000000000000.

In cases where rounding takes place, you will get a warning message.
If the large value is intended and rounding can be ignored, just add ".0" to the number to remove the warning:

```lua
local a = 10000000000000001 -- Number literal exceeded available precision and was truncated to closest representable number
local b = 10000000000000001.0 -- Ok, but rounds to 10000000000000000
```

### Leading `|` and `&` in types

It is now possible to start your union and intersection types with a symbol. This can help align the type components more cleanly:

```lua
type Options =
    | { tag: "cat", laziness: number }
    | { tag: "dog", happiness: number }
```

You can find more information and examples in [the proposal](https://github.com/luau-lang/rfcs/blob/leading-bar-ampersand/docs/syntax-leading-bar-and-ampersand.md)

## Analysis Improvements

While our main focus is on a type-checking engine rewrite that is nearing completion, we have fixed some of the issues in the current one.

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
* `table.concat` method is now 2x faster when the separator is not used and 40% faster otherwise.
* `table.maxn` method is now 5-14x faster.
* vector constants are now stored in the constant table and avoid runtime construction.
* Operations like 5/x and 5-x with any constant on the left-hand-side are now performed faster, one less minor thing to think about!
* It is no longer possible to crash the server on a hang in the `string` library methods.

## Luau as a supported language on GitHub

Lastly, if you have open-source or even private projects on GitHub which use Luau, you might be happy to learn that Luau now has official support on GitHub for `.luau` file extension. This includes recognizing files as using Luau programming language and having support for syntax highlighting.

A big thanks goes to our [open source community](https://github.com/luau-lang/luau) for their generous contributions including pushing for broader Luau support:

* [birds3345](https://github.com/birds3345)
* [bjornbytes](https://github.com/bjornbytes)
* [Gskartwii](https://github.com/Gskartwii)
* [jackdotink](https://github.com/jackdotink)
* [JohnnyMorganz](https://github.com/JohnnyMorganz)
* [khvzak](https://github.com/khvzak)
* [kostadinsh](https://github.com/kostadinsh)
* [mttsner](https://github.com/mttsner)
* [mxruben](https://github.com/mxruben)
* [petrihakkinen](https://github.com/petrihakkinen)
* [zeux](https://github.com/zeux)
