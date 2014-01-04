"use strict"

module.exports = getVariables

var uniq = require("uniq")

//Extracts all variable declarations from a statement
function getVariables(node) {

  var vars = []
  function visit(node) {
    if(Array.isArray(node)) {
      for(var i=0; i<node.length; ++i) {
        visit(node[i])
      }
    } else {
      switch(node.type) {
        case "EmptyStatement":
        case "ExpressionStatement":
        case "BreakStatement":
        case "ContinueStatement":
        case "ReturnStatement":
        case "ThrowStatement":
        break

        case "LabeledStatement":
        case "WithStatement":
        case "BlockStatement":
        case "WhileStatement":
        case "DoWhileStatement":
          visit(node.body)
        break

        case "TryStatement":
          visit(node.block)
          if(node.handler) {
            visit(node.handler)
          }
          if(node.finalizer) {
            visit(node.finalizer)
          }
        break

        case "IfStatement":
          visit(node.consequent)
          if(node.alternate) {
            visit(node.alternate)
          }
        break

        case "SwitchStatement":
          for(var i=0; i<node.cases.length; ++i) {
            visit(node.cases[i].consequent)
          }
        break

        case "ForStatement":
          if(node.init && node.init.type === "VariableDeclaration") {
            visit(node.init)
          }
          visit(node.body)
        break

        case "ForInStatement":
          if(node.init.type === "VariableDeclaration") {
            visit(node.init)
          }
          visit(node.body)
        break

        case "VariableDeclaration":
          for(var i=0; i<node.declarations.length; ++i) {
            vars.push(node.declarations[i].id.name)
          }
        break

        case "FunctionDeclaration":
          vars.push(node.id.name)
        break

        default:
          throw new Error("control-flow: Unrecognized statement type " + node.type)
      }
    }
  }
  visit(node)
  return uniq(vars)
}
