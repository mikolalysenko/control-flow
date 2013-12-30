"use strict"

function setNode(obj, node) {
  if(node) {
    obj.node = node
    obj.range = node.range
    obj.loc = node.loc
  } else {
    obj.node = null
  }
}

function Closure(
  name,
  variables,
  arguments,
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
  this.closures = closures
  this.entry = entry
  this.exit = exit
  this.except = except
  this.blocks = blocks
  setNode(this, node)
}
exports.Closure = Closure

function Variable(id, node) {
  this.type = "Variable"
  this.id = id
  setNode(this, node)
}
module.exports.Variable = Variable

function Literal(value, node) {
  this.type = "Literal"
  this.value = value
  setNode(this, node)
}
module.exports.Literal = Literal

function Block(scope, body, terminator, range, loc) {
  this.type = "Block"
  this.body = body
  this.terminator = terminator
  this.range = range
  this.loc = loc
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


function CallTerminator(callee, object, arguments, result, next, exception, error, node) {
  this.type = "CallTerminator"
  this.callee = callee
  this.object = object
  this.arguments = arguments
  this.result = result
  this.next = next
  this.exception = exception
  this.error = error
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