---
layout: single
title:  "Luau Recap: November 2023"
---

Happy Halloween! We're still quite busy working on some big type checking updates that we hope to talk about soon, but we have a few equally exciting updates to share in the meantime!

## Floor Division

Luau now has a floor division operator.  It is spelled `//`:

```lua
local a = 10 // 3 -- a == 3
a //= 2           -- a == 1
```

For numbers, `a // b` is equivalent to `math.floor(a / b)`, and you can also overload this operator by implementing the `__idiv` metamethod. The syntax and semantics are borrowed from Lua 5.3 (although Lua 5.3 has an integer type while we don't, we tried to match the behavior to be as close as possible).

## Native Codegen Beta

We are actively working on our new native code generation module that can significantly improve performance of compute-dense scripts by compiling them to X64 (Intel/AMD) or A64 (ARM) machine code and executing that natively.

When working with open-source releases, all binaries now have native code generation support compiled in by default; you need to pass `--codegen` command line flag to enable it. We have also integrated native code generation into Roblox Studio [as a beta feature](https://devforum.roblox.com/t/luau-native-code-generation-preview-studio-beta/2572587), which requires manual annotation of select scripts with `--!native` comment.

Since then, we've made some improvements:

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
