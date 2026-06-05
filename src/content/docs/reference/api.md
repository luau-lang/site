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

Stack items can be selected using a stack index:
* Negative indices refer to items counting from the top (-1 is the top element, -2 is one below it)
* Positive indices refer to items counting from the base of the stack (useful for function arguments, where 1 is the first argument)
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

```c
int lua_type(lua_State* L, int idx);
```

```c
const char* lua_typename(lua_State* L, int tp);
```

```c
const char* luaL_typename(lua_State* L, int idx);
```

```c
const void* lua_topointer(lua_State* L, int idx);
```

```c
int lua_objlen(lua_State* L, int idx);
```

## Primitive types

```c
int lua_isnumber(lua_State* L, int idx);
```

```c
int lua_isinteger64(lua_State* L, int idx);
```

```c
#define lua_isnil(L, n) // Implemented as a macro
```

```c
#define lua_isboolean(L, n) // Implemented as a macro
```

```c
#define lua_isnone(L, n) // Implemented as a macro
```

```c
#define lua_isnoneornil(L, n) // Implemented as a macro
```

```c
double lua_tonumberx(lua_State* L, int idx, int* isnum);
```

```c
int lua_tointegerx(lua_State* L, int idx, int* isnum);
```

```c
unsigned lua_tounsignedx(lua_State* L, int idx, int* isnum);
```

```c
int lua_toboolean(lua_State* L, int idx);
```

```c
int64_t lua_tointeger64(lua_State* L, int idx, int* isinteger);
```

```c
void lua_pushnil(lua_State* L);
```

```c
void lua_pushnumber(lua_State* L, double n);
```

```c
void lua_pushinteger(lua_State* L, int n);
```

```c
void lua_pushinteger64(lua_State* L, int64_t n);
```

```c
void lua_pushunsigned(lua_State* L, unsigned n);
```

```c
void lua_pushboolean(lua_State* L, int b);
```

```c
#define lua_tonumber(L, i) // Implemented as a macro
```

```c
#define lua_tointeger(L, i) // Implemented as a macro
```

```c
#define lua_tounsigned(L, i) // Implemented as a macro
```

## Strings

```c
int lua_isstring(lua_State* L, int idx);
```

```c
#define lua_tostring(L, i) // Implemented as a macro
```

```c
const char* lua_tolstring(lua_State* L, int idx, size_t* len);
```

```c
const char* lua_tostringatom(lua_State* L, int idx, int* atom);
```

```c
const char* lua_tolstringatom(lua_State* L, int idx, size_t* len, int* atom);
```

```c
const char* lua_namecallatom(lua_State* L, int* atom);
```

```c
void lua_pushlstring(lua_State* L, const char* s, size_t l);
```

```c
void lua_pushstring(lua_State* L, const char* s);
```

```c
const char* lua_pushvfstring(lua_State* L, const char* fmt, va_list argp);
```

```c
const char* lua_pushfstringL(lua_State* L, const char* fmt, ...);
```

```c
#define lua_strlen(L, i) // Implemented as a macro
```

```c
#define lua_pushliteral(L, s) // Implemented as a macro
```

```c
#define lua_pushfstring(L, fmt, ...) // Implemented as a macro
```

```c
void lua_concat(lua_State* L, int n);
```

## Vectors

```c
#define lua_isvector(L, n) // Implemented as a macro
```

```c
const float* lua_tovector(lua_State* L, int idx);
```

```c
void lua_pushvector(lua_State* L, float x, float y, float z, float w); // LUA_VECTOR_SIZE is 4
void lua_pushvector(lua_State* L, float x, float y, float z); // LUA_VECTOR_SIZE is 3
```

## Buffers

```c
#define lua_isbuffer(L, n) // Implemented as a macro
```

```c
void* lua_tobuffer(lua_State* L, int idx, size_t* len);
```

```c
void* lua_newbuffer(lua_State* L, size_t sz);
```

## Functions and Closures

```c
int lua_iscfunction(lua_State* L, int idx);
```

```c
int lua_isLfunction(lua_State* L, int idx);
```

```c
#define lua_isfunction(L, n) // Implemented as a macro
```

```c
lua_CFunction lua_tocfunction(lua_State* L, int idx);
```

```c
void lua_pushcclosurek(lua_State* L, lua_CFunction fn, const char* debugname, int nup, lua_Continuation cont);
```

```c
#define lua_pushcfunction(L, fn, debugname) // Implemented as a macro
```

```c
#define lua_pushcclosure(L, fn, debugname, nup) // Implemented as a macro
```

```c
void lua_clonefunction(lua_State* L, int idx);
```

## Tables

```c
#define lua_istable(L, n) // Implemented as a macro
```

```c
#define lua_newtable(L) // Implemented as a macro
```

```c
int lua_gettable(lua_State* L, int idx);
```

```c
int lua_getfield(lua_State* L, int idx, const char* k);
```

```c
int lua_rawgetfield(lua_State* L, int idx, const char* k);
```

```c
int lua_rawget(lua_State* L, int idx);
```

```c
int lua_rawgeti(lua_State* L, int idx, int n);
```

```c
int lua_rawgetptagged(lua_State* L, int idx, void* p, int tag);
```

```c
void lua_createtable(lua_State* L, int narr, int nrec);
```

```c
void lua_setreadonly(lua_State* L, int idx, int enabled);
```

```c
int lua_getreadonly(lua_State* L, int idx);
```

```c
void lua_settable(lua_State* L, int idx);
```

```c
void lua_setfield(lua_State* L, int idx, const char* k);
```

```c
void lua_rawsetfield(lua_State* L, int idx, const char* k);
```

```c
void lua_rawset(lua_State* L, int idx);
```

```c
void lua_rawseti(lua_State* L, int idx, int n);
```

```c
void lua_rawsetptagged(lua_State* L, int idx, void* p, int tag);
```

```c
int lua_getmetatable(lua_State* L, int objindex);
```

```c
int lua_setmetatable(lua_State* L, int objindex);
```

```c
#define lua_rawgetp(L, idx, p) // Implemented as a macro
```

```c
#define lua_rawsetp(L, idx, p) // Implemented as a macro
```

```c
void lua_cleartable(lua_State* L, int idx);
```

```c
void lua_clonetable(lua_State* L, int idx);
```

```c
int lua_next(lua_State* L, int idx);
```

```c
int lua_rawiter(lua_State* L, int idx, int iter);
```

## Userdata

```c
#define lua_islightuserdata(L, n) // Implemented as a macro
```

```c
int lua_isuserdata(lua_State* L, int idx);
```

```c
void* lua_tolightuserdata(lua_State* L, int idx);
```

```c
void* lua_tolightuserdatatagged(lua_State* L, int idx, int tag);
```

```c
void* lua_touserdata(lua_State* L, int idx);
```

```c
void* lua_touserdatatagged(lua_State* L, int idx, int tag);
```

```c
int lua_userdatatag(lua_State* L, int idx);
```

```c
int lua_lightuserdatatag(lua_State* L, int idx);
```

```c
void lua_pushlightuserdatatagged(lua_State* L, void* p, int tag);
```

```c
void* lua_newuserdatatagged(lua_State* L, size_t sz, int tag);
```

```c
void* lua_newuserdatataggedwithmetatable(lua_State* L, size_t sz, int tag);
```

```c
void* lua_newuserdatadtor(lua_State* L, size_t sz, void (*dtor)(void*));
```

```c
#define lua_newuserdata(L, s) // Implemented as a macro
```

```c
#define lua_pushlightuserdata(L, p) // Implemented as a macro
```

```c
void lua_setuserdatatag(lua_State* L, int idx, int tag);
```

```c
typedef void (*lua_Destructor)(lua_State* L, void* userdata);
```

```c
void lua_setuserdatadtor(lua_State* L, int tag, lua_Destructor dtor);
```

```c
lua_Destructor lua_getuserdatadtor(lua_State* L, int tag);
```

```c
void lua_setuserdatametatable(lua_State* L, int tag);
```

```c
void lua_getuserdatametatable(lua_State* L, int tag);
```

```c
void lua_setlightuserdataname(lua_State* L, int tag, const char* name);
```

```c
const char* lua_getlightuserdataname(lua_State* L, int tag);
```

### Direct userdata metamethod calls
```c
typedef void (*lua_UserdataDirectAccess)(lua_State* L, void* data, int atom, uint16_t* cachedslot, int utag);
```

```c
typedef int (*lua_UserdataDirectNamecall)(lua_State* L, void* data, int atom, uint16_t* cachedslot, int utag);
```

```c
int lua_registeruserdatadirectaccess(
    lua_State* L,
    int tag,
    lua_UserdataDirectAccess get,
    lua_UserdataDirectAccess set,
    lua_UserdataDirectNamecall namecall
);
```

### Direct userdata field access
```c
typedef void (*lua_UserdataDirectFieldGet)(void* ud, void* result);
```

```c
void lua_registeruserdatadirectfieldget(lua_State* L, int tag, const char* field, lua_UserdataDirectFieldGet fn);
```

```c
void lua_userdatadirectfield_setnumber(void* result, double n);
```

```c
void lua_userdatadirectfield_setvector(void* result, float x, float y, float z, float w);
void lua_userdatadirectfield_setvector(void* result, float x, float y, float z);
```

```c
void lua_userdatadirectfield_setboolean(void* result, int b);
```

```c
void lua_userdatadirectfield_setinteger64(void* result, int64_t n);
```

```c
void lua_userdatadirectfield_setnil(void* result);
```

## Classes (experimental)

```c
#define lua_isclass(L, n) // Implemented as a macro
```

```c
#define lua_isobject(L, n) // Implemented as a macro
```

## Making calls

```c
void lua_call(lua_State* L, int nargs, int nresults);
```

```c
int lua_pcall(lua_State* L, int nargs, int nresults, int errfunc);
```

```c
int lua_cpcall(lua_State* L, lua_CFunction func, void* ud);
```

## Comparisons

```c
int lua_equal(lua_State* L, int idx1, int idx2);
```

```c
int lua_rawequal(lua_State* L, int idx1, int idx2);
```

```c
int lua_lessthan(lua_State* L, int idx1, int idx2);
```

## Globals and environments

```c
#define lua_setglobal(L, s) // Implemented as a macro
```

```c
#define lua_getglobal(L, s) // Implemented as a macro
```

```c
void lua_getfenv(lua_State* L, int idx);
```

```c
int lua_setfenv(lua_State* L, int idx);
```

## Coroutines

```c
int lua_isthread(lua_State* L, int idx);
#define lua_isthread(L, n) // Implemented as a macro
```

```c
lua_State* lua_tothread(lua_State* L, int idx);
```

```c
int lua_pushthread(lua_State* L);
```

```c
int lua_yield(lua_State* L, int nresults);
```

```c
int lua_break(lua_State* L);
```

```c
int lua_resume(lua_State* L, lua_State* from, int narg);
```

```c
int lua_resumeerror(lua_State* L, lua_State* from);
```

```c
int lua_isyieldable(lua_State* L);
```

```c
int lua_costatus(lua_State* L, lua_State* co);
```

## Registry References

```c
#define LUA_NOREF -1
#define LUA_REFNIL 0
```

```c
int lua_ref(lua_State* L, int idx);
```

```c
void lua_unref(lua_State* L, int ref);
```

```c
#define lua_getref(L, ref) // Implemented as a macro
```

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
