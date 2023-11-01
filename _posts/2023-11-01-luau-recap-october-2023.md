---
layout: single
title:  "Luau Recap: October 2023"
---

Happy Halloween! We're still quite busy working on some big type checking updates that we hope to talk about soon, but we have a few equally exciting updates to share in the meantime!

## Floor Division

Luau now has a floor division operator.  It is spelled `//`:

```lua
local a = 10 // 3 -- a == 3
a //= 2           -- a == 1
```

For numbers, `a // b` is equivalent to `math.floor(a / b)`, and you can also overload this operator by implementing the `__idiv` metamethod. The syntax and semantics are borrowed from Lua 5.3 (although Lua 5.3 has an integer type while we don't, we tried to match the behavior to be as close as possible).

## Native Codegen Preview

We are actively working on our new native code generation module that can significantly improve performance of compute-dense scripts by compiling them to X64 (Intel/AMD) or A64 (ARM) machine code and executing that natively. We aim to support all AArch64 hardware with the current focus being Apple Silicon (M1-M3) chips, and all Intel/AMD hardware that supports AVX1 (with no planned support for earlier systems). When the hardware does not support native code generation, any code that would be compiled as native just falls back to the interpreted execution.

When working with open-source releases, binaries now have native code generation support compiled in by default; you need to pass `--codegen` command line flag to enable it. If you use Luau as a library in a third-party application, you would need to manually link `Luau.CodeGen` library and call the necessary functions to compile specific modules as needed - or keep using the interpreter if you want to! If you work in Roblox Studio, we have integrated native code generation preview [as a beta feature](https://devforum.roblox.com/t/luau-native-code-generation-preview-studio-beta/2572587), which currently requires manual annotation of select scripts with `--!native` comment.

Our goal for the native code generation is to help reach ultimate performance for code that needs to process data very efficiently, but not necessarily to accelerate every line of code, and not to replace the interpreter. We remain committed to maximizing interpreted execution performance, as not all platforms will support native code generation, and it's not always practical to use native code generation for large code bases because it has a larger memory impact than bytecode. We intend for this to unlock new performance opportunities for complex features and algorithms, e.g. code that spends a lot of time working with numbers and arrays, but not to dramatically change performance on UI code or code that spends a lot of its time calling Lua functions like `table.sort`, or external C functions (like Roblox engine APIs).

Importantly, native code generation does not change our behavior or correctness expectations. Code compiled natively should give the same results when it executes as non-native code (just take a little less time), and it should not result in any memory safety or sandboxing issues. If you ever notice native code giving a different result from non-native code, please submit a bug report.

We continue to work on many code size and performance improvements; here's a short summary of what we've done in the last couple months, and there's more to come!

- Repeated access to table fields with the same object and name are now optimized (e.g. `t.x = t.x + 5` is faster)
- Numerical `for` loops are now compiled more efficiently, yielding significant speedups on hot loops
- Bit operations with constants are now compiled more efficiently on X64 (for example, `bit32.lshift(x, 1)` is faster); this optimization was already in place for A64
- Repeated access to array elements with the same object and index is now faster in certain cases
- Performance of function calls has been marginally improved on X64 and A64
- Fix code generation for some `bit32.extract` variants where we could produce incorrect results
- `table.insert` is now faster when called with two arguments as it's compiled directly to native code

## Analysis Improvements

The `break` and `continue` keywords can now be used in loop bodies to refine variables. This was contributed by a community member - thank you, [AmberGraceSoftware](https://github.com/AmberGraceSoftware)!

```lua
function f(objects: {{value: string?}})
    for _, object in objects do
        if not object.value then
            continue
        end
        
        local x: string = object.value -- ok!
    end
end
```

When type information is present, we will now emit a warning when `#` or `ipairs` is used on a table that has no numeric keys or indexers. This helps avoid common bugs like using `#t == 0` to check if a dictionary is empty.

```lua
local message = { data = { 1, 2, 3 } }

if #message == 0 then -- Using '#' on a table without an array part is likely a bug
end 
```

Finally, some uses of `getfenv`/`setfenv` are now flagged as deprecated. We do not plan to remove support for `getfenv`/`setfenv` but we actively discourage its use as it disables many optimizations throughout the compiler, runtime, and native code generation, and interferes with type checking and linting.

## Autocomplete Improvements

We used to have a bug that would arise in the following situation:

```lua
--!strict
type Direction = "Left" | "Right"
local dir: Direction = "Left"

if dir == ""| then
end
```

(imagine the cursor is at the position of the `|` character in the `if` statement)

We used to suggest `Left` and `Right` even though they are not valid completions at that position.  This is now fixed.

We've also added a complete suggestion for anonymous functions if one would be valid at the requested position.  For example:

```lua
local p = Instance.new('Part')
p.Touched:Connect(```

You will see a completion suggestion `function (anonymous autofilled)`.  Selecting that will cause the following to be inserted into your code:

```lua
local p = Instance.new('Part')
p.Touched:Connect(function(otherPart: BasePart)  end
```

We also fixed some confusing editor feedback in the following case:

```lua
game:FindFirstChild(
```

Previously, the signature help tooltip would erroneously tell you that you needed to pass a `self` argument.  We now correctly offer the signature `FindFirstChild(name: string, recursive: boolean?): Instance`

## Runtime Improvements

* `string.format`'s handling of `%*` and `%s` is now 1.5-2x faster
* `tonumber` and `tostring` are now 1.5x and 2.5x faster respectively when working on primitive types
* Compiler now recognizes `math.pi` and `math.huge` and performs constant folding on the expressions that involve these at `-O2`; for example, `math.pi*2` is now free.
* Compiler now optimizes `if...then...else` expressions into AND/OR form when possible (for example, `if x then x else y` now compiles as `x or y`)
* We had a few bugs around `repeat..until` statements when the `until` condition referred to local variables defined in the loop body. These bugs have been fixed.
* Fix an oversight that could lead to `string.char` and `string.sub` generating potentially unlimited amounts of garbage and exhausting all available memory.
* We had a bug that could cause the compiler to unroll loops that it really shouldn't.  This could result in massive bytecode bloat.  It is now fixed.

Lastly, a big thanks to our [open source community](https://github.com/luau-lang/luau) for their generous contributions:

* [MagelessMayhem](https://github.com/MagelessMayhem)
* [cassanof](https://github.com/cassanof)
* [LoganDark](https://github.com/LoganDark)
* [j-hui](https://github.com/j-hui)
* [xgqt](https://github.com/xgqt)
* [jdpatdiscord](https://github.com/jdpatdiscord)
* [Someon1e](https://github.com/Someon1e)
* [AmberGraceSoftware](https://github.com/AmberGraceSoftware)
* [RadiantUwU](https://github.com/RadiantUwU)
* [SamuraiCrow](https://github.com/SamuraiCrow)
