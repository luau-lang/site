---
layout: single
title:  "Luau Recap for 2025: Runtime"
---

Hello everyone!

It has been a while since the last recap and we wanted to go over changes we have made in Luau since the last update.

Because of the amount of time that passed, in this part of the recap, we are going to focus on the runtime changes: new library functions, compiler changes, native code generation changes and Luau C API updates!

## New libraries and functions

We have added the [vector library](https://rfcs.luau.org/vector-library.html) to construct and work with out native `vector` type.

Before this, the type was available, but the embedder had to provide construction and methods to work with it.
It also meant that it lacked built-in call optimizations for common methods.

With the built-in library, we get fast-call optimization, support for vector contants and constant-folding in the compiler and native code generation comes out of the box!

In the `math` library, we have added [`math.map`](https://rfcs.luau.org/function-math-map.html), [`math.lerp`](https://rfcs.luau.org/function-math-lerp.html) and [`math.isnan`/`math.isinf`/`math.isfinite`](https://rfcs.luau.org/math-isnan-isfinite-isinf.html) functions.

Finally, for the `buffer` library, [`buffer.readbits`/`buffer.writebits`](https://rfcs.luau.org/function-buffer-bits.html) API was added.

## Require by string

After the earlier approval of the require-by-string RFC, we have build a separate Luau.Require library that any project can include.

It will bring the common semantics of the string require while supporting the full set of features such as alias and configuration resolution while remaining customizable in different environments with both real and virtual file systems representing the Luau file hiearchy.

## Runtime changes and improvements

A new `lua_newuserdatataggedwithmetatable` API let's you associate a tagged userdata object with a shared metatable and then create those object with metatable assignment in a single call.
In our applications, we have measured a 3x speedup of creating new userdata objects, which is especially important when they represent small and frequently allocated structures like colors or matrices.

And speaking of userdata, Luau now guarantees that it will be suitable for objects that require 16 byte alignment. As long as you provide Luau with a global allocator which also respects that.

For lightuserdata, new `lua_rawgetp`/`lua_rawsetp`/`lua_rawgetptagged`/`lua_rawsetptagged` have been added to match Lua 5.2+ and allow you to index tables with lightuserdata keys directly and more performantly.

Yieldable C functions can now call other yieldable functions using `luaL_callyieldable` method.
Previously, C functions could yield only once and couldn't yield from nested calls, but now that is possible.

One limitation we still have is making nested yieldable protected calls. We will be looking into supporting that in the future.

Protected calls using `pcall` or `xpcall` are now stackless when perfromed in a yieldable context.
This means that calling those functions will not apply the C call depth limit to your Luau code.

We will be looking into making those stackless even in non-yieldable contexts as well as improving overall performance of `pcall`/`xpcall` next year.

Our runtime is now more robust against out-of-memory errors and is easier to work with in low memory conditions:
- `luaL_where` and `luaL_error` can be called without `lua_checkstack`
- `luau_load` will no longer throw an error on out-of-memory
- `lua_checkstack` will report a failure on out-of-memory instead of throwing an error
- `lua_cpcall` function has returned and allows you to enter a protected environment to execute your target C function

There were also some small bug fixes:
- Using '%c' with a 0 value in `string.format` appends a '\0' instead of doing nothing
- `xpcall` is consistent before and after target function yields

Finally, a few new C API functions that weren't mentioned:
- `lua_clonetable` let's you clone a table
- `lua_tolstringatom` is an alternative to `lua_tostringatom` but also provides you with the length of the string
- `lua_unref` no longer accepts references that are not in the table

## Changes in the compiler

On the compiler side, we have made improvements to constant propagation, inlining and a few other things.

With the introduction of the `vector` library mentioned earlier, we have provided constant propagation and type inference for vector library globals.
Vector arithmetic and library functions are also constant-folded when possible and vector contants are embedded into the bytecode.

Constant-folding has also been added to `string.char` and `string.sub` methods.
String concatenation and string interpolation will also constant-fold for constant string or even when only some of the strings are constant.

Inlining has received multiple improvements.

Inlining cost model is now aware of the work constant-folding has done and will not consider constant expressions to have a cost of evaluation.
This means that functions computing a constant based on other global constants is a very likely inlining candidate.
Further improvements made it so that code which can be considered dead based on the state of global constant locals does not increase the cost.

Inlining can now propagate constant variables that are not representable as literal values.
For example, passing a function into a function as an argument can cause the argument function to be inlined!

And the biggest change is that inlining cost model is now updated per call to take constant arguments into the account.
This means that a large function can sometimes collapse into a small one, which is much more suitable for inlining.

Some smaller features are rewriting `const*var` and `const+var` operations into `var*const` and `var+const` when `var` is known to be a number from type annotations.
This allows the expression to use one bytecode instruction instead of two for a small perf improvement.

Finally, with all these optimizations, we have added a way for the embedder to disable them for a specific built-in function call in case it has a different overwritten meaning.

## Changes in Native Code Generation

A lot of work is still going into our native code generation module, which has gained support for working on Android and has been tested in production.

Once again, `vector` library introduction required us to provide native lowering of all those functions for best performance.
It is now possible to remove a lot of code in case you had those native IR hook functions for vectors.

In particular, for `vector.dot` we are lowering it to a CPU dot product instruction when possible.
`vector.lerp` and `math.lerp` enjoy a new `MULADD_NUM` instruction that lowers to CPU fused-multiply-add when that is available.

Load-store propagation pass has been added to detect duplicate loads of vector components as well as allowing loads from previous stores to re-use the existing register value or extract a single component from it using a new `EXTRACT_VEC` instruction.

Unused stores of vectors into VM registers can also now be removed.

Multiple optimizations have been done to ensure our basic blocks are as long as possible without being broken up by control flow.
The longer the basic block, the easier it is to optimize and reuse values.

We have updated lowering of `bit32.btest` to use a new `CMP_INT` instruction which no longer causes that call to generate a branch.

Equality comparisons `==`/`~=` are also performed without branching now.
With some extra handling, checks like `type(x) == "number"` of `typeof(x) == "string"` are now transformed into a tag check or a direct string pointer comparison, all without introducing branches.

Operators `and`/`or` for a simple value will use new `SELECT_IF_TRUTHY` instruction which will also keep the basic block linear.

An additional optimization to keep blocks linear is a specialized instruction `GET_CACHED_IMPORT` for resolving imports.
Multiple calls to global functions can be in a block without creating unneccessary diamond shapes in the control-flow graph.

Finally, we are now lifting the checks for safe execution environment to the start of the block and also skipping tag checks on type-annotated function arguments that are not being modified inside the function.

Load-store propagation was very effective for vectors so we extended it to upvalues, buffers and userdata.

Multiple upvalue lookups to the same slot can now be reused without reloading the memory.
We keep all the stores for now until we get new dead store optimizations, but we can still skip reloading the values that have just been stored outside.

To support this for buffer data, we had to introduce new instructions for properly truncating data.
For example, if you write `0xabcd` with `buffer.writei8`, you cannot just re-use the same value for a future read at that location, but need to truncate it to `0xcd`. And of course that might not be a constant value you can constant-fold.

Userdata is actually very similar to buffers, using the same IR instructions for access.
But with load-store propagation, we are able to remove temporary userdata allocation.
Custom userdata types with proper IR hooks can now generate code that is very efficient without having to be built-in.

In the future, we are looking to apply load-store propagation to table accesses.

Another area of optimization that we are looking into are optimizations around implicit integer values.
Operations like adding or subtracting integer numbers coming from buffers or `bit32` library results can now use integer CPU instructions automatically.
Additional optimizations around int/uint/double conversions lets us stay longer with those integer values as long as results perfectly match the ones that double numbers would give.

Other work we have done this year includes:
- Arithmetic optimization for basic identities like `1 * a`, `a * 2 => a + a` and others
- Optimization data now flows between separate basic blocks as long as they end up glued together in 1:1 relationship
- Unused GC object stores to VM registers can now be removed as long as no one will observe their death by garbage collection
- Float load/store has been separated from float/double conversion for better value reuse
- Constant information can be attached to IR registers instead of VM registers for values without a VM storage location
- Loop step value extraction optimization has been fixed to work in additional cases
- Optimization for register spills and handling of code with more live registers than can fit into CPU registers

We have a lot of work planned for improving native code generation next year!

## Community

A big thank you goes to our [open source community](https://github.com/luau-lang/luau) for their contributions over the year.
Some of the improvements that we have mention come directly from your PRs or your feedback! 
