---
layout: single
title:  "Luau Recap: November 2023"
---

Hi everyone!

The team is still quite busy working on some big updates that we hope to talk about soon, but we have some things to share in the meantime:

## Floor Division

Luau now has a floor division operator.  It is spelled `//`:

```lua
local a = 10 // 3 -- a == 3
a //= 2           -- a == 1
```

You can also overload this operator by implementing the `__idiv` metamethod.

## Analysis Improvements

The `break` and `continue` keywords can now be used in loop bodies to refine variables.

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

## Linter Improvements

In addition, when type information is present, this warning will be emitted when `#` or `ipairs` is used on a table that has no numeric keys or indexers. This helps avoid common bugs like using `#t == 0` to check if a dictionary is empty.

```lua
local message = { data = { 1, 2, 3 } }

if #message == 0 then -- Using '#' on a table without an array part is likely a bug
end 
```

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

* `string.format`'s handling of `%*` is now 1.5-2x faster
* Constant fold `math.pi` and `math.huge`
* Fix an oversight that could lead to `string.char` and `string.sub` generating potentially unlimited amounts of garbage and exhausting all available memory.
* We had a bug that could cause the compiler to unroll loops that it really shouldn't.  This could result in massive bytecode bloat.  It is now fixed.

## Native Code Generation

Native Code Generation is a feature we first rolled out in a beta test [toward the end of August](https://devforum.roblox.com/t/luau-native-code-generation-preview-studio-beta/2572587).

Since then, we've made some improvements:

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
