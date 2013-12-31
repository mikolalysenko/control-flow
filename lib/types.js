"use strict"

function setNode(obj, node) {
  if(node) {
    obj.node = node
  } else {
    obj.node = null
  }
}

function Closure(
  name,
  variables,
  args,
  object,
  closures,
  entry,
  exit,
  except,
  blocks,
  node) {
  this.type = "Closure"
  this.name = name
  this.variables = variables
  this.object = object
  this.arguments = args
  this.closures = closures
  this.entry = entry
  this.exit = exit
  this.except = except
  this.blocks = blocks
  setNode(this, node)
}
exports.Closure = Closure

function Variable(id, local, nodes) {
  this.type = "Variable"
  this.id = id
  this.local = local
  this.nodes = nodes
}
module.exports.Variable = Variable

function VariableId(id) {
  this.type = "VariableId"
  this.id = id
}
module.exports.VariableId = VariableId

function Literal(value, node) {
  this.type = "Literal"
  this.value = value
  setNode(this, node)
}
module.exports.Literal = Literal

function Builtin(type, node) {
  this.type = "Builtin"
  this.operation = type
  setNode(this, node)
}
exports.Builtin

function Block(id, body, terminator) {
  this.type = "Block"
  this.id = id
  this.body = body
  this.terminator = terminator
}
exports.Block = Block

function UnaryOperator(operator, destination, argument, node) {
  this.type = "UnaryOperator"
  this.operator = operator
  this.destination = destination
  this.argument = argument
  setNode(this, node)
}
exports.UnaryOperator = UnaryOperator

function BinaryOperator(operator, destination, left, right, node) {
  this.type = "BinaryOperator"
  this.operator = operator
  this.destination = desination
  this.left = left
  this.right = right
  setNode(this, node)
}
exports.BinaryOperator = BinaryOperator

function JumpTerminator(next, node) {
  this.type = "JumpTerminator"
  this.next = next
  setNode(this, node)
}
exports.JumpTerminator = JumpTerminator

function IfTerminator(predicate, consequent, alternate, node) {
  this.type = "IfTerminator"
  this.predicate = predicate
  this.consequent = consequent
  this.alternate = alternate
  setNode(this, node)
}
exports.IfTerminator = IfTerminator

function CallTerminator(callee, object, args, result, next, exception, catchBlock, node) {
  this.type = "CallTerminator"
  this.callee = callee
  this.object = object
  this.arguments = args
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.CallTerminator = CallTerminator

function ReturnTerminator(result, node) {
  this.type = "ReturnTerminator"
  this.result = result
  setNode(this, node)
}
exports.ReturnTerminator = ReturnTerminator

function ThrowTerminator(exception, node) {
  this.type = "ThrowTerminator"
  this.exception = exception
  setNode(this, node)
}
exports.ThrowTerminator = ThrowTerminator