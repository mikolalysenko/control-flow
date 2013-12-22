control-flow
============
The goal of the control-flow module is to transform parsed JavaScript into a simpler intermediate representation.  The objective here is to create an intermediate representation of JavaScript with as few moving parts as possible.  Doing this makes processing the generated code simpler since there are fewer cases that must be considered.

## Block

```
interface Block {
  type: "Block";
  scope: Scope;
  body: [ Operator ];
  terminator: Terminator;
}
```


## Scope

```
interface Scope {
  parent: Scope | null;
  variables: [ { key: Identifier, value: Variable } ];
  node: EsprimaNode;
}
```

### GlobalScope

```
interface GlobalScope {
  type: "GlobalScope";
  parent: null;
}
```

### FunctionScope

```
interface FunctionScope {
  type: "FunctionScope";
  arguments: [ ArgumentVariable ];
}
```

### WithScope

```
interface WithScope {
  type: "WithScope";
  object: Variable;
}
```

### CatchScope

```
interface CatchScope {
  type: "CatchScope";
  exception: Variable;
}
```

## Literal

### Literal

### This



## Variable

### ArgumentVariable

### DeclaredVariable

### TemporaryVariable


## Operator

### UnaryOperator

### BinaryOperator

### Call

### Get

### Set

### New


## Terminator

### Jump

### If

### Return

### Throw

### TryCatch