Data types
==========
The goal of the control-flow module is to transform parsed JavaScript into a simpler intermediate representation for the purposes of static analysis.  While JavaScript by itself is by no means a complicated language, it still has enough weird syntactic quirks and edge cases that make writing a proper interpreter cumbersome.  By focusing on generating a control flow graph for a smaller subset of JS, analysis and abstract interpretation will have to account for fewer special cases and so it should be easier to get it right.

At a high level the output from control-flow is a direct graph that represents a [control flow graph](http://en.wikipedia.org/wiki/Control_flow_graph) of the program.  Nodes in the control flow graph are made up of blocks of linear code, each of which is represented as a list of operators on some variables within a defined scope.  These operators are encoded in a specialized [three address code](http://en.wikipedia.org/wiki/Three_address_code) based on a simplified subset of JavaScript.

While doing this, it is also important that the relation of this intermediate representation to the abstract syntax tree is maintained.  This is so instrumentation and analysis can be reported in terms of the original source code.

## Closure
The root object from an analysis is a lexical closure.  Each closure has a pointer to the first block, and execution of a closure starts by interpreting the first block and continuing recursively.  To simplify inlining, each closure keeps a pointer to the exit block and a block which is called upon triggering an exception, along with a list of all blocks within the closure.  Each closure also tracks the scope and arguments of the closure and maintains a pointer to the parent closure.

```
interface Closure {
  type: "Closure";
  name: String;
  variables: [ Variable ];
  arguments: [ VariableId ];
  object: VariableId;
  closures: [ { id: VariableId, closure: Closure } ];
  entry: BlockId;
  exit: BlockId;
  raise: BlockId;
  blocks: [ Block ];
  node: EsprimaNode | null;
}
```

The meaning of these properties is as follows:

* `type` - A string which identifies the type of the object as a closure
* `name` - The name of the closure if specified
* `variables` - A list of all the variables contained within the closure
* `arguments` - A list of the input arguments for the closure
* `closures` - The list of all subclosures contained within this closure
* `entry` - The first block from which execution starts
* `exit` - The final block of the closure, which is called upon termination
* `raise` - This block is called if the closure throws an uncaught exception
* `blocks` - A list of all blocks in the closure
* `node` - A reference to the esprima node associated to the closure

Note that each closure has exactly one block where either a value is returned or an exception is raised.  This simplifies the process of inlining a closure.  

## Variable

Each variable in the program has an associated identifier and is attached to some closure.  Variables are represented as the following structure:

```
interface Variable {
  type: "Variable";
  id: VariableId;
  local: Boolean;
  nodes: [ EsprimaNode ];
}
```

Besides normal JavaScript identifiers, additional variables may be created for temporary variables.  These temporary identifiers can be distinguished from declared variables by the `~` prefix.

## Literal

Literals correspond to constants within JavaScript code.  Literals may appear as arguments in operators or as parameters passed to function calls.

```
interface Literal {
  type: "Literal";
  value: undefined | null | Number | String | Boolean;
  node: EsprimaNode | null;
}
```

## Block

A Block is a contiguous region of code.  Control flow graphs are directed acyclic graphs made out of blocks.  Each block has a scope, which determines the variables which are bound within the block, a linear sequence of operators and a final terminator which connects it to one or more blocks.

```
interface Block {
  type: "Block";
  id: BlockId;
  body: [ Operator ];
  terminator: Terminator;
}
```

More specifically each of these properties has the following interpretation:

* `type` is always a string set to `"Block"`
* `id` is an index into the containing closure's array of blocks
* `body` is an array of Operators that represent the semantic behavior of the block
* `terminator` is a Terminator node that is executed after `body`

## Operator

Each operator in a block is a three address code.  Operations include unary and binary expressions, function calls, property access, object creation, and closure construction. 

```
interface Operator {
  node: EsprimaNode | null;
}
```

Each operator is implemented as a three address code, with arguments stored as literals or variables.

### UnaryOperator

A unary JavaScript operator.

```
interface UnaryOperator <: Operator {
  type: "UnaryOperator";
  operator: "" | "-" | "+" | "!" | "~" | "typeof";
  result: VariableId;
  argument: VariableId | Literal;
}
```

The interpertation of this in JavaScript would be:

```javascript
result = operator argument;
```

For example,

```
destination = !argument
```

### BinaryOperator

A binary JavaScript operator.

```
interface BinaryOperator <: Operator {
  type: "BinaryOperator";
  operator: "==" | "!=" | "===" | "!==" | 
            "<" | "<=" | ">" | ">=" |
            "<<" | ">>" | ">>>" |
            "+" | "-" | "*" | "/" | "%" |
            "!" | "^" | "&" | "instanceof"
  result: VariableId;
  left: VariableId | Literal;
  right: VariableId | Literal;
}
```

Example:

```javascript
result = left + right
```

## Terminator

Terminators are the final statement within a block and link the blocks together

```
interface Terminator {
  node: EsprimaNode | null;
}
```

### JumpTerminator

A jump to a block.

```
interface JumpTerminator <: Terminator {
  type: "JumpTerminator";
  next: BlockId;
}
```

### IfTerminator

If statements are translated into if terminators.  

```
interface IfTerminator <: Terminator {
  type: "IfTerminator";
  predicate: VariableId;
  consequent: BlockId;
  alternate: BlockId;
}
```

### CallTerminator

Calls a function or subroutine

```
interface CallTerminator <: Terminator {
  type: "CallTerminator";
  callee: VariableId;
  object: VariableId | Literal;
  arguments: [ VariableId | Literal ];
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  error: BlockId;
}
```

A CallTerminator translates into the following JavaScript

```javascript
result = callee.call(object, arguments[0], arguments[1], ...)
```

If the function completes normally, then execution continues from the `next` block.  Otherwise, if an exception is generated the exception is stored in `exception` and code jumps to the `error` block.

In addition to normal function calls, object construction and property access is managed using the CallTerminator block.  The following psuedofunctions are defined:

### GetTerminator

Access a property of `object`

```
interface GetTerminator <: Terminator {
  type: "GetTerminator";
  object: VariableId;
  property: VariableId | Literal;
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  catch: BlockId;
}
```

In JavaScript, this function can be translated as follows:

```javascript
function get(object, property) {
  return object[property]
}
```

### SetTerminator

Updates a property in an object

```
interface SetTerminator <: Terminator {
  type: "SetTerminator";
  object: VariableId;
  property: VariableId | Literal;
  value: VariableId | Literal;
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  catch: BlockId;
}
```

This can be interpreterd as follows,

```javascript
function set(object, property, value) {
  return object[property] = value
}
```

### DeleteTerminator

Deletes a property of an object.

```
interface DeleteTerminator <: Terminator {
  type: "DeleteTerminator";
  object: VariableId;
  property: VariableId | Literal;
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  catch: BlockId;
}
```

This translates to the following JavaScript

```javascript
function delete(object, property) {
  return delete object[property]
}
```

### HasTerminator

Checks if a property is contained in an object

```
interface HasTerminator <: Terminator {
  type: "HasTerminator";
  object: VariableId;
  property: VariableId | Literal;
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  catch: BlockId;
}
```

This translates to the following psuedo-JavaScript

```javascript
function has(object, property) {
  return property in object
}
```

### NewTerminator

Creates a new object.  The constructor for the object is stored in the `object` property.

```
interface NewTerminator <: Terminator {
  type: "NewTerminator";
  constructor: VariableId;
  arguments: [ VariableId | Literal ];
  result: VariableId;
  next: BlockId;
  exception: VariableId;
  error: BlockId;
}
```

This translates to the following JavaScript

```javascript
function new(args...) {
  return new object(args...)
}
```

### ReturnTerminator

There is only one return terminator in a given closure.  The returned value is stored in `result`.

```
interface ReturnTerminator <: Terminator {
  type: "ReturnTerminator";
  result: VariableId;
}
```

In JavaScript this translates to the following snippet:

```javascript
// ...
  return result
```

### ThrowTerminator

Throws an exception.  Again, there is only one throw terminator per closure.  The thrown exception is stored in `result`.

```
interface ThrowTerminator <: Terminator {
  type: "ThrowTerminator";
  exception: VariableId;
}
```

In JavaScript, this translates to the following snippet:

```javascript
// ...
  throw exception
```

# More information

For a more detailed reference of how these data types can be interperterd, take a look at the [control-flow-to-js](https://github.com/mikolalysenko/control-flow-to-js), which acts as a reference implementation of an interperter of this intermediate representation.