control-flow
============
The goal of the control-flow module is to transform parsed JavaScript into a simpler intermediate representation.  The objective here is to create an intermediate representation of JavaScript with as few moving parts as possible.  Doing this makes processing the generated code simpler since there are fewer cases that must be considered.

## Block
The main output from the module is a control flow graph.  Nodes in the control flow graph are made up of blocks.  Each block is a linear list of operators within some specified scope.  Blocks are connected to other blocks by terminator nodes, which implement things like branching, loops and returns.

```
interface Block {
  type: "Block";
  scope: Scope;
  body: [ Operator ];
  terminator: Terminator;
}
```

## Scope

Each block has an associated scope which tracks the set of all variables present within the block.  

```
interface Scope {
  parent: Scope | null;
  variables: [ { key: Identifier, value: Variable } ];
  node: EsprimaNode;
}
```

Resolving a variable reference within a scope can be performed using the following algorithm:

```javascript
function resolveName(id, scope) {
  while(scope !== null) {
    for(var i=0; i<scope.variables.length; ++i) {
      if(scope.variables[i].id === id) {
        return scope.variables[i]
      }
    }
    scope = scope.parent
  }
  return null
}
```

### GlobalScope
The root scope object for the global scope

```
interface GlobalScope <: Scope {
  type: "GlobalScope";
  parent: null;
}
```

### FunctionScope
Scope object for functions/closures

```
interface FunctionScope <: Scope {
  type: "FunctionScope";
  arguments: [ ArgumentVariable ];
}
```

### LetScope
Scope object for let blocks

```
interface LetScope <: Scope {
  type: "LetScope";
}
```

### CatchScope
Scope object for catch block

```
interface CatchScope <: Scope{
  type: "CatchScope";
  exception: Variable;
}
```

## Variable

```
interface Variable {
  type: "Variable";
  id: String;
  node: EsprimaNode;
}
```

## Literal

```
interface Literal {
  type: "Literal";
  value: ...;
  node: EsprimaNode;
}
```


## Operator

```
interface Operator {
  node: EsprimaNode;
}
```

### UnaryOperator

```
interface UnaryOperator <: Operator {
  type: "UnaryOperator";
  operator: "-" | "+" | "!" | "~" | "typeof" | "void" | "delete";
  destination: Variable;
  argument: Literal | Variable;
}
```

### BinaryOperator

Binary JavaScript operator

```
interface BinaryOperator <: Operator {
  type: "BinaryOperator";
  operator: "==" | "!=" | "===" | "!==" | 
            "<" | "<=" | ">" | ">=" |
            "<<" | ">>" | ">>>" |
            "+" | "-" | "*" | "/" | "%" |
            "!" | "^" | "&" | "in" |
            "instanceof" | ".."
  destination: Variable;
  left: Literal | Variable;
  right: Literal | Variable;
}
```

### CallOperator
Calls a function or subroutine

```
interface CallOperator <: Operator {
  type: "CallOperator";
  callee: Variable;
  destination: Variable | null;
  object: Variable | Literal;
  arguments: [ Variable | Literal ];
}
```

### GetOperator
Retrieve a property from an object

```
interface GetOperator <: Operator {
  type: "GetOperator";
  destination: Variable;
  object: Variable | Literal;
  property: Variable | Literal;  
}
```

### SetOperator
Update a property in an object

```
interface SetOperator <: Operator {
  type: "SetOperator";
  destination: Variable;
  object: Variable | Literal;
  property: Variable | Literal;
  value: Variable | Literal;
}
```

### NewOperator
Create a new object

```
interface NewOperator <: Operator {
  type: "NewOperator";
  destination: Variable;
  callee: Variable;
  arguments: [ Variable | Literal ];
}
```

## Terminator

### Jump

### If

### Return

### Throw

### TryCatch