Data types
==========
The goal of the control-flow module is to transform parsed JavaScript into a simpler intermediate representation for the purposes of static analysis.  While JavaScript by itself is by no means a complicated language, it still has enough weird syntactic quirks and edge cases that make writing a proper interpreter cumbersome.  By focusing on generating a control flow graph for a smaller subset of JS, analysis and abstract interpretation will have to account for fewer special cases and so it should be easier to get it right.

At a high level the output from control-flow is a direct graph that represents a [control flow graph](http://en.wikipedia.org/wiki/Control_flow_graph) of the program.  Nodes in the control flow graph are made up of blocks of linear code, each of which is represented as a list of operators on some variables within a defined scope.  These operators are encoded in a specialized [three address code](http://en.wikipedia.org/wiki/Three_address_code) based on a simplified subset of JavaScript.

While doing this, it is also important that the relation of this intermediate representation to the abstract syntax tree is maintained.  This is so instrumentation and analysis can be reported in terms of the original source code.


## Closure
The root object from an analysis is a lexical closure.  Each closure has a pointer to the first block, and execution of a closure starts by interpreting the first block and continuing recursively.  To simplify inlining, each closure keeps a pointer to the last block, a block which is called upon triggering an exception, and a list of all blocks within the closure.  Each closure also tracks the scope and arguments of the closure.

```
interface Closure {
  type: "Closure";
  name: String;
  variables: [ Variable ];
  arguments: [ Variable ];
  entry: Block;
  exit: Block;
  except: Block;
  blocks: [ Block ];
  node: EsprimaNode;
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

## Block

A Block is a contiguous region of code.  Control flow graphs are directed acyclic graphs made out of blocks.  Each block has a scope, which determines the variables which are bound within the block, a linear sequence of operators and a final terminator block which handles the 

```
interface Block {
  type: "Block";
  body: [ Operator ];
  terminator: Terminator;
}
```

## Operator

Each operator in a block is a three address code.  Operations include unary and binary expressions, function calls, property access, object creation, and closure construction. 

```
interface Operator {
  node: EsprimaNode;
}
```

### UnaryOperator

A unary JavaScript operator

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
            "instanceof"
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

Terminators are the final statement within a block and link the blocks together

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