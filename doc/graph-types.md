control-flow
============
The goal of the control-flow module is to transform parsed JavaScript into a simpler intermediate representation for the purposes of static analysis.  While JavaScript by itself is by no means a complicated language, it still has enough weird syntactic quirks and edge cases that make writing a proper interpreter cumbersome.  By focusing on generating a control flow graph for a smaller subset of JS, analysis and abstract interpretation will have to account for fewer special cases and so it should be easier to get it right.

At a high level the output from control-flow is a direct graph that represents a [control flow graph](http://en.wikipedia.org/wiki/Control_flow_graph) of the program.  Nodes in the control flow graph are made up of blocks of linear code, each of which is represented as a list of operators on some variables within a defined scope.  These operators are encoded in a specialized [three address code](http://en.wikipedia.org/wiki/Three_address_code) based on a simplified subset of JavaScript.

While doing this, it is also important that the relation of this intermediate representation to the abstract syntax tree is maintained.  This is so instrumentation and analysis can be reported in terms of the original source code.


## Closure
```
interface Closure {
  type: "Closure";
  name: String;
  entry: Block;
  exit: Block;
  blocks: [ Block ];
}
```

## Block

A Block is a contiguous region of code

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
  variables: [ Variable ];
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

The `node` parameter is the EsprimaNode which stores the 

### GlobalScope
The root scope object for the global scope.

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
  value: null | Number | String | Boolean;
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
  operator: "-" | "+" | "!" | "~" | "typeof" | "void";
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

### DeleteOperator
Deletes a property within an object

```
interface DeleteOperator <: Operator {
  type: "DeleteOperator";
  object: Variable | Literal;
  property: Variable | Literal;
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

### LambdaOperator
Creates a new JavaScript closure

```
interface LambdaOperator <: Operator {
  type: "LambdaOperator";
  destination: Variable;
  closure: Closure;
}
```

## Terminator

```
interface Terminator {
  node: EsprimaNode;
}
```

### JumpTerminator

```
interface JumpTerminator <: Terminator {
  type: "JumpTerminator";
  target: Block;
}
```

### IfTerminator

```
interface IfTerminator <: Terminator {
  type: "IfTerminator";
  predicate: Variable;
  consequent: Block;
  alternate: Block;
}
```

### ReturnTerminator

```
interface ReturnTerminator <: Terminator {
  type: "ReturnTerminator";
  result: Variable;
}
```

### ThrowTerminator

```
interface ThrowTerminator <: Terminator {
  type: "ThrowTerminator";
  exception: Variable;
}
```

### TryCatchTerminator

```
interface TryCatchTerminator <: Terminator {
  type: "TryCatchTerminator";
  tryblock: Block;
  catchblock: Block;
}
```