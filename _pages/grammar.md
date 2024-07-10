---
permalink: /grammar
title: Grammar
classes: wide
---

This is the complete syntax grammar for Luau in EBNF. More information about the terminal nodes String and Number
is available in the [syntax section](syntax).

```ebnf
chunk = block
block = {stat [';']} [laststat [';']]
stat = varlist '=' explist |
    var compoundop exp |
    functioncall |
    'do' block 'end' |
    'while' exp 'do' block 'end' |
    'repeat' block 'until' exp |
    'if' exp 'then' block {'elseif' exp 'then' block} ['else' block] 'end' |
    'for' binding '=' exp ',' exp [',' exp] 'do' block 'end' |
    'for' bindinglist 'in' explist 'do' block 'end' |
    'function' funcname funcbody |
    'local' 'function' NAME funcbody |
    'local' bindinglist ['=' explist] |
    ['export'] 'type' NAME ['<' GenericTypeListWithDefaults '>'] '=' Type

laststat = 'return' [explist] | 'break' | 'continue'

funcname = NAME {'.' NAME} [':' NAME]
funcbody = ['<' GenericTypeList '>'] '(' [parlist] ')' [':' ReturnType] block 'end'
parlist = bindinglist [',' '...' [':' GenericTypePack | Type]]

explist = {exp ','} exp
namelist = NAME {',' NAME}

binding = NAME [':' Type]
bindinglist = binding [',' bindinglist] (* equivalent of Lua 5.1 'namelist', except with optional type annotations *)

var = NAME | prefixexp '[' exp ']' | prefixexp '.' NAME
varlist = var {',' var}
prefixexp = var | functioncall | '(' exp ')'
functioncall = prefixexp funcargs | prefixexp ':' NAME funcargs

exp = asexp { binop exp } | unop exp { binop exp }
ifelseexp = 'if' exp 'then' exp {'elseif' exp 'then' exp} 'else' exp
asexp = simpleexp ['::' Type]
stringinterp = INTERP_BEGIN exp { INTERP_MID exp } INTERP_END
simpleexp = NUMBER | STRING | 'nil' | 'true' | 'false' | '...' | tableconstructor | 'function' funcbody | prefixexp | ifelseexp | stringinterp
funcargs =  '(' [explist] ')' | tableconstructor | STRING

tableconstructor = '{' [fieldlist] '}'
fieldlist = field {fieldsep field} [fieldsep]
field = '[' exp ']' '=' exp | NAME '=' exp | exp
fieldsep = ',' | ';'

compoundop :: '+=' | '-=' | '*=' | '/=' | '//=' | '%=' | '^=' | '..='
binop = '+' | '-' | '*' | '/' | '//' | '^' | '%' | '..' | '<' | '<=' | '>' | '>=' | '==' | '~=' | 'and' | 'or'
unop = '-' | 'not' | '#'

SimpleType =
    'nil' |
    SingletonType |
    NAME ['.' NAME] [ '<' [TypeParams] '>' ] |
    'typeof' '(' exp ')' |
    TableType |
    FunctionType |
    '(' Type ')'

SingletonType = STRING | 'true' | 'false'

Union = [SimpleType {'?'}] {'|' SimpleType {'?'}}
Intersection = [SimpleType] {'&' SimpleType}
Type = Union | Intersection

GenericTypePackParameter = NAME '...'
GenericTypeList = NAME [',' GenericTypeList] | GenericTypePackParameter {',' GenericTypePackParameter}

GenericTypePackParameterWithDefault = NAME '...' '=' (TypePack | VariadicTypePack | GenericTypePack)
GenericTypeListWithDefaults =
    NAME ['=' Type] [',' GenericTypeListWithDefaults] |
    GenericTypePackParameterWithDefault {',' GenericTypePackParameterWithDefault}

TypeList = Type [',' TypeList] | '...' Type
BoundTypeList = [NAME ':'] Type [',' BoundTypeList] | GenericTypePack | VariadicTypePack
TypeParams = (Type | TypePack | VariadicTypePack | GenericTypePack) [',' TypeParams]
TypePack = '(' [TypeList] ')'
GenericTypePack = NAME '...'
VariadicTypePack = '...' Type
ReturnType = Type | TypePack
TableIndexer = '[' Type ']' ':' Type
TableProp = NAME ':' Type
TablePropOrIndexer = TableProp | TableIndexer
PropList = TablePropOrIndexer {fieldsep TablePropOrIndexer} [fieldsep]
TableType = '{' Type '}' | '{' [PropList] '}'
FunctionType = ['<' GenericTypeList '>'] '(' [BoundTypeList] ')' '->' ReturnType
```
