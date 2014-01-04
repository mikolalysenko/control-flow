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
  closures,
  entry,
  exit,
  raise,
  blocks,
  node) {
  this.type = "Closure"
  this.name = name
  this.variables = variables
  this.arguments = args
  this.closures = closures
  this.entry = entry
  this.exit = exit
  this.raise = raise
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
exports.Variable = Variable

function VariableId(id, node) {
  this.type = "VariableId"
  this.id = id
  setNode(this, node)
}
exports.VariableId = VariableId

function Literal(value, node) {
  this.type = "Literal"
  this.value = value
  setNode(this, node)
}
exports.Literal = Literal


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
  this.destination = destination
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

function NewTerminator(constructor, args, result, next, exception, catchBlock, node) {
  this.type = "NewTerminator"
  this.constructor = constructor
  this.arguments = args
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.NewTerminator = NewTerminator

function GetTerminator(object, property, result, next, exception, catchBlock, node) {
  this.type = "GetTerminator"
  this.object = object
  this.property = property
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.GetTerminator = GetTerminator

function SetTerminator(object, property, value, result, next, exception, catchBlock, node) {
  this.type = "SetTerminator"
  this.object = object
  this.property = property
  this.value = value
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.SetTerminator = SetTerminator

function DeleteTerminator(object, property, result, next, exception, catchBlock, node) {
  this.type = "DeleteTerminator"
  this.object = object
  this.property = property
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.DeleteTerminator = DeleteTerminator

function HasTerminator(object, property, result, next, exception, catchBlock, node) {
  this.type = "HasTerminator"
  this.object = object
  this.property = property
  this.result = result
  this.next = next
  this.exception = exception
  this.catch = catchBlock
  setNode(this, node)
}
exports.HasTerminator = HasTerminator

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