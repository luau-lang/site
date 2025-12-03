---
permalink: /typecheck/roblox
title: Roblox Types
toc: true
---

Roblox supports a rich set of classes and data types, [documented here](https://developer.roblox.com/en-us/api-reference). All of them are readily available for the type checker to use by their name (e.g. `Part` or `RaycastResult`).

When one type inherits from another type, the type checker models this relationship and allows to cast a subclass to the parent class implicitly, so you can pass a `Part` to a function that expects an `Instance`.

All enums are also available to use by their name as part of the `Enum` type library, e.g. `local m: Enum.Material = part.Material`.

We can automatically deduce what calls like `Instance.new` and `game:GetService` are supposed to return:

```lua
local part = Instance.new("Part")
local basePart: BasePart = part
```

Finally, Roblox types can be refined using `IsA`:

```lua
local function getText(x : Instance) : string
    if x:IsA("TextLabel") or x:IsA("TextButton") or x:IsA("TextBox") then
        return child.Text
    end
    return ""
end
```

Note that many of these types provide some properties and methods in both lowerCase and UpperCase; the lowerCase variants are deprecated, and the type system will ask you to use the UpperCase variants instead.
