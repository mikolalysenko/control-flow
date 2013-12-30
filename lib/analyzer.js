"use strict"

var types = require("./types")

var Closure           = types.Closure
var Variable          = types.Variable
var Literal           = types.Literal
var Block             = types.Block
var UnaryOperator     = types.UnaryOperator
var BinaryOperator    = types.BinaryOperator
var JumpTerminator    = types.JumpTerminator
var IfTerminator      = types.IfTerminator
var CallTerminator    = types.CallTerminator
var ReturnTerminator  = types.ReturnTerminator
var ThrowTerminator   = types.ThrowTerminator

function Analyzer() {
  this.counter = 0
}

var proto = Analyzer.prototype

proto.createTemporaryId = function() {
  var id = "~" + (this.counter++)
  return new Variable(id)
}

proto.analyzeClosure = function(node, environment) {
  var analyzer = this

  var name = "Anonymous"
  var vars = []
  var args = []
  var object = null
  var children = []
  var blocks = []
  var returnValue, throwValue
  var enter, exit, raise
  
  function variable(id) {
    for(var i=0; i<vars.length; ++i) {
      if(vars[i].id === id) {
        return id
      }
    }
    var v = new Variable(id)
    vars.push(v)
    return id
  }

  function temporary() {
    return variable(analyzer.createTemporaryId())
  }

  function block(body, terminator, range, loc) {
    var n = blocks.length
    var b = new Block(n, body, terminator, range, loc)
    blocks.push(b)
    return n
  }

  //Construct exit block
  returnValue = temporary()
  exit = block([], new ReturnTerminator(returnValue))

  //Construct throw block
  throwValue = temporary()
  raise = block([], new ThrowTerminator(throwValue))

  //Handle root node type
  var body
  if(node.type === "Program") {
    object = variable(analyzer.global)
    body = node.body
  } else if(node.type === "FunctionDeclaration" || 
            node.type === "FunctionExpression") {
    if(node.id) {
      name = node.id
    }
    object = variable("this")
    for(var i=0; i<node.params; ++i) {
      args.push(variable(node.name))
    }
    body = node.body.body
  } else {
    throw new Error("control-flow: Invalid node type for closure")
  }

  var pendingClosures = []

  function processBlock(body, env) {
    var cblock = blocks[ block([], null) ]
    var ops = cblock.body
    var retVal = cblock.id

    function splitBlock(terminator) { 
      var nblock = blocks[ block([], null) ]
      cblock.terminator = terminator

      //Update block
      ops = nblock.ops
      cblock = nblock
    }

    function emitGet(dest, object, prop, node) {
      var nterm = new CallTerminator(
        "!Get", 
        object, 
        [ prop ], 
        dest, 
        blocks.length, 
        env.exception, 
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitSet(dest, object, prop, value, node) {
      var nterm = new CallTerminator(
        "!Set", 
        object, 
        [ prop, value ], 
        dest, 
        blocks.length, 
        env.exception, 
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitNew(dest, ctor, args, node) {
      var nterm = new CallTerminator(
        "!New", 
        ctor, 
        args, 
        dest, 
        blocks.length, 
        env.exception, 
        env.catch,
        node)
      splitBlock(nterm)
    }

    function emitCall(dest, callee, object, args) {
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

    function lookupIdentifier(node) {
    }

    function processExpression(node) {
      switch(node.type) {
        case "ThisExpression":
          return object
        break

        case "MemberExpression":
          var o = processExpression(node.object)
          var r = temporary()
          if(node.property.type === "Identifier" && !node.computed) {
            emitGet(r, o, new Literal(node.property.name, node.property), node)
          } else {
            emitGet(r, o, processExpression(node.property), node)
          }
          return r
        break

        case "Identifier":
          return lookupIdentifier(node)
        break

        case "Literal":
          return new Literal(node.value, node)
        break

        case "ArrayExpression":
        break

        case "ObjectExpression":
        break

        case "FunctionExpression":
          var r = temporary()
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
            //TODO: Process delete operator
          } else if(node.operator === "void") {
            processExpression(node.argument)
            return new Literal(undefined, node)
          } else {
            var r = temporary()
            ops.push(new UnaryOperator(node.operator, r, processExpression(node.argument), node))
          }
        break

        case "BinaryExpression":
          var r = temporary()
          var a = processExpression(node.left)
          var b = processExpression(node.right)
          ops.push(new BinaryOperator(node.operator, r, a, b, node))
          return r
        break

        case "AssignmentExpression":
          //TODO
        break

        case "UpdateExpression":
          //TODO
        break

        case "LogicalExpression":
          //TODO
        break

        case "ConditionalExpression":
          //TODO
        break

        case "NewExpression":
          //TODO
        break

        case "CallExpression":
          //TODO
        break

        default:
          throw new Error("control-flow: Unrecognized expression type: " + node.type)
      }
    }

    for(var i=0; i<body.length; ++i) {
      var stmt = body[i]
      switch(stmt.type) {
        case "EmptyStatement":
        break

        case "BlockStatement":
          //TODO: Splice block into body
        break

        case "ExpressionStatement":
          //TODO: Handle expression statement
        break

        case "IfStatement":
          //TODO: Handle if statement here
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
        break

        case "SwitchStatement":
          //TODO: Handle switch statement
        break

        case "ReturnStatement":
          //TODO: Handle return statement
        break

        case "ThrowStatement":
          //TODO: Handle throw statement
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

        case "ForInStatement"
        break

        case "VariableDeclaration":
        break

        case "FunctionDeclaration":
        break

        default:
          throw new Error("control-flow: Unsupported statement type")
      }
    }

    cblock.terminator = new JumpTerminator(exit)
    return retVal
  }
  enter = processBlock(body, exit, except)

  return new Closure(
    name,
    vars,
    args,
    object,
    children,
    enter,
    exit,
    except,
    blocks,
    node)
}