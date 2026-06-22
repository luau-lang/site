---
slug: library
title: C API
description: The official reference for Luau's C API.
sidebar:
  order: 1
---

## Virtual Machine State

```c
lua_State* lua_newstate(lua_Alloc f, void* ud);
```

Create a new instance of the Luau VM, represented as a handle to the *main* Luau thread of execution.

* `f` - memory allocation function
* `ud` - custom data pointer for the allocation function

Most of the APIs will accept a Luau thread as a parameter.

```c
typedef void* (*lua_Alloc)(void* ud, void* ptr, size_t osize, size_t nsize);
```

Allocation function type.

* `ud` - the data pointer passed to `lua_newstate` at VM creation time
* `ptr` - pointer to reallocate or free when `osize` is not zero
* `osize` - old size of the object, 0 when new object is allocated
* `nsize` - new size of the object, 0 when object is to be freed

```c
lua_State* luaL_newstate(void);
```

Same as `lua_newstate` with the allocation function omitted.
Luau will use default `realloc` and `free` functions for memory management.

```c
lua_Alloc lua_getallocf(lua_State* L, void** ud);
```

Retrieves the allocation function and its data pointer.

* `ud` - pointer that will receive the custom data pointer for the allocation function. Ignored if `nullptr`.

```c
void lua_close(lua_State* L);
```

Destroy a Luau VM and all its threads of execution.

## Threads

In Luau, a thread represents a separate state of execution.
Multiple threads can be created, each executing their own Luau code.

It is important to note that these threads are not OS threads and are not executed in parallel.

```c
lua_State* lua_newthread(lua_State* L);
```

Creates a new thread of execution, placing it on top of the stack.

`userthread` callback will be called (see Callbacks section).

```c
lua_State* lua_mainthread(lua_State* L);
```

Returns the main thread of execution that the thread belongs to.
When called on main thread, returns itself.

```c
int lua_status(lua_State* L);
```

Returns the status `lua_Status` of the thread:

* `LUA_OK`
* `LUA_YIELD` - thread is currently yielded and can be resumed
* `LUA_ERRRUN` - thread has experienced a runtime error
* `LUA_ERRSYNTAX` - legacy error code, preserved for compatibility
* `LUA_ERRMEM` - thread has experienced an out of memory error
* `LUA_ERRERR` - thread has experienced an error during error handling
* `LUA_BREAK` - thread is currently waiting on a breakpoint and can be resumed

```c
void lua_resetthread(lua_State* L);
```

Reset the state of a thread for use to run new code.

Reset can only be made on threads that are not running and are not waiting for resume on yield/break.

```c
int lua_isthreadreset(lua_State* L);
```

Check if a thread has been reset or has not started executing any code yet.

```c
void lua_setthreaddata(lua_State* L, void* data);
```

Associate custom data with an individual thread.

```c
void* lua_getthreaddata(lua_State* L);
```

Retrieves the custom data associated with a specific thread.

---

Additional detail on manipulating threads on the Luau stack is described in the 'Coroutines' section.

## Loading Bytecode

```c
int luau_load(lua_State* L, const char* chunkname, const char* data, size_t size, int env);
```

Load bytecode into the VM.

* `chunkname` - a name to associate with the bytecode functions being loaded
* `data` - pointer to the bytecode
* `size` - bytecode size
* `env` - environment table to associate with loaded functions and to use when resolving imports

When `env` is 0, current thread environment table is used.

On success, returns 0 and places the top closure of the bytecode on the stack.
On failure, returns 1 and places a string with an error message on the stack.

TODO: explain environment tables
TODO: explain what imports are

---

See the `lua_call`/`lua_pcall` on how to run the resulting closure.

## Working with Stack

Stack manipulation is done within the stack area of the active call frame.
There is always an implicit top call frame present to use for arguments of the initial call of the thread.

Stack items can be selected using an index:

* Negative indices refer to items counting from the top (-1 is the top element, -2 is one below it)
* Positive indices refer to items counting from the base of the stack (useful for function arguments, where 1 is the first argument)
* 0 is not a valid stack index unless explicitly stated to carry a special meaning in the function description
* `LUA_REGISTRYINDEX` pseudo index of the global registry table
* `LUA_ENVIRONINDEX` pseudo index of the environment table
* `LUA_GLOBALSINDEX` pseudo index of the global table
* Function upvalues can be referred to using pseudo indices produced by the `lua_upvalueindex` function

```c
int lua_absindex(lua_State* L, int idx);
```

Converts a relative stack index (like -3) into an absolute stack index.
Absolute stack indices are useful to point to a specific stack slot while stack is being manipulated.

```c
int lua_upvalueindex(int i);
#define lua_upvalueindex(i) // Implemented as a macro
```

Returns the pseudo index to refer to a function upvalue.

```c
int lua_gettop(lua_State* L);
```

Returns the number of items on the stack.

```c
void lua_settop(lua_State* L, int idx);
```

Used to change the number of items on the stack.
If the stack grows, new items are set to `nil`, if it shrinks, extra items are discarded.

```c
void lua_pop(lua_State* L, int n);
#define lua_pop(L, n) // Implemented as a macro
```

Remove `n` elements from the top of the stack.

```c
void lua_pushvalue(lua_State* L, int idx);
```

Copy the item at the index and place it on top of the stack.

```c
void lua_remove(lua_State* L, int idx);
```

Remove the item at the index from the stack.
This shifts down the items previously above that index.

```c
void lua_insert(lua_State* L, int idx);
```

Take the item from the top of the stack and move it to the position at the given index.
This shifts up the items previously at and above that index, preserving the total number of stack items.

```c
void lua_replace(lua_State* L, int idx);
```

Pop the item from the top of the stack and replace the item at the index with it.

```c
void lua_xmove(lua_State* from, lua_State* to, int n);
```

Move `n` elements from the top of `from` thread to the top of `to` thread, popping them from the `from` thread.

```c
void lua_xpush(lua_State* from, lua_State* to, int idx);
```

Copy element at the index of the `from` thread to the top of the `to` thread, leaving the `from` stack unchanged.

```c
int lua_checkstack(lua_State* L, int sz);
```

Reserve space on the stack for `sz` items.
Returns 1 on success, and 0 if C stack limit is reached or no more memory for stack items can be allocated.

TODO: explain the C stack limit concept

```c
void lua_rawcheckstack(lua_State* L, int sz);
```

Reserve space on the stack for `sz` items, ignoring the C stack limit.
Not recommended for general use as unlike `lua_checkstack`, it can still error on memory allocation failure.

```c
void luaL_checkstack(lua_State* L, int sz, const char* msg);
```

Try to reserve space on the stack for `sz` items or throw a `"stack overflow ({msg})"` error.

## Type Inspection

Luau has the following value types, represented as `lua_Type` enumeration constants:

* `LUA_TNIL` - the `nil` value
* `LUA_TBOOLEAN` - a `boolean` value
* `LUA_TLIGHTUSERDATA` - a light userdata value
* `LUA_TNUMBER` - a `number` value, representing a double type
* `LUA_TINTEGER` - an `integer` value, representing a 64-bit integer type
* `LUA_TVECTOR` - a `vector` value, representing a 3 or 4 component (LUA_VECTOR_SIZE) type
* `LUA_TSTRING` - a `string` value
* `LUA_TTABLE` - a `table` value
* `LUA_TFUNCTION` - a function value
* `LUA_TUSERDATA` - a userdata value
* `LUA_TTHREAD` - a thread value
* `LUA_TBUFFER` - a buffer value
* `LUA_TCLASS` - a class value
* `LUA_TOBJECT` - an object value

There are additional enumeration values which are for internal use and are subject to change.

```c
int lua_type(lua_State* L, int idx);
```

Returns the type of the value at the index.

```c
const char* lua_typename(lua_State* L, int tp);
```

Returns the type of the object, which is one of `"nil"`, `"boolean"`, `"number"`, `"integer"`, `"vector"`, `"string"`, `"table"`, `"function"`, `"userdata"`, `"thread"`, `"buffer"`, `"class"` or `"object"`.
`"no value"` is returned if there is no value at the index.

```c
const char* luaL_typename(lua_State* L, int idx);
```

Returns the type of the object.
For userdata objects that have a metatable with the `__type` field and are defined by the host (not `newproxy`), returns the value for that key.
For tagged light userdata objects, returns either the value registered by `lua_setlightuserdataname` or `"userdata"`.
For userdata objects created by `newproxy`, this function returns `"userdata"` to make sure host-defined types can not be spoofed.
`"no value"` is returned if there is no value at the index.

```c
const void* lua_topointer(lua_State* L, int idx);
```

Converts the value at the index into an opaque C pointer.
Value can be a `string`, `userdata` (including light userdata), `table`, `function`, `thread`, `buffer`, `class` or `object`.
For other types returns `nullptr`.

The pointer can be used for debugging and cannot be converted back to a Luau object.

```c
int lua_objlen(lua_State* L, int idx);
```

Returns the size of the object at the index.

* for `string` - byte length
* for `table` - the raw length of the table, similar to `#` operator and ignoring the `__len` metamethod
* for `buffer` - the buffer size in bytes
* for `userdata` - the size of the userdata data block in bytes
* otherwise, the return value is 0

## Primitive types

```c
int lua_isnil(lua_State* L, int idx);
#define lua_isnil(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is `nil`.

```c
int lua_isboolean(lua_State* L, int idx);
#define lua_isboolean(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a boolean.

```c
int lua_isnumber(lua_State* L, int idx);
```

Returns 1 if the value at the index is a number or a string convertible to a number.

```c
int lua_isinteger64(lua_State* L, int idx);
```

Returns 1 if the value at the index is a 64-bit integer.

```c
int lua_isnone(lua_State* L, int idx);
#define lua_isnone(L, n) // Implemented as a macro
```

Returns 1 if there is no value at the index (out of range of the current stack).
This is useful to detect missing optional arguments of a function.

```c
int lua_isnoneornil(lua_State* L, int idx);
#define lua_isnoneornil(L, n) // Implemented as a macro
```

Returns 1 if there is no value at the index (out of range of the current stack) or it is `nil`.
This is useful to detect missing optional arguments of a function, when `nil` is also considered a missing value.

```c
int lua_toboolean(lua_State* L, int idx);
```

Returns 1 if the value at the index is truthy, meaning that it is not `false` and not `nil`.

```c
double lua_tonumberx(lua_State* L, int idx, int* isnum);
```

Converts value at the index to a double number.
If the value at the index is not a number and not a string convertible to a number, returns `0.0`.

* `isnum` - when not a `nullptr`, set to 1 when conversion was successful and 0 otherwise

```c
int lua_tointegerx(lua_State* L, int idx, int* isnum);
```

Converts value at the index to an integer number.
If the value at the index is not a number and not a string convertible to a number, returns `0`.

* `isnum` - when not a `nullptr`, set to 1 when conversion was successful and 0 otherwise

```c
unsigned lua_tounsignedx(lua_State* L, int idx, int* isnum);
```

Converts value at the index to an unsigned integer number.
If the value at the index is not a number and not a string convertible to a number, returns `0`.

* `isnum` - when not a `nullptr`, set to 1 when conversion was successful and 0 otherwise

```c
double lua_tonumber(lua_State* L, int idx);
#define lua_tonumber(L, i) // Implemented as a macro
```

Same as `lua_tonumberx` but does not provide information if the conversion was successful.

```c
int lua_tointeger(lua_State* L, int idx);
#define lua_tointeger(L, i) // Implemented as a macro
```

Same as `lua_tointegerx` but does not provide information if the conversion was successful.

```c
unsigned lua_tounsigned(lua_State* L, int idx);
#define lua_tounsigned(L, i) // Implemented as a macro
```

Same as `lua_tounsignedx` but does not provide information if the conversion was successful.

```c
int64_t lua_tointeger64(lua_State* L, int idx, int* isinteger);
```

Converts value at the index to a 64-bit integer number.
If the value at the index is not an `integer`, returns `0`.

* `isinteger` - when not a `nullptr`, set to 1 when conversion was successful and 0 otherwise

```c
void lua_pushnil(lua_State* L);
```

Places `nil` on top of the stack.

```c
void lua_pushboolean(lua_State* L, int b);
```

Places `boolean` value on top of the stack.
`true` if `b` is not zero and `false` otherwise.

```c
void lua_pushnumber(lua_State* L, double n);
```

Places a `number` value on top of the stack.

```c
void lua_pushinteger(lua_State* L, int n);
```

Places a `number` value on top of the stack, converting the 32-bit integer `n` into a double.

```c
void lua_pushunsigned(lua_State* L, unsigned n);
```

Places a `number` value on top of the stack, converting the 32-bit unsigned integer `n` into a double.

```c
void lua_pushinteger64(lua_State* L, int64_t n);
```

Places an `integer` value on top of the stack with the exact value of the 64-bit integer `n`.

## Strings

```c
int lua_isstring(lua_State* L, int idx);
```

Returns 1 if the value at the index is a string or a number.

```c
const char* lua_tolstring(lua_State* L, int idx, size_t* len);
```

Converts the `string` or `number` at the index to a string pointer.

Note: if the value on the stack is a `number`, it is coerced to a `string` value, changing the value at the index.

* `len` - when not a `nullptr`, set to the length of the string

```c
const char* lua_tostring(lua_State* L, int idx);
#define lua_tostring(L, i) // Implemented as a macro
```

Same as `lua_tolstring`, but does not provide the length of the string.

```c
const char* lua_tolstringatom(lua_State* L, int idx, size_t* len, int* atom);
```

Converts the string at the index to a string pointer.
Unlike `lua_tolstring`, number values will not be converted.

* `len` - when not a `nullptr`, set to the length of the string
* `atom` - when not a `nullptr`, set to the 'atom' identifier of the string, set by `useratom` callback

```c
const char* lua_tostringatom(lua_State* L, int idx, int* atom);
```

Same as `lua_tolstringatom`, but does not provide the length of the string.

```c
const char* lua_namecallatom(lua_State* L, int* atom);
```

When a method is invoked using Luau's `__namecall` metamethod (for `obj:method(args)` on userdata), this function returns the name of the method being called.
Should only be used inside the C metamethod implementation, otherwise the value is unspecified.

* `atom` - when not a `nullptr`, set to the 'atom' identifier of the string, set by `useratom` callback

```c
void lua_pushlstring(lua_State* L, const char* s, size_t l);
```

Place a `string` value of string `s` with length `l` on top of the stack.
`s` cannot be a `nullptr`.

```c
void lua_pushstring(lua_State* L, const char* s);
```

Place a `string` value of string `s` with `strlen(s)` length on top of the stack.
Unlike similar methods, if `s` is `nullptr`, `nil` value is placed instead.

```c
const char* lua_pushfstringL(lua_State* L, const char* fmt, ...);
```

Place a `string` value on the top of the stack using `printf`-like formatted string `fmt`.
Returns the string pointer of the result.

```c
const char* lua_pushvfstring(lua_State* L, const char* fmt, va_list argp);
```

Place a `string` value on the top of the stack using `printf`-like formatted string `fmt` and the C variadic parameter wrapper `argp`.
Returns the string pointer of the result.

```c
#define lua_pushliteral(L, s)
```

Place a `string` value of string literal `s`.
Length will be calculated based on the literal, skipping a call to `strlen`.

```c
int lua_strlen(lua_State* L, int idx);
#define lua_strlen(L, i) // Implemented as a macro
```

Same as `lua_objlen`, for code compatibility with an older Lua API.
Note that it works on all value types and not only strings.

```c
const char* lua_pushfstring(lua_State* L, const char* fmt, ...);
#define lua_pushfstring(L, fmt, ...) // Implemented as a macro
```

Same as `lua_pushfstringL`, for code compatibility with an older Lua API.

```c
void lua_concat(lua_State* L, int n);
```

Concatenate top `n` elements on the stack into a string, similar to applying operator `..` on all the elements.
This pops `n` elements from the stack and pushes the result on top.
When `n` is 0, no elements are popped and an empty string is pushed on the top.

## Vectors

```c
int lua_isvector(lua_State* L, int n);
#define lua_isvector(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a vector.

```c
const float* lua_tovector(lua_State* L, int idx);
```

Converts the `vector` at the index to a pointer to the components of the vector.
Returns a `nullptr` if the value is not a `vector`.

```c
void lua_pushvector(lua_State* L, float x, float y, float z, float w); // LUA_VECTOR_SIZE is 4
void lua_pushvector(lua_State* L, float x, float y, float z); // LUA_VECTOR_SIZE is 3
```

Place a `vector` value with the components `x`, `y`, `z` and `w` (when `LUA_VECTOR_SIZE` is 4) on the top of the stack.

## Buffers

```c
int lua_isbuffer(lua_State* L, int n);
#define lua_isbuffer(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a buffer.

```c
void* lua_tobuffer(lua_State* L, int idx, size_t* len);
```

Converts the `buffer` at the index to a pointer to its data.
Returns a `nullptr` if the value is not a `buffer`.

* `len` - when not a `nullptr`, set to the size of the buffer

```c
void* lua_newbuffer(lua_State* L, size_t sz);
```

Creates a new `buffer` value of size `sz` and places it on the top of the stack.
Buffer data is zero-initialized.
Returns the pointer to the buffer's data.

## Functions

```c
int lua_iscfunction(lua_State* L, int idx);
```

Returns 1 if the value at the index is a C function.

```c
int lua_isLfunction(lua_State* L, int idx);
```

Returns 1 if the value at the index is a Luau function.

```c
int lua_isfunction(lua_State* L, int n);
#define lua_isfunction(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a C or Luau function.

```c
lua_CFunction lua_tocfunction(lua_State* L, int idx);
```

Converts the C function at the index to a C function pointer.
Returns a `nullptr` if the value is not a C function.

```c
void lua_pushcclosurek(lua_State* L, lua_CFunction fn, const char* debugname, int nup, lua_Continuation cont);
```

Creates a `function` from a C function pointer and places it on top of the stack.

* `fn` - pointer to the C function, cannot be a `nullptr`
* `debugname` - optional name to be associated with the function
* `nup` - number of upvalues that the function has
* `cont` - C continuation function; optional unless the C function wants to support yielding

When `nup` is not zero, the specified number of upvalues are popped from the stack to be stored in the function object.

Important: Luau does not preserve the `debugname`, the pointer lifetime has to encompass the lifetime of the VM.

```c
void lua_pushcclosure(lua_State* L, lua_CFunction fn, const char* debugname, int nup);
#define lua_pushcclosure(L, fn, debugname, nup) // Implemented as a macro
```

Same as `lua_pushcclosurek`, but does not support the C continuation function.

```c
void lua_pushcfunction(lua_State* L, lua_CFunction fn, const char* debugname);
#define lua_pushcfunction(L, fn, debugname) // Implemented as a macro
```

Same as `lua_pushcclosure`, but does not use upvalues.

```c
void lua_clonefunction(lua_State* L, int idx);
```

Clones the function at the specified index and places it on the stack.
The function can only be used on Luau functions.
The cloned function environment is set to the current thread's globals table, while upvalues are copied over.

## Tables

```c
int lua_istable(lua_State* L, int n);
#define lua_istable(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a table.

```c
void lua_createtable(lua_State* L, int narr, int nrec);
```

Creates a table with a reserved number of array and hash slots and places it on the stack.

* `narr` - number of array elements. Cannot be negative.
* `nrec` - number of hash elements (records). Cannot be negative.

Note that the implementation might reserve a larger number of elements than requested.

```c
void lua_newtable(lua_State* L);
#define lua_newtable(L) // Implemented as a macro
```

Creates an empty table and places it on the stack.

```c
int lua_gettable(lua_State* L, int idx);
```

Looks up data in a value at the index using the key on top of the stack.
Lookup key is removed from the stack and result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method respects the `__index` metamethod and can be used on values of non-table types.

```c
int lua_rawget(lua_State* L, int idx);
```

Looks up data in a table at the index using the key on top of the stack.
Lookup key is removed from the stack and result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method ignores the metatable and can only be used on table values.

```c
int lua_getfield(lua_State* L, int idx, const char* k);
```

Looks up data in a value at the index using a string key.
Result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method respects the `__index` metamethod and can be used on values of non-table types.

```c
int lua_rawgetfield(lua_State* L, int idx, const char* k);
```

Looks up data in a table at the index using a string key.
Result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method ignores the metatable and can only be used on table values.

```c
int lua_rawgeti(lua_State* L, int idx, int n);
```

Looks up data in a table at the index using a numeric index.
Result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method ignores the metatable and can only be used on table values.

```c
int lua_rawgetptagged(lua_State* L, int idx, void* p, int tag);
```

Looks up data in a table at the index using a lightuserdata pointer and a tag.
Result is placed on top of the stack.
Return value is the type tag of the value (`nil` if it was not found).

This method ignores the metatable and can only be used on table values.

```c
int lua_rawgetp(lua_State* L, int idx, void* p);
#define lua_rawgetp(L, idx, p) // Implemented as a macro
```

Same as `lua_rawgetptagged`, but with a default `tag` value of 0.

```c
void lua_settable(lua_State* L, int idx);
```

Takes two items, the key and data from the top of the stack (data at the top).
Assigns the data to the key in the value at the index.
Key and data are removed from the stack.

This method respects the `__newindex` metamethod and can be used on values of non-table types.
This method throws an error if used on a read-only table and the assignment is not handled by `__newindex`.

```c
void lua_rawset(lua_State* L, int idx);
```

Takes two items, the key and data from the top of the stack (data at the top).
Assigns the data to the key in the value at the index.
Key and data are removed from the stack.

This method ignores the metatable and can only be used on table values.
This method throws an error if used on a read-only table.

```c
void lua_setfield(lua_State* L, int idx, const char* k);
```

Assigns the data on top of the stack to the string key in the value at the index.
Data is removed from the stack.

This method respects the `__newindex` metamethod and can be used on values of non-table types.
This method throws an error if used on a read-only table and the assignment is not handled by `__newindex`.

```c
void lua_rawsetfield(lua_State* L, int idx, const char* k);
```

Assigns the data on top of the stack to the string key in the value at the index.
Data is removed from the stack.

This method ignores the metatable and can only be used on table values.
This method throws an error if used on a read-only table.

```c
void lua_rawseti(lua_State* L, int idx, int n);
```

Assigns the data on top of the stack to the numeric index key in the value at the index.
Data is removed from the stack.

This method ignores the metatable and can only be used on table values.
This method throws an error if used on a read-only table.

```c
void lua_rawsetptagged(lua_State* L, int idx, void* p, int tag);
```

Assigns the data on top of the stack to the lightuserdata and tag key in the value at the index.
Data is removed from the stack.

This method ignores the metatable and can only be used on table values.
This method throws an error if used on a read-only table.

```c
void lua_rawsetp(lua_State* L, int idx, void* p);
#define lua_rawsetp(L, idx, p) // Implemented as a macro
```

Same as `lua_rawsetptagged`, but with a default `tag` value of 0.
This method throws an error if used on a read-only table.

```c
int lua_getmetatable(lua_State* L, int idx);
```

Looks up a metatable assigned to a value and if found, places it on top of the stack.
Returns 1 on success and 0 on failure.

Tables and userdata values can have individual metatables assigned.
For values of other types, a global metatable for the values of that type is returned.

This method bypasses the locked metatables (`__metatable` set) and returns them regardless of that field.

```c
int lua_setmetatable(lua_State* L, int idx);
```

Takes a table or `nil` value on top of the stack and assigns it as the metatable of the value at the index.
Value is removed from the stack.

Tables and userdata values have individual metatables.
For values of other types, a global metatable is set for all values of that type.

This method throws an error if used on a read-only table.

```c
void lua_setreadonly(lua_State* L, int idx, int enabled);
```

Marks the table at the index as read-only.
When set to read-only, future modifications of the table will throw an error.

This method cannot be used on the registry table.

```c
int lua_getreadonly(lua_State* L, int idx);
```

Returns 1 if the table at the index is read-only and 0 otherwise.

```c
void lua_cleartable(lua_State* L, int idx);
```

Removes all keys and values from the table at the index.
Metatable value is preserved.

This method throws an error if used on a read-only table.

```c
void lua_clonetable(lua_State* L, int idx);
```

Creates a copy of the table at the index and places it at the top of the stack.

Array elements and hash key/values are copied over without a deep clone.
Metatable is copied without a deep clone.
If the original was read-only, the copy becomes read-write again.
If the original was used as an environment table and marked as 'sandboxed', the copy loses that property.

```c
int lua_next(lua_State* L, int idx);
```

Finds a key that comes after the key on top of the stack and looks up the corresponding value.
Key is removed from the top of the stack.

Function ignores the `__iter` metamethod.

If the next key exists, pushes the next key, followed by the associated value to the stack and returns 1.
If there is no next key, return value is 0.

To begin an iteration of table elements, use the `nil` as the starting key.

```c
// in this table iteration example, table is initially at stack index -1
lua_pushnil(L);

while (lua_next(L, -2) != 0)
{
    // value at stack index -2 is now the key
    // value at stack index -1 is now the value

    lua_pop(L, 1); // remove the value, but keep the key
}

// the table we started with is at -1 index again
```

If the key is not `nil` and does not exist in the table, an error will be thrown.

Note: if the key is a numerical index, you might not get an error thrown if it is missing. This behavior should not be relied upon.

```c++
int lua_rawiter(lua_State* L, int idx, int iter);
```

Helper to perform 'raw' iteration of elements of a table at the index.

Function ignores the `__iter` metamethod.

To start, call the function with an `iter` value of 0. `iter` cannot be a negative number.

If there is an element at the specified iteration index:

* key and then the associated value will be placed on top of the stack
* function returns the next iteration index

If there are no more elements:

* stack is left unmodified
* function returns -1

```c++
// in this raw table iteration example, table is initially at stack index -1
for (int iter = 0; (iter = lua_rawiter(L, -1, iter)) != -1;)
{
    // value at stack index -2 is now the key
    // value at stack index -1 is now the value

    lua_pop(L, 2); // remove both key and value
}

// the table we started with is at -1 index again
```

## Light Userdata

`lightuserdata` values are used for external pointers that have no special meaning to Luau VM.

These values can be associated with an optional 'tag'.
`tag` has to be non-negative and lower than `LUA_LUTAG_LIMIT`, defined in `luaconf.h`.

A `lightuserdata` tag can be assigned a name which will be returned by `typeof`.

```c
int lua_islightuserdata(lua_State* L, int n);
#define lua_islightuserdata(L, n) // Implemented as a macro
```

Returns 1 if the value at the index is a `lightuserdata`.

```c
void* lua_tolightuserdatatagged(lua_State* L, int idx, int tag);
```

Converts the `lightuserdata` at the index to a lightuserdata pointer.
Returns a `nullptr` if the value is not a `lightuserdata` or if the `lightuserdata` tag is not equal to `tag`.

```c
void* lua_tolightuserdata(lua_State* L, int idx);
```

Converts the `lightuserdata` at the index to a lightuserdata pointer.
Returns a `nullptr` if the value is not a `lightuserdata`.
Tag value of the `lightuserdata` is ignored.

```c
void lua_pushlightuserdatatagged(lua_State* L, void* p, int tag);
```

Place a `lightuserdata` value `p` with tag `tag` on top of the stack.

```c
void lua_pushlightuserdata(lua_State* L, void* p);
#define lua_pushlightuserdata(L, p) // Implemented as a macro
```

Same as `lua_pushlightuserdatatagged` with a default `tag` of 0.

```c
int lua_lightuserdatatag(lua_State* L, int idx);
```

Returns the tag associated with a `lightuserdata` value at the index.
If the value at the index is not a `lightuserdata`, returns -1.

```c
void lua_setlightuserdataname(lua_State* L, int tag, const char* name);
```

Associate `lightuserdata` tag with a `name`.
Name cannot be reassigned.

```c
const char* lua_getlightuserdataname(lua_State* L, int tag);
```

Get the name associated with the `lightuserdata` tag.
If a name was not associated, returns `nullptr`.

## Userdata

Userdata values are used to hold host data with lifetime managed by Luau.
Userdata can have a metatable to enable custom behaviors of the value.

These values can be associated with an optional 'tag'.
`tag` has to be non-negative and lower than `LUA_UTAG_LIMIT`, defined in `luaconf.h`.

These values can also have an optional destructor that is called when the object is garbage-collected.
Destructor can either be associated with a tag (shared between all userdata values of that tag) or a specific userdata value.

Interactions with Luau VM from a destructor must be limited as callbacks are called from the garbage-collection stage.
Our recommendation is to only look up `lua_getthreaddata` for associated host data and postpone any additional cleanup to a later Luau VM resume point.

Note: when specified, `userdata` functions can work on `lightuserdata` values as well.

```c
int lua_isuserdata(lua_State* L, int idx);
```

Returns 1 if the value at the index is a `userdata` or `lightuserdata`.

```c
void* lua_touserdatatagged(lua_State* L, int idx, int tag);
```

Converts the `userdata` at the index to a userdata data pointer.
Returns a `nullptr` if the value is not a `userdata` or if the `userdata` tag is not equal to `tag`.

```c
void* lua_touserdata(lua_State* L, int idx);
```

Converts the `userdata` or `lightuserdata` at the index to a pointer.
Returns a `nullptr` if the value is not a `userdata` or `lightuserdata`.
Tag value of the corresponding object is ignored.

```c
int lua_userdatatag(lua_State* L, int idx);
```

Retrieves the tag value associated with the `userdata` at the index.
Returns -1 if the value is not a `userdata`.

```c
void* lua_newuserdatatagged(lua_State* L, size_t sz, int tag);
```

Places a new `userdata` object with the data size `sz` and the specified tag on top of the stack.
Returns the pointer to the start of the data.

```c
void* lua_newuserdata(lua_State* L, size_t sz);
#define lua_newuserdata(L, s) // Implemented as a macro
```

Same as `lua_newuserdatatagged` with a tag of 0.

```c
void* lua_newuserdatataggedwithmetatable(lua_State* L, size_t sz, int tag);
```

Places a new `userdata` object with the data size `sz` and the specified tag on top of the stack.
`userdata` value is assigned a metatable previously set by `lua_setuserdatametatable`.
Returns the pointer to the start of the data.

This function cannot be used if the metatable was not associated with the tag.

```c
void* lua_newuserdatadtor(lua_State* L, size_t sz, void (*dtor)(void*));
```

Places a new `userdata` object with the data size `sz` on top of the stack.
A custom destructor C function is assigned to the value.
Returns the pointer to the start of the data.

Destructor C function cannot be a `nullptr`.

```c
void lua_setuserdatatag(lua_State* L, int idx, int tag);
```

Assigns the new tag value to a `userdata` at the index.

This function should not be used on `userdata` created with `lua_newuserdatadtor`.

```c
void lua_setuserdatadtor(lua_State* L, int tag, lua_Destructor dtor);
```

Sets the destructor function to use when `userdata` with the specified tag is garbage-collected.
Destructor of the value can be reassigned or set to `nullptr`.

```c
lua_Destructor lua_getuserdatadtor(lua_State* L, int tag);
```

Gets the destructor function associated with `userdata` values with the specified tag.
If the destructor was not set, returns a `nullptr`.

```c
void lua_setuserdatametatable(lua_State* L, int tag);
```

Takes a table from the top of the stack and sets it as a metatable to be used by `lua_newuserdatataggedwithmetatable`.
Table is popped from the stack.

Metatable for each tag can only be set once.

```c
void lua_getuserdatametatable(lua_State* L, int tag);
```

Retrieves the metatable associated with the userdata tag and places it on top of the stack.
If a table was not associated, `nil` is placed instead.

### Direct userdata metamethod calls (experimental)

```c
int lua_registeruserdatadirectaccess(
    lua_State* L,
    int tag,
    lua_UserdataDirectAccess get,
    lua_UserdataDirectAccess set,
    lua_UserdataDirectNamecall namecall
);
```

To improve performance of interactions with `userdata` through metamethods like `__index`, `__newindex` and `__namecall`, Luau implements an access speedup mechanism.
This function associates optional C function callbacks that can be used by Luau VM when a userdata access through metamethods above is detected.

For a member access to be detected, the member name string has to be associated with an atom value.

Each VM instruction making the access contains 16 bits of storage for a user value.
It is important to note that the storage is associated with an instruction and not a specific userdata value or tag encountered at the instruction.
As different userdata values can be encountered at the same location of the program, a value stored for userdata of one tag can be retrieved for another.

```c
typedef void (*lua_UserdataDirectAccess)(lua_State* L, void* data, int atom, uint16_t* cachedslot, int utag);
```

For `get` (`__index`) and `set` (`__newindex`) operations, this function will receive:

* `data` - userdata data pointer
* `atom` - atom value associated with the accessed member name
* `cachedslot` - pointer to a custom 16 bits of data associated with a specific access instruction
* `utag` - userdata tag

The function is called with the same arguments as an `__index` or `__newindex` metamethod - VM APIs can be used freely.

`get` function must push the result on top of the stack, only one return value is taken, other values are ignored.

```c
typedef int (*lua_UserdataDirectNamecall)(lua_State* L, void* data, int atom, uint16_t* cachedslot, int utag);
```

For a `namecall` (`__namecall` method invocation) operation, this function will receive:

* `data` - userdata data pointer
* `atom` - atom value associated with the accessed member name
* `cachedslot` - pointer to a custom 16 bits of data associated with a specific access instruction
* `utag` - userdata tag

The function is called with the same arguments as a `__namecall` metamethod - VM APIs can be used freely.

Return value is the number of results from a method or a yield marker if `lua_yield` is returned.

### Direct userdata field access (experimental)

```c
void lua_registeruserdatadirectfieldget(lua_State* L, int tag, const char* field, lua_UserdataDirectFieldGet fn);
```

To improve performance of reading `userdata` fields which are retrieved through `__index` metamethod, Luau implements an access speedup mechanism.
This function associates an optional C function callback that can be used by Luau VM when a userdata field read access is detected.

Unlike `lua_registeruserdatadirectaccess`:

* the `field` string does not have to be associated with an atom value
* the environment of the function is restricted: it can only return the results through functions described below without any other VM interaction

Field name cannot be a `nullptr`.
Callback function cannot be a `nullptr`.

```c
typedef void (*lua_UserdataDirectFieldGet)(void* ud, void* result);
```

Callback C function.

* `ud` - userdata data pointer
* `result` - VM-specific pointer to be provided as is to the result provider functions.

```c
void lua_userdatadirectfield_setnumber(void* result, double n);
```

Set a `number` return value.

```c
void lua_userdatadirectfield_setvector(void* result, float x, float y, float z, float w); // LUA_VECTOR_SIZE is 4
void lua_userdatadirectfield_setvector(void* result, float x, float y, float z); // LUA_VECTOR_SIZE is 3
```

Set a `vector` return value.

```c
void lua_userdatadirectfield_setboolean(void* result, int b);
```

Set a `boolean` return value.

```c
void lua_userdatadirectfield_setinteger64(void* result, int64_t n);
```

Set an `integer` return value.

```c
void lua_userdatadirectfield_setnil(void* result);
```

Set a `nil` return value.

## Classes (experimental)

```c
int lua_isclass(lua_State* L, int idx);
#define lua_isclass(L, idx) // Implemented as a macro
```

Returns 1 if the value at the index is a class.

```c
int lua_isobject(lua_State* L, int idx);
#define lua_isobject(L, idx) // Implemented as a macro
```

Returns 1 if the value at the index is an object.

## Making calls

```c
void lua_call(lua_State* L, int nargs, int nresults);
```

Performs a call to a function.

The function or a callable value has to be placed on the stack, followed by `nargs` argument values.
Both the function and arguments are removed from the top of the stack.
The specified number of return values `nresults` is placed on top of the stack.

If call returns fewer than `nresults` values, additional `nil` values will be used to fill in missing returns.
If call returns more than `nresults` values, extra results will be removed from the stack.

`nresults` can be a `LUA_MULTRET` value, specifying a variable number of returns.
In this case, stack will contain the number of values returned from the call without adjustment.

If the call throws an error, it will propagate out of the function.
If a protected environment has not been established by an outer `lua_pcall`/`lua_cpcall` or `lua_resume`:

* If VM is built with `LUA_USE_LONGJMP`:
  * `panic` callback will be called
  * if there is no `panic` handler or `panic` handler doesn't jump away, an `abort` will be called
* If VM is built without `LUA_USE_LONGJMP`:
  * internal `std::exception` of an internal derived type will be thrown


```c
int lua_pcall(lua_State* L, int nargs, int nresults, int errfunc);
```

Similar to `lua_call`, but performs a call in a new protected environment, similar to Luau's `pcall`/`xpcall` functions.
Returns the status of the call, see the description of `lua_status`.

Additional `errfunc` argument can be specified with an index of the error handling callback function.
When `errfunc` is not 0, if an error occurs, this error handling function will be called, similar to Luau's `xpcall` function.
When `errfunc` is 0, the error value passes through unchanged.

If an error occurred, the error object will be placed on the stack.

We do not recommend using an `errfunc` index pointing into the arguments of the call being performed.

```c
int lua_cpcall(lua_State* L, lua_CFunction func, void* ud);
```

Performs a C function call in a new protected environment.
Function receives the specified `ud` pointer as its first argument (a `lightuserdata`).
Returns the status of the call, see the description of `lua_status`.

Return values placed on the stack are discarded.

Function pointer `func` cannot be a `nullptr`.

This function can be used to work with Luau APIs when protected environment has not been established yet.

## Comparisons

```c
int lua_equal(lua_State* L, int idx1, int idx2);
```

Compares two values at the specified indices for equality (as if `==` was used in Luau).
Returns 1 if equal and 0 otherwise.

```c
int lua_rawequal(lua_State* L, int idx1, int idx2);
```

Compares two values at the specified indices for raw equality (as if `rawequal` was used in Luau).
Returns 1 if equal and 0 otherwise.

Raw equality means that metamethods are ignored.

```c
int lua_lessthan(lua_State* L, int idx1, int idx2);
```

Compares two values at the specified indices for the first one being less than the other (as if `<` was used in Luau).
Returns 1 if first value is less than the second and 0 otherwise.

## Globals and environments

```c
void lua_setglobal(lua_State* L, const char* s);
#define lua_setglobal(L, s) // Implemented as a macro
```

Same as `lua_setfield` when called on the global table value (`LUA_GLOBALSINDEX`).

```c
int lua_getglobal(lua_State* L, const char* s);
#define lua_getglobal(L, s) // Implemented as a macro
```

Same as `lua_getfield` when called on the global table value (`LUA_GLOBALSINDEX`).
Return value is the type tag of the value (`nil` if it was not found).

```c
void lua_getfenv(lua_State* L, int idx);
```

Gets the environment table of the value at index and places it on top of the stack.

Environment tables can be associated with functions and threads.
For values of other types, result is `nil`.

```c
int lua_setfenv(lua_State* L, int idx);
```

Sets the environment table for the value at index using the table on top of the stack.
Table is popped from the stack.

Environment tables can be associated with functions and threads.
Returns 1 if the assignment was successful and 0 otherwise.

## Coroutines

```c
int lua_isthread(lua_State* L, int idx);
#define lua_isthread(L, idx) // Implemented as a macro
```

Returns 1 if the value at the index is a `thread`.

```c
lua_State* lua_tothread(lua_State* L, int idx);
```

Converts the `thread` value at index to a `lua_State` pointer.
Returns a `nullptr` if the value is not a `thread`.

```c
int lua_pushthread(lua_State* L);
```

Pushes the current thread on top of its own stack.
Returns 1 if the thread is the main thread of the VM and 0 otherwise.

Use this function to obtain a `thread` value of the currently executing thread.

```c
int lua_resume(lua_State* L, lua_State* from, int narg);
```

Resumes the execution of a thread.

If the thread has not been executing code, execution starts by calling the function followed by `narg` arguments on top of the stack.
The function and arguments are removed from the stack.
If the thread was yielded or stopped on a breakpoint, resumes the execution of the top function with `narg` values returned from the yielded function.

Returns the status of the thread, see the description of `lua_status`.

* `from` - optional value of a thread which performed the resume of the thread, used *only* to determine the depth of the C call stack in the resume chain

```c
int lua_resumeerror(lua_State* L, lua_State* from);
```

Resumes the execution of a thread with an error.

Used for cases where resuming a yielded thread needs to report an error from the call that has yielded before.
Error object is taken from the top of the stack.

Returns the status of the thread, see the description of `lua_status`.

* `from` - optional value of a thread which performed the resume of the thread, used *only* to determine the depth of the C call stack in the resume chain

```c
int lua_isyieldable(lua_State* L);
```

Returns 1 if the thread can yield and 0 otherwise.

Yielding might not be possible if there are non-yieldable C functions or metamethods on the call stack.

```c
int lua_yield(lua_State* L, int nresults);
```

Marks the thread as yielded with `nresults` values from the top of the stack.
Returns an internal value representing thread yield flag.

Throws an error if `lua_isyieldable` is 0.

The yield itself does not happen when function is called, the value it returns has to be used as the result of a C function that was called by Luau:

```c
int foo(lua_State* L)
{
    ...

    return lua_yield(L, nresults);
}
```

```c
int lua_break(lua_State* L);
```

Marks the thread as stopped on a debug break.
Returns an internal value representing thread yield flag.

Function is intended to be used from debug callbacks which should return the result value for the VM to interrupt the execution.

In Luau, such debug breaks are only supported in yieldable contexts.
The function throws an error if `lua_isyieldable` is 0.

After a debug break, VM can still be used to resume other threads (and explore the state of stopped threads).

Debuggers can still choose to not use `lua_break` and treat debug callbacks as hooks used to explore the state of the VM without returning.

```c
int lua_costatus(lua_State* L, lua_State* co);
```

Returns the 'coroutine' status `lua_CoStatus` of the thread `co`.
The status is reported with respect to the currently executing thread.

* `LUA_CORUN` - coroutine is currently running
* `LUA_COSUS` - coroutine is currently suspended on a yield
* `LUA_CONOR` - coroutine is running, but is not the current thread of execution
* `LUA_COFIN` - coroutine execution has completed
* `LUA_COERR` - coroutine execution has completed with an error

Note: threads that have yielded on a debug break are considered to be `LUA_CONOR`.

## Registry References

Luau VM provides a registry table where objects can be pinned and associated with an integer index for later reference.

These references prevent the objects from being garbage-collected until they are released with `lua_unref`.

```c
#define LUA_NOREF -1
```

A constant that can be used to represent an invalid reference.

```c
#define LUA_REFNIL 0
```

A constant for a reference representing the `nil` value.

```c
int lua_ref(lua_State* L, int idx);
```

Creates a reference for the value at index.
Returns the reference or `LUA_REFNIL` if the value was `nil`.

Value remains on the stack.

`idx` cannot be an index to the registry.

```c
void lua_unref(lua_State* L, int ref);
```

Removes the specified reference from the registry.
`LUA_NOREF` and `LUA_REFNIL` are safe to use as they have no effect.

```c
int lua_getref(lua_State* L, int ref);
#define lua_getref(L, ref) // Implemented as a macro
```

Places the object referred by the reference on top of the stack.
Return value is the type tag of the value (`nil` if the reference is `LUA_REFNIL` or is invalid).

## Garbage Collection

```c
int lua_gc(lua_State* L, int what, int data);
```

## Memory

```c
void lua_setmemcat(lua_State* L, int category);
```

```c
size_t lua_totalbytes(lua_State* L, int category);
```

## Error Handling

```c
void lua_error(lua_State* L);
```

## Sandboxing

```c
void lua_setsafeenv(lua_State* L, int idx, int enabled);
```

```c
uintptr_t lua_encodepointer(lua_State* L, uintptr_t p);
```

## Debugging

```c
typedef void (*lua_Hook)(lua_State* L, lua_Debug* ar);

int lua_stackdepth(lua_State* L);
int lua_getinfo(lua_State* L, int level, const char* what, lua_Debug* ar);
int lua_getargument(lua_State* L, int level, int n);
const char* lua_getlocal(lua_State* L, int level, int n);
const char* lua_setlocal(lua_State* L, int level, int n);
const char* lua_getupvalue(lua_State* L, int funcindex, int n);
const char* lua_setupvalue(lua_State* L, int funcindex, int n);

void lua_singlestep(lua_State* L, int enabled);
int lua_breakpoint(lua_State* L, int funcindex, int line, int enabled);
```

## Coverage

```c
typedef void (*lua_Coverage)(void* context, const char* function, int linedefined, int depth, const int* hits, size_t size);

void lua_getcoverage(lua_State* L, int funcindex, void* context, lua_Coverage callback);
```

## Execution Counters

```c
typedef void (*lua_CounterFunction)(void* context, const char* function, int linedefined);
typedef void (*lua_CounterValue)(void* context, int kind, int line, uint64_t hits);

void lua_getcounters(lua_State* L, int funcindex, void* context, lua_CounterFunction functionvisit, lua_CounterValue countervisit);
```

## Callbacks

```c
struct lua_Callbacks
{
    void* userdata; // arbitrary userdata pointer that is never overwritten by Luau

    void (*interrupt)(lua_State* L, int gc);  // gets called at safepoints (loop back edges, call/ret, gc) if set
    void (*panic)(lua_State* L, int errcode); // gets called when an unprotected error is raised (if longjmp is used)

    void (*userthread)(lua_State* LP, lua_State* L); // gets called when L is created (LP == parent) or destroyed (LP == NULL)
    int16_t (*useratom)(lua_State* L, const char* s, size_t l); // gets called when a string is created to assign an atom id

    void (*debugbreak)(lua_State* L, lua_Debug* ar);     // gets called when BREAK instruction is encountered
    void (*debugstep)(lua_State* L, lua_Debug* ar);      // gets called after each instruction in single step mode
    void (*debuginterrupt)(lua_State* L, lua_Debug* ar); // gets called when thread execution is interrupted by break in another thread
    void (*debugprotectederror)(lua_State* L);           // gets called when protected call results in an error

    void (*onallocate)(lua_State* L, size_t osize, size_t nsize); // gets called when memory is allocated
};

lua_Callbacks* lua_callbacks(lua_State* L);
```

## String Buffer Manipulation

## Builtin Libraries

## Miscellaneous Functions

```c
double lua_clock();
```
