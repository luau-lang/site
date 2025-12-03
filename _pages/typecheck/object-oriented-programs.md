---
permalink: /typecheck/object-oriented-programs
title: Object-Oriented Programming
toc: true
---

## Adding types for faux object oriented programs

One common pattern we see with existing Lua/Luau code is the following object-oriented code. While Luau is capable of inferring a decent chunk of this code, it cannot pin down on the types of `self` when it spans multiple methods.

```lua
local Account = {}
Account.__index = Account

function Account.new(name, balance)
    local self = {}
    self.name = name
    self.balance = balance

    return setmetatable(self, Account)
end

-- The `self` type is different from the type returned by `Account.new`
function Account:deposit(credit)
    self.balance += credit
end

-- The `self` type is different from the type returned by `Account.new`
function Account:withdraw(debit)
    self.balance -= debit
end

local account = Account.new("Alexander", 500)
```

For example, the type of `Account.new` is `<a, b>(name: a, balance: b) -> { ..., name: a, balance: b, ... }` (snipping out the metatable). For better or worse, this means you are allowed to call `Account.new(5, "hello")` as well as `Account.new({}, {})`. In this case, this is quite unfortunate, so your first attempt may be to add type annotations to the parameters `name` and `balance`.

There's the next problem: the type of `self` is not shared across methods of `Account`, this is because you are allowed to explicitly opt for a different value to pass as `self` by writing `account.deposit(another_account, 50)`. As a result, the type of `Account:deposit` is `<a, b>(self: { balance: a }, credit: b) -> ()`. Consequently, Luau cannot infer the result of the `+` operation from `a` and `b`, so a type error is reported. 

We can see there's a lot of problems happening here. This is a case where you'll have to provide some guidance to Luau in the form of annotations today, but the process is straightforward and without repetition. You first specify the type of _data_ you want your class to have, and then you define the class type separately with `setmetatable` (either via `typeof`, or in the New Type Solver, the `setmetatable` type function).
From then on, you can explicitly annotate the `self` type of each method with your class type! Note that while the definition is written e.g. `Account.deposit`, you can still call it as `account:deposit(...)`.

```lua
local Account = {}
Account.__index = Account

type AccountData = {
    name: string,
    balance: number,
}

export type Account = typeof(setmetatable({} :: AccountData, Account))
-- or alternatively, in the new type solver...
-- export type Account = setmetatable<AccountData, typeof(Account)>


-- this return annotation is not required, but ensures that you cannot
-- accidentally make the constructor incompatible with the methods
function Account.new(name, balance): Account
    local self = {}
    self.name = name
    self.balance = balance

    return setmetatable(self, Account)
end

-- this annotation on `self` is the only _required_ annotation.
function Account.deposit(self: Account, credit)
    -- autocomplete on `self` works here!
    self.balance += credit
end

-- this annotation on `self` is the only _required_ annotation.
function Account.withdraw(self: Account, debit)
    -- autocomplete on `self` works here!
    self.balance -= debit
end

local account = Account.new("Hina", 500)
account:deposit(20) -- this still works, and we had autocomplete after hitting `:`!
```

Based on feedback, we plan to restrict the types of all functions defined with `:` syntax to [share their self types](https://rfcs.luau.org/shared-self-types.html). This will enable future versions of this code to work without any explicit `self` annotations because it amounts to having type inference make precisely the assumptions we are encoding with annotations here --- namely, that the type of the constructors and the method definitions is intended by the developer to be the same.
