"use strict"

module.exports = analyzeClosure

var getVariables      = require("./get-vars")
var types             = require("./types")

var Closure           = types.Closure
var Variable          = types.Variable
var VariableId        = types.VariableId
var Literal           = types.Literal
var Builtin           = types.Builtin
var Block             = types.Block
var UnaryOperator     = types.UnaryOperator
var BinaryOperator    = types.BinaryOperator
var JumpTerminator    = types.JumpTerminator
var IfTerminator      = types.IfTerminator
var CallTerminator    = types.CallTerminator
var ReturnTerminator  = types.ReturnTerminator
var ThrowTerminator   = types.ThrowTerminator

function analyzeClosure(node, environment) {
  var counter = 0

  var name = "Anonymous"
  var vars = []
  var args = []
  var blocks = []
  var returnValue, throwValue
  var enter, exit, raise

  function temporary(node) {
    var id = "~" + (counter++)
    var v = new Variable(id, true, [])
    if(node) {
      v.nodes.push(node)
    }
    vars.push(v)
    return new VariableId(id, node)
  }

  function block(body, terminator) {
    var n = blocks.length
    var b = new Block(n, body, terminator)
    blocks.push(b)
    return n
  }

  function getVariable(name, node) {
    for(var i=0; i<vars.length; ++i) {
      if(vars[i].id === name) {
        if(node) {
          vars[i].nodes.push(node)
        }
        return new VariableId(name, node)
      }
    }
    throw new Error("control-flow: Variable " + name + " not found")
  }

  //Construct exit block
  returnValue = temporary(node)
  exit = block([], new ReturnTerminator(returnValue, node))

  //Construct throw block
  throwValue = temporary(node)
  raise = block([], new ThrowTerminator(throwValue, node))

  //Handle root node type
  var body
  vars.push(new Variable("this", true, []))
  if(node.type === "Program") {
    body = node.body
    environment.global = new VariableId("~global", node)
  } else if(node.type === "FunctionDeclaration" || 
            node.type === "FunctionExpression") {
    if(node.id) {
      name = node.id
    }
    for(var i=0; i<node.params; ++i) {
      var v = new Variable(node.params[i].name, true, [node.params[i]])
      vars.push(v)
      args.push(new VariableId(node.params[i].name, node.params[i]))
    }
    body = node.body.body
  } else {
    throw new Error("control-flow: Invalid node type for closure")
  }

  //Hoist all variable identifiers
  var varIds = getVariables(body)
  for(var i=0; i<varIds.length; ++i) {
    vars.push(new Variable(varIds[i], true, []))
  }

  //List of all pending closurers
  var pendingClosures = []
  function processBlock(body, env) {
    var cblock = blocks[ block([], null) ]
    var ops = cblock.body
    var retVal = cblock.id

    if(!Array.isArray(body)) {
      body = [ body ]
    }

    function makeEnv(opts) {
      var nenv = {}
      for(var id in env) {
        nenv[id] = env[id]
      }
      nenv.root = false
      if(opts) {
        for(var id in opts) {
          nenv[id] = opts[id]
        }
      }
      return nenv
    }

    function splitBlock(terminator) { 
      var nblock = blocks[block([], null)]
      cblock.terminator = terminator
      ops = nblock.body
      cblock = nblock
    }

    function emitCall(dest, callee, object, args, node) {
      var nterm = new CallTerminator(
        callee, 
        object, 
        args, 
        dest, 
        blocks.length, 
        env.exception, 
        env.catch,
        node)
      splitBlock(nterm) 
    }

    function emitGet(dest, object, prop, node) {
      var nterm = new GetTerminator(
        object,
        prop,
        dest,
        blocks.length,
        env.exception,
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitSet(dest, object, prop, value, node) {
      var nterm = new SetTerminator(
        object,
        prop,
        value,
        dest,
        blocks.length,
        env.exception,
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitDelete(dest, object, prop, node) {
      var nterm = new DeleteTerminator(
        object,
        prop,
        dest,
        blocks.length,
        env.exception,
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitHas(dest, object, prop, node) {
      var nterm = new HasTerminator(
        object,
        prop,
        dest,
        blocks.length,
        env.exception,
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitNew(dest, ctor, args, node) {
      var nterm = new NewTerminator(
        ctor, 
        args, 
        dest, 
        blocks.length, 
        env.exception, 
        env.catch,
        node)
      splitBlock(nterm) 
    }

    function assign(dest, src, node) {
      ops.push(new UnaryOperator("", dest, src, node))
    }

    function processExpression(node) {
      switch(node.type) {
        case "ThisExpression":
          return getVariable("this", node)
        break

        case "MemberExpression":
          var o = processExpression(node.object)
          var r = temporary(node)
          if(!node.computed) {
            emitGet(r, o, new Literal(node.property.name, node.property), node)
          } else {
            emitGet(r, o, processExpression(node.property), node)
          }
          return r
        break

        case "Identifier":
          //TODO: Handle with statement
          return getVariable(node.name, node)
        break

        case "Literal":
          return new Literal(node.value, node)
        break

        case "FunctionExpression":
          var r = temporary(node)
          pendingClosures.push({ id: r, closure: node })
          return r
        break

        case "SequenceExpression":
          var r
          for(var i=0; i<node.expressions.length; ++i) {
            r = processExpression(node.expressions[i])
          }
          return r
        break

        case "UnaryExpression":
          if(node.operator === "delete") {
            if(node.argument.type === "MemberExpression") {
              var o = processExpression(node.argument.object)
              var p
              if(node.argument.computed) {
                p = processExpression(node.argument.property)
              } else {
                p = new Literal(node.argument.property.name, node.argument.property)
              }
              var r = temporary(node)
              emitDelete(r, o, p)
              return r
            } else {
              processExpression(node.argument)
              return new Literal(false, node)
            }
          } else if(node.operator === "void") {
            processExpression(node.argument)
            return new Literal(undefined, node)
          } else {
            var r = temporary(node)
            ops.push(new UnaryOperator(node.operator, r, processExpression(node.argument), node))
            return r
          }
        break

        case "BinaryExpression":
          var r = temporary(node)
          var a = processExpression(node.left)
          var b = processExpression(node.right)
          if(node.operator === "in") {
            emitHas(r, b, a, node)
          } else {
            ops.push(new BinaryOperator(node.operator, r, a, b, node))
          }
          return r
        break

        case "AssignmentExpression":
          var a = processExpression(node.right)
          if(node.left.type === "MemberExpression") {
            var r = temporary(node)
            var o = processExpression(node.left.object)
            if(node.operator !== "=") {
              var v = temporary(node.left)
              if(node.left.property.type === "Identifier" && !node.left.computed) {
                emitGet(v, o, new Literal(node.left.property.name, node.left.property), node)
              } else {
                emitGet(v, o, processExpression(node.left.property), node)
              }
              var tok = node.operator
              ops.push(new BinaryOperator(tok.substr(0, tok.length-1), v, v, a, node))
              a = v
            }
            if(node.left.property.type === "Identifier" && !node.left.computed) {
              emitSet(r, o, new Literal(node.left.property.name, node.left.property), a)
            } else {
              emitSet(r, o, processExpression(node.left.property), a)
            }
            return r
          } else {
            //TODO: Handle with statement
            var b = processExpression(node.left)
            if(node.operator === "=") {
              assign(b, a, node)
            } else {
              var tok = node.operator
              ops.push(new BinaryOperator(tok.substr(0, tok.length-1), b, b, a, node))
            }
            return b
          }
        break

        case "UpdateExpression":
          var tok
          if(node.operator === "++") {
            tok = "+"
          } else if(node.operator === "--") {
            tok = "-"
          }
          if(node.argument.type === "MemberExpression") {
            //TODO
          } else {
            //TODO: Handle with statement
            if(node.prefix) {
              var r = processExpression(node.argument)
              ops.push(new BinaryOperator(tok, r, r, new Literal(1, node), node))
              return r
            } else {
              var r = temporary(node)
              var a = processExpression(node.argument)
              assign(r, n)
              ops.push(new BinaryOperator(tok, a, a, new Literal(1, node), node))
              return r
            }
          }
        break

        case "LogicalExpression":
          var a = processExpression(node.left)
          var r = temporary(node)
          assign(r, a, node)
          var s = new IfTerminator(r, 0, 0, node)
          var x = blocks.length
          splitBlock(s)
          var b = processExpression(node.right)
          assign(r, b, node)
          var y = blocks.length
          var t = new JumpTerminator(y, node)
          splitBlock(t)
          if(node.operator === "||") {
            s.consequent = y
            s.alternate = x
          } else if(node.operator === "&&") {
            s.consequent = x
            s.alternate = y
          } else {
            throw new Error("control-flow: Unrecognized logical operator")
          }
          return r
        break

        case "ConditionalExpression":
          var a = processExpression(node.test)
          var r = temporary(node)
          var s = new IfTerminator(a, blocks.length, 0, node)
          splitBlock(s)
          var b = processExpression(node.consequent)
          assign(r, b, node)
          s.alternate = blocks.length
          var t = new JumpTerminator(0, node)
          splitBlock(t)
          var c = processExpression(node.alternate)
          assign(r, c, node)
          var x = blocks.length
          t.next = x
          var u = new JumpTerminator(x, node)
          splitBlock(u)
          return r
        break

        case "CallExpression":
          var r = temporary(node)
          var o, f
          if(node.callee.type === "MemberExpression") {
            o = processExpression(node.callee.object)
            f = temporary(node.callee)
            if(node.callee.computed) {
              emitGet(f, o, processExpression(node.callee.property), node)
            } else {
              emitGet(f, o, new Literal(node.callee.property.name, node.callee), node.callee)
            }
          } else {
            //TODO: Handle with statement
            o = env.global
            f = processExpression(node.callee)
          }
          var args = new Array(node.arguments.length)
          for(var i=0; i<node.arguments.length; ++i) {
            args[i] = processExpression(node.arguments[i])
          }
          emitCall(r, f, o, args)
          return r
        break

        case "NewExpression":
          //TODO
        break

        case "ArrayExpression":
          //TODO
        break

        case "ObjectExpression":
          //TODO
        break


        default:
          throw new Error("control-flow: Unrecognized expression type: " + node.type)
      }
    }

    function processStatement(stmt) {
      switch(stmt.type) {
        case "EmptyStatement":
        break

        case "BlockStatement":
          for(var i=0; i<stmt.body.length; ++i) {
            processStatement(stmt.body[i])
          }
        break

        case "ExpressionStatement":
          var r = processExpression(stmt.expression)
          if(env.root) {
            assign(returnValue, r, stmt)
          }
        break

        case "IfStatement":
          var test = processExpression(stmt.test)
          var term = new IfTerminator(test, 0, 0, stmt)
          var next = blocks.length
          splitBlock(term)
          term.consequent = processBlock(stmt.consequent, makeEnvironment({next: next}))
          if(stmt.alternate) {
            term.alternate = processBlock(stmt.alternate, makeEnvironment({next: next}))
          } else {
            term.alternate = next
          }
          env.next = pnext
        break

        case "LabelStatement":
          //TODO: Store label
        break

        case "BreakStatement":
          //TODO: Handle break statement
        break

        case "ContinueStatement":
          //TODO: Handle continue statement
        break

        case "WithStatement":
          //TODO: Handle with statement
          throw new Error("control-flow: with(){} statement not yet supported")
        break

        case "SwitchStatement":
          //TODO: Handle switch statement
        break

        case "ReturnStatement":
          assign(returnValue, processExpression(stmt.argument), stmt)
          splitBlock(new JumpTerminator(exit, stmt))
        break

        case "ThrowStatement":
          assign(env.exception, processExpression(stmt.argument), stmt)
          splitBlock(new JumpTerminator(env.catch, stmt))
        break

        case "TryStatement":
          //TODO: Handle try statement
        break

        case "WhileStatement":
          //TODO: Handle while statement
        break

        case "DoWhileStatement":
          //TODO: Handle do-while statement
        break

        case "ForStatement":
          //TODO: Handle for statement
        break

        case "ForInStatement":
          //TODO: Handle for-in statement
        break

        case "VariableDeclaration":
          for(var i=0; i<stmt.declarations.length; ++i) {
              if(stmt.declarations[i].init) {
                //TODO: Handle with statement
                var v = processExpression(stmt.declarations[i].id)
                var r = processExpression(stmt.declarations[i].init)
                assign(v, r, stmt.declarations[i])
                if(env.root && i === stmt.declarations.length-1) {
                  assign(returnValue, r, stmt.declarations[i])
                }
              } else if(env.root && i === stmt.declarations.length-1) {
                assign(returnValue, new Literal(undefined, stmt.declarations[i]), stmt.declarations[i])
              }
          }
        break

        case "FunctionDeclaration":
          //TODO: Handle with statement
          var tmp = temporary(stmt)
          pendingClosures.push({id: tmp, closure: stmt, environment: makeEnv})
          var r = processExpression(closure.id)
          assign(r, tmp, stmt)
          if(env.root) {
            assign(returnValue, r, stmt)
          }
        break

        default:
          throw new Error("control-flow: Unsupported statement type")
      }
    }
    for(var i=0; i<body.length; ++i) {
      processStatement(body[i])
    }
    cblock.terminator = new JumpTerminator(exit, body[body.length-1])
    return retVal
  }
  enter = processBlock(body, {
      next: exit,
      exception: throwValue,
      catch: raise,
      global: environment.global,
      root: node.type === "Program"
    })

  //Process all pending closures and lambdas
  var closures = pendingClosures.map(function(cl) {
    return {
      id: cl.id,
      closure: analyzeClosure(cl.closure, cl.environment)
    }
  })

  vars.sort(function(a,b) {
    if(a.id < b.id) {
      return -1
    } else if(a.id === b.id) {
      return 0
    }
    return 1
  })

  return new Closure(
    name,
    vars,
    args,
    closures,
    enter,
    exit,
    raise,
    blocks,
    node)
}