---
slug: getting-started
title: An introduction to Luau
sidebar:
  order: 1
---

Luau is a fast, small, safe, gradually typed embeddable scripting language derived from Lua 5.1. Luau ships as a command line tool for running, analyzing, and linting your Luau scripts, and is also integrated with Roblox Studio. Roblox developers should also visit our [Creator Docs Luau Section](https://create.roblox.com/docs/luau).

To get started with Luau, you can use the `luau` command line binary to run your code and `luau-analyze` to run static analysis (including type checking and linting). You can download these from [a recent release](https://github.com/luau-lang/luau/releases).

## Creating a script

To create your own testing script, create a new file with `.luau` as the extension:

```luau
--!hidden mode=nonstrict
function ispositive(x)
    return x > 0
end

print(ispositive(1))
print(ispositive("2"))

function isfoo(a)
    return a == "foo"
end

print(isfoo("bar"))
print(isfoo(1))
```

You can now run the file using `luau test.luau` and analyze it using `luau-analyze test.luau`.

Note that there are no warnings about calling ``ispositive()`` with a string, or calling ``isfoo()`` with a number. This is because Luau's type checking uses non-strict mode by default, which only reports errors if it's certain a program will error at runtime.

## Type checking

Now modify the script to include ``--!strict`` at the top:

```luau
--!strict

function ispositive(x)
    return x > 0
end

print(ispositive(1))
print(ispositive("2"))
```

We just mentioned ``nonstrict`` mode, where we only report errors if we can prove that a program will error at runtime. We also have ``strict`` mode, which will report errors if a program might error at runtime.

In this case, Luau will use the ``return x > 0`` statement to infer that ``ispositive()`` is a function taking a number and returning a boolean. Note that in this case, we were able to determine the type of `ispositive` without the presence of any explicit type annotations.

Based on Luau's type inference, the analysis tool will now flag the incorrect call to ``ispositive()``:

```
$ luau-analyze test.luau
test.luau(7,18): TypeError: Type 'string' could not be converted into 'number'
```

## Annotations

You can add annotations to locals, arguments, and function return types. Among other things, annotations can help enforce that you don't accidentally do something silly. Here's how we would add annotations to ``ispositive()``:

```luau
--!strict

function ispositive(x : number) : boolean
    return x > 0
end

local result : boolean
result = ispositive(1)

```

Now we've explicitly told Luau that ``ispositive()`` accepts a number and returns a boolean. This wasn't strictly (pun intended) necessary in this case, because Luau's inference was able to deduce this already. But even in this case, there are advantages to explicit annotations. Imagine that later we decide to change ``ispositive()`` to return a string value:

```luau
--!strict

function ispositive(x : number) : boolean
    if x > 0 then
        return "yes"
    else
        return "no"
    end
end

local result : boolean
result = ispositive(1)
```

Oops -- we're returning string values, but we forgot to update the function return type. Since we've told Luau that ``ispositive()`` returns a boolean (and that's how we're using it), the call site isn't flagged as an error. But because the annotation doesn't match our code, we get a warning in the function body itself:

```
$ luau-analyze test.luau
test.luau(5,9): TypeError: Type 'string' could not be converted into 'boolean'
test.luau(7,9): TypeError: Type 'string' could not be converted into 'boolean'
```

The fix is simple; just change the annotation to declare the return type as a string:

```luau
--!strict

function ispositive(x : number) : string
    if x > 0 then
        return "yes"
    else
        return "no"
    end
end

local result : boolean
result = ispositive(1)
```

Well, almost - since we declared ``result`` as a boolean, the call site is now flagged:

```
$ luau-analyze test.luau
test.luau(12,10): TypeError: Type 'string' could not be converted into 'boolean'
```

If we update the type of the local variable, everything is good. Note that we could also just let Luau infer the type of ``result`` by changing it to the single line version ``local result = ispositive(1)``.

```luau
--!strict

function ispositive(x : number) : string
    if x > 0 then
        return "yes"
    else
        return "no"
    end
end

local result : string
result = ispositive(1)
```

## Conclusions

This has been a brief tour of the basic functionality of Luau, but there's lots more to explore. If you're interested in reading more, check out our main reference pages for [syntax](/syntax) and [typechecking](/types).
