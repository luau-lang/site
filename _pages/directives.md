---
permalink: /directives
title: Script directives
toc: true
---

[comment]: <> (please delete)
[comment]: <> (info on this page was pieced together from several devforum posts and oss messages from zeuxcg [🐐] and WheretIB [🐐] and reputable oss community members [🐐])
[comment]: <> (apologies if any info is outdated or was lost in translation)

Luau comes with script directives - comments placed at the top lines of code that modify the linter behavior or script performance.

## --!strict, nonstrict, nocheck

The `strict`, `nonstrict`, and `nocheck` directives modify the behavior of the Luau solver and how it produces type errors:

- `strict`, where we try to make sure that every single line of code you write is correct, and every value has a known type.
- `nonstrict`, where we type check the script but try to be lenient to allow commonly-seen patterns even if they may violate type safety.
- `nocheck`, where we don’t type check the script in question.

Dependending on the mode, the Luau solver tries to analyze your code *before* running, by assigning a type to each value based on what we know about how that value was produced, or based on the type you’ve explicitly told us using a new syntax extension, and can produce an error ahead of time:

```lua
--!nocheck

local x = 5
table.insert(x, 1) -- ok
```

```lua
--!nonstrict

local x = 5
table.insert(x, 1) -- ok
```

```lua
--!nonstrict

local x: number = 5
table.insert(x, 1) -- Type 'number' could not be converted into {number}
```

```lua
--!strict

local x = 5
table.insert(x, 1) -- Type 'number' could not be converted into {number}
```

## --!nolint

The `nolint` directive modifies the behavior of the linter and how it produces warnings:

Warnings produced by the linter can oftentimes be ignored. You can opt out of individual warnings on a script-by-script basis by adding a `--!nolint (NAME)` comment to the top of your scripts:

```lua
--!strict

getfenv(2) -- Function 'getfenv' is deprecated; consider using 'debug.info' instead
```

```lua
--!strict
--!nolint DeprecatedApi

getfenv(2) -- ok
```

Full details of `--!nolint` can be [found in the dedicated section](lint)

## --!native

The `native` directive compiles the source of your script's functions to native code, so the code you write runs faster:

It's best to enable this feature inside scripts that perform a lot of computation directly inside Luau. If you have a lot of mathematical operations on tables and especially `buffer` types, the script may benefit from `--!native`. However, it does not change the implementation of code that is already provided to your script by Luau libraries (such as `table.sort`).

Only the script's functions are compiled natively. The code in the top outer scope is often executed only once and doesn't benefit as much as functions that are called many times, especially those that are called every frame.

It's recommended that you measure the time a script or an operation takes with and without the `--!native` comment to judge when it's best to use it.

It may be tempting to place the `--!native` comment in every script just in case some of them will execute faster, but native code generation has some drawbacks:

- Code compilation time is required which can increase startup time.
- Extra memory is occupied to store natively compiled code.

```lua
--!native
--!optimize 2

local function goldenRatio() -- *is compiled into native code*
	return (1 + (5 ^ 0.5)) * 0.5
end
```

## --!optimize 0 | 1 | 2

The `optimize` directive controls the Luau optimization level used in Luau code:

- `--!optimize 0` `(-O0)`
	- disables all Luau optimizations

```lua
--!strict
--!optimize 0

local function Ten(): number
	return 5 + 5 -- `return 5 + 5` not folded
end

return Ten() -- 10
```

- `--!optimize 1` `(-O1)`
	- constant folding

```lua
--!strict
--!optimize 1

local function Ten(): number
	return 5 + 5 -- `return 5 + 5` folded to `return 10`
end

return Ten() -- 10
```

- `--!optimize 2` `(-O2)`
	- constant folding
	- function inlining
	- loop unrolling

```lua
--!strict
--!optimize 2

local function Double(n: number): number
	return (1 + 1) * n -- `return (1 + 1) * n` folded to `2 * n`
end

local function Twenty(): number
	local x = 0

	for i = 1, 4 do -- loop unrolled to 4 `x += i` instructions
		x += i
	end

	local y = Double(x) -- `y = Double(x)` inlined to `y = 2 * x`

	return y
end

return Twenty() -- 20
```

Exact optimizations depend on `--!optimize` level, aren't specified, and are subject to change.

Full details on how Luau optimizes your code can be [found in the dedicated section](performance)