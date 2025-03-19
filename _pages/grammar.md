---
permalink: /grammar
title: Grammar
classes: wide
---

This is the complete syntax grammar for Luau in EBNF. More information about the terminal nodes STRING and NUMBER
is available in the [syntax section](syntax).

```ebnf
chunk ::= block
block ::= {stat [';']} [laststat [';']]
stat ::= varlist '=' explist |
    var compoundop exp |
    functioncall |
    'do' block 'end' |
    'while' exp 'do' block 'end' |
    'repeat' block 'until' exp |
    'if' exp 'then' block {'elseif' exp 'then' block} ['else' block] 'end' |
    'for' binding '=' exp ',' exp [',' exp] 'do' block 'end' |
    'for' bindinglist 'in' explist 'do' block 'end' |
    attributes 'function' funcname funcbody |
    attributes 'local' 'function' NAME funcbody |
    'local' bindinglist ['=' explist] |
    ['export'] 'type' NAME ['<' GenericTypeListWithDefaults '>'] '=' Type |
    ['export'] 'type' 'function' NAME funcbody

laststat ::= 'return' [explist] | 'break' | 'continue'

funcname ::= NAME {'.' NAME} [':' NAME]
funcbody ::= ['<' GenericTypeList '>'] '(' [parlist] ')' [':' ReturnType] block 'end'
parlist ::= bindinglist [',' '...' [':' (GenericTypePack | Type)]] | '...' [':' (GenericTypePack | Type)]

explist ::= {exp ','} exp

binding ::= NAME [':' Type]
bindinglist ::= binding [',' bindinglist] (* equivalent of Lua 5.1 'namelist', except with optional type annotations *)

var ::= NAME | prefixexp '[' exp ']' | prefixexp '.' NAME
varlist ::= var {',' var}
prefixexp ::= var | functioncall | '(' exp ')'
functioncall ::= prefixexp funcargs | prefixexp ':' NAME funcargs

exp ::= asexp { binop exp } | unop exp { binop exp }
ifelseexp ::= 'if' exp 'then' exp {'elseif' exp 'then' exp} 'else' exp
asexp ::= simpleexp ['::' Type]
stringinterp ::= INTERP_BEGIN exp { INTERP_MID exp } INTERP_END
simpleexp ::= NUMBER | STRING | 'nil' | 'true' | 'false' | '...' | tableconstructor | attributes 'function' funcbody | prefixexp | ifelseexp | stringinterp
funcargs ::=  '(' [explist] ')' | tableconstructor | STRING

tableconstructor ::= '{' [fieldlist] '}'
fieldlist ::= field {fieldsep field} [fieldsep]
field ::= '[' exp ']' '=' exp | NAME '=' exp | exp
fieldsep ::= ',' | ';'

compoundop ::= '+=' | '-=' | '*=' | '/=' | '//=' | '%=' | '^=' | '..='
binop ::= '+' | '-' | '*' | '/' | '//' | '^' | '%' | '..' | '<' | '<=' | '>' | '>=' | '==' | '~=' | 'and' | 'or'
unop ::= '-' | 'not' | '#'

littable ::= '{' [litfieldlist] '}'
litfieldlist ::= litfield {fieldsep litfield} [fieldsep]
litfield ::= [NAME '='] literal

literal ::= 'nil' | 'false' | 'true' | NUMBER | STRING | littable
litlist ::= literal {',' literal}

pars ::= '(' [litlist] ')' | littable | STRING 
parattr ::= NAME [pars]
attribute ::= '@' NAME | '@[' parattr {',' parattr} ']'
attributes ::= {attribute}

SimpleType ::=
    'nil' |
    SingletonType |
    NAME ['.' NAME] [ '<' [TypeParams] '>' ] |
    'typeof' '(' exp ')' |
    TableType |
    FunctionType |
    '(' Type ')'

SingletonType ::= STRING | 'true' | 'false'

Union ::= [SimpleType {'?'}] {'|' SimpleType {'?'}}
Intersection ::= [SimpleType] {'&' SimpleType}
Type ::= Union | Intersection

GenericTypePackParameter ::= NAME '...'
GenericTypeList ::= NAME [',' GenericTypeList] | GenericTypePackParameter {',' GenericTypePackParameter}

GenericTypePackParameterWithDefault ::= NAME '...' '=' (TypePack | VariadicTypePack | GenericTypePack)
GenericTypeListWithDefaults ::=
    NAME ['=' Type] [',' GenericTypeListWithDefaults] |
    GenericTypePackParameterWithDefault {',' GenericTypePackParameterWithDefault}

TypeList ::= Type [',' TypeList] | '...' Type
BoundTypeList ::= [NAME ':'] Type [',' BoundTypeList] | GenericTypePack | VariadicTypePack
TypeParams ::= (Type | TypePack | VariadicTypePack | GenericTypePack) [',' TypeParams]
TypePack ::= '(' [TypeList] ')'
GenericTypePack ::= NAME '...'
VariadicTypePack ::= '...' Type
ReturnType ::= Type | TypePack | GenericTypePack | VariadicTypePack
TableIndexer ::= ['read' | 'write'] '[' Type ']' ':' Type
TableProp ::= ['read' | 'write'] NAME ':' Type
PropList ::= TableProp [fieldsep PropList] | TableIndexer {fieldsep TableProp} 

TableType ::= '{' Type '}' | '{' [PropList] '}'
FunctionType ::= ['<' GenericTypeList '>'] '(' [BoundTypeList] ')' '->' ReturnType
```
