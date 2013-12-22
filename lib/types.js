"use strict"

function setNode(obj, node) {
  obj.node = node
  obj.range = node.range
  obj.loc = node.loc
}

function Block(scope, body, terminator, range, loc) {
  this.type = "Block"
  this.scope = scope
  this.body = body
  this.range = range
  this.loc = loc
  this.terminator = terminator
}
module.exports.Block = Block

function GlobalScope(variables, node) {
  this.type = "GlobalScope"
  this.variables = variables
  setNode(this, node)
}
module.exports.GlobalScope = GlobalScope

function FunctionScope(parent, arguments, variables, node) {
  this.type = "FunctionScope"
  this.parent = parent
  this.arguments = arguments
  this.variables = variables
  setNode(this, node)
}
module.exports.FunctionScope = FunctionScope

function WithScope(parent, object, variables, node) {
  this.type = "WithScope"
  this.parent = parent
  this.object = object
  this.variables = variables
  setNode(this, node)
}
module.exports.WithScope = WithScope

function CatchScope(parent, exception, variables, node) {
  this.type = "CatchScope"
  this.exception = exception
  this.variables = variables
  setNode(this, node)
}
module.exports.CatchScope = CatchScope

function ArgumentVariable(node) {
  this.type = "ArgumentVariable"
}
module.exports.ArgumentVariable = ArgumentVariable

function DeclaredVariable(node) {
  this.type = "DeclaredVariable"
  this.id = node.id
  setNode(this, node)
}
module.exports.DeclaredVariable = DeclaredVariable

function CatchVariable(node) {
  this.type = "CatchVariable"
  this.id = node.id
  setNode(this, node)
}
module.exports.CatchVariable = CatchVariable

function TemporaryVariable(id, node) {
  this.type = "TemporaryVariable"
  this.id = id
  setNode(this, node)
}
module.exports.TemporaryVariable = TemporaryVariable

function Literal(node) {
  this.type = "Literal"
  this.value = node.value
  setNode(this, node)
}

module.exports.Literal = Literal

function This(node) {
  this.type = "This"
  setNode(this, node)
}
module.exports.This = This

function BinaryOperator(destination, left, right, node) {
  this.type = "BinaryOperator"
  this.operator = node.operator
  this.destination = desination
  this.left = left
  this.right = right
  setNode(this, node)
}
module.exports.BinaryOperator = BinaryOperator

function UnaryOperator(destination, argument, node) {
  this.type = "UnaryOperator"
  this.operator = node.operator
  this.destination = destination
  this.argument = argument
  setNode(this, node)
}
module.exports.UnaryOperator = UnaryOperator

function GetOperator(destination, object, id, node) {
  this.type = "GetOperator"
  this.destination = destination
  this.object = object
  this.id = id
  setNode(this, node)
}
module.exports.Get = Get

function SetOperator(destination, object, id, value, node) {
  this.type = "SetOperator"
  this.destination = destination
  this.object = object
  this.id = id
  this.value = value
  setNode(this, node)
}
module.exports.Set = Set

function CallOperator(destination, callee, object, args, node) {
  this.type = "CallOperator"
  this.destination = destination
  this.callee = callee
  this.object = object
  this.arguments = args
  setNode(this, node)
}
module.exports.CallFunction = CallFunction

function NewOperator(destination, callee, args, node) {
  this.type = "NewOperator"
  this.destination = destination
  this.callee = callee
  this.arguments = args
  setNode(this, node)
}
module.exports.New = New

function Return(value, node) {
  this.type = "ReturnTerminator"
  this.value = value
  setNode(this, node)
}
module.exports.Return = Return

function Jump(target, node) {
  this.type = "JumpTerminator"
  this.target = target
  setNode(this, node)
}
module.exports.Jump = Jump

function If(predicate, consequent, alternate, node) {
  this.type = "IfTerminator"
  this.predicate = predicate
  this.consequent = consequent
  this.alternate = alternate
  setNode(this, node)
}
module.exports.If = If

function Throw(value, node) {
  this.type = "ThrowTerminator"
  this.value = value
  setNode(this, node)
}
module.exports.Throw = Throw

function TryCatch(tryblock, catchblock, node) {
  this.type = "TryCatchTerminator"
  this.try = tryblock
  this.catch = catchblock
  setNode(thisNode)
}