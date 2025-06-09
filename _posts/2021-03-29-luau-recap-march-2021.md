---
layout: single
title:  "Luau Recap: March 2021"
---

It's been a busy month in Luau!

## Typed variadics

Luau supports *variadic* functions, meaning ones which can take a variable number of arguments (varargs!) but previously there was no way to specify their type. Now you can!
```
function f(x: string, ...: number)
  print(x)
  print(...)
end
f("hi")
f("lo", 5, 27)
```
This function takes a string, plus as many numbers as you like, but if you try calling it with anything else, you'll get a type error, for example `f("oh", true)` gives an error "Type `boolean` could not be converted into `number`"

Variadics can be used in function declarations, and function types, for example
```
type T = {
  sum: (...number) -> number
}
function f(x: T)
  print(x.sum(1, 2, 3))
end
```

## Generic functions

**WARNING** Generic functions are currently disabled as we're fixing some critical bugs.

## Typechecking improvements

We've made various improvements to the Luau typechecker:

* Check bodies of methods whose `self` has type `any`
* More precise types for `debug.*` methods
* Mutually dependent type aliases are now handled correctly

## Performance improvements

We are continuing to squeeze the performance out of all sorts of possible code; this is an ongoing process and we have many improvements in the pipeline, big and small. These are the changes that are already live:

* Significantly optimized non-variadic function calls, improving performance by up to 10% on call-heavy benchmarks
* Improve performance of `math.clamp`, `math.sign` and `math.round` by 2.3x, 2x and 1.6x respectively
* Optimized `coroutine.resume` with ~10% gains on coroutine-heavy benchmarks
* Equality comparisons are now a bit faster when comparing to constants, including `nil`; this makes some benchmarks 2-3% faster
* Calls to builtin functions like `math.abs` or `bit32.rrotate` are now significantly faster in some cases, e.g. this makes SHA256 benchmark 25% faster
* `rawset`, `rawget`, `rawequal` and 2-argument `table.insert` are now 40-50% faster; notably, `table.insert(t, v)` is now faster than `t[#t+1]=v`

Note that we work off a set of benchmarks that we consider representative of the wide gamut of code that runs on Luau. If you have code that you think should be running faster, never hesitate to open a feature request / bug report on Roblox Developer Forum!

## Debugger improvements

We continue to improve our Luau debugger and we have added a new feature to help with coroutine call debugging.
The call stack that is being displayed while stopped inside a coroutine frame will display the chain of threads that have called it.

Before:

!["Old debugger"]({{ site.url }}{{ site.baseurl }}/assets/images/luau-recap-march-2021-debug-before.png)

After:

!["New debugger"]({{ site.url }}{{ site.baseurl }}/assets/images/luau-recap-march-2021-debug-after.png)

We have restored the ability to break on all errors inside the scripts.
This is useful in cases where you need to track the location and state of an error that is triggered inside 'pcall'.
For example, when the error that's triggered is not the one you expected.

!["Break on all exceptions"]({{ site.url }}{{ site.baseurl }}/assets/images/luau-recap-march-2021-debug-dialog.png)

## Library changes

* Added the `debug.info` function which allows retrieving information about stack frames or functions; similarly to `debug.getinfo` from Lua, this accepts an options string that must consist of characters `slnfa`; unlike Lua that returns a table, the function returns all requested values one after another to improve performance.

## New logo

Luau now has a shiny new logo!

!["New logo!"]({{ site.url }}{{ site.baseurl }}/assets/images/luau.png)

## Coming soon...

* Generic variadics!
* Native Vector3 math with dramatic performance improvements!
* Better tools for memory analysis!
* Better treatment of cyclic requires during type checking!
* Better type refinements including nil-ability checks, `and`/`or` and `IsA`!
