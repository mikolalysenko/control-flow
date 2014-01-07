"use strict"

module.exports = analyzeClosure

var extractVariables  = require("./get-vars")
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
  var strictMode = !!environment.strict
  var returnValue, throwValue
  var enter, exit, raise

  function clone(variable) {
    if(variable.type === "VariableId") {
      return new VariableId(variable.id, variable.node)
    } else if(variable.type === "Literal") {
      return new Literal(variable.value, variable.node)
    }
  }

  function temporary(node) {
    var id = "~" + (counter++)
    var v = new Variable(id, [])
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

  //Construct exit block
  returnValue = temporary(node).id
  exit = block([], new ReturnTerminator(new VariableId(returnValue, node), node))

  //Construct throw block
  throwValue = temporary(node).id
  raise = block([], new ThrowTerminator(new VariableId(throwValue, node), node))

  //Handle root node type
  var body
  vars.push(new Variable("this", []))
  if(node.type === "Program") {
    body = node.body
    vars.push(new Variable("~global", [node]))
  } else if(node.type === "FunctionDeclaration" || 
            node.type === "FunctionExpression") {
    if(node.id) {
      name = node.id
    }
    for(var i=0; i<node.params; ++i) {
      var v = new Variable(node.params[i].name, [node.params[i]])
      vars.push(v)
      args.push(new VariableId(node.params[i].name, node.params[i]))
    }
    body = node.body.body
  } else {
    throw new Error("control-flow: Invalid node type for closure")
  }

  //Hoist all variable identifiers
  var varIds = extractVariables(body)
  for(var i=0; i<varIds.length; ++i) {
    vars.push(new Variable(varIds[i], []))
  }

  //List of all pending closurers
  var pendingClosures = []
  var firstStatement = true
  function processBlock(body, env) {
    var cblock = blocks[ block([], null) ]
    var ops = cblock.body
    var retVal = cblock.id

    if(!Array.isArray(body)) {
      body = [ body ]
    }

    //For the first object, need to store global variable
    if(env.first) {
      env.first = false
      assign(new VariableId("~global", body[0]), new VariableId("this", body[0]), body[0])
    }

    //Retrieve an identifier
    function lookupIdentifier(name, node) {
      var v = new VariableId(name, node)
      var usingWith = false
      var pendingJumps = []
      for(var cenv = env; cenv; cenv = cenv.parent) {
        for(var i=0; i<cenv.vars.length; ++i) {
          if(cenv.vars[i].id === name) {
            if(node) {
              cenv.vars[i].nodes.push(node)
            }
            return clone(v)
          }
          if(usingWith) {
            assign(clone(v), new VariableId(name, node), node)
            var jmp = new JumpTerminator(0, node)
            pendingJumps.push(jmp)
            for(var i=0; i<pendingJumps.length; ++i) {
              pendingJumps[i].next = blocks.length
            }
            splitBlock(jmp)
          }
        }
        if(name.charAt(0) !== "~" && cenv.withObject) {
          if(v.charAt(0) !== "~") {
            v = temporary(node)
          }
          usingWith = true
          var c = temporary(node)
          emitHas(c, new VariableId(cenv.withObject, node), new Literal(name, node), node)
          splitBlock(new IfTerminator(clone(c), blocks.length, blocks.length+2, node))
          emitGet(clone(v), new VariableId(cenv.withObject, node), new Literal(name, node), node)
          var jmp = new JumpTerminator(0, node)
          splitBlock(jmp)
          pendingJumps.push(jmp)
        }
      }
      if(usingWith) {
        emitGet(clone(v), new VariableId("~global", node), new Literal(name, node), node)
        var jmp = new JumpTerminator(0, node)
        pendingJumps.push(jmp)
        for(var i=0; i<pendingJumps.length; ++i) {
          pendingJumps[i].next = blocks.length
        }
        splitBlock(jmp)
        return clone(v)
      } else {
        var r = temporary(node)
        emitGet(r, new VariableId("~global", node), new Literal(name, node), node)
        return clone(r)
      }
    }

    function setVariable(name, value, node) {
      //TODO
    }

    function makeEnv(opts) {
      var nenv = {}
      for(var id in env) {
        nenv[id] = env[id]
      }
      nenv.vars = []
      nenv.label = null
      nenv.withObject = null
      nenv.isSwitch = false
      if(opts) {
        for(var id in opts) {
          nenv[id] = opts[id]
        }
      }
      nenv.parent = env
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

    function lookupLabel(label) {
      for(var cenv = env; cenv; cenv = cenv.parent) {
        if(cenv.label === label) {
          return cenv
        }
      }
      throw new Error("control-flow: Label not found: " + label)
    }

    function processExpression(node) {
      switch(node.type) {
        case "ThisExpression":
          for(var i=0; i<vars.length; ++i) {
            if(vars[i].id === "this") {
              vars[i].nodes.push(node)
              break
            }
          }
          return new VariableId("this", node)
        break

        case "MemberExpression":
          var o = processExpression(node.object)
          var r = temporary(node)
          if(!node.computed) {
            emitGet(r, o, new Literal(node.property.name, node.property), node)
          } else {
            emitGet(r, o, processExpression(node.property), node)
          }
          return clone(r)
        break

        case "Identifier":
          return lookupIdentifier(node.name, node)
        break

        case "Literal":
          return new Literal(node.value, node)
        break

        case "FunctionExpression":
          var r = temporary(node)
          pendingClosures.push({ 
            id: r, 
            closure: node, 
            environment: makeEnv({
              root: false
            }) })
          return clone(r)
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
              return clone(r)
            } else {
              if(node.argument.type === "Identifier") {
                var r = temporary(node)
                var p = new Literal(node.argument.property.name, node.argument.property)
                var pendingIfs = []
                for(var cenv = env; cenv; cenv=cenv.parent) {
                  if(cenv.withObject) {
                    emitDelete(clone(r), 
                      new VariableId(cenv.withObject, node), 
                      new Literal(p.value, p.node), 
                      node)
                    var ift = new IfTerminator(clone(r), 0, blocks.length-1, node)
                    pendingIfs.push(ift)
                    splitBlock(ift)
                  }
                }
                emitDelete(clone(r), 
                  new VariableId("~global", node), 
                  new Literal(p.value, p.node), 
                  node)
                for(var i=0; i<pendingIfs.length; ++i) {
                  pendingIfs[i].consequent = blocks.length-1
                }
                return clone(r)
              } else {
                var r = temporary(node)
                ops.push(new UnaryOperator("!", r, processExpression(node.argument), node))
                ops.push(new UnaryOperator("!", clone(r), clone(r), node))
                return clone(r)
              }
            }
          } else if(node.operator === "void") {
            processExpression(node.argument)
            return new Literal(undefined, node)
          } else {
            var r = temporary(node)
            ops.push(new UnaryOperator(node.operator, r, processExpression(node.argument), node))
            return clone(r)
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
          return clone(r)
        break

        case "AssignmentExpression":
          var a = processExpression(node.right)
          if(node.left.type === "MemberExpression") {
            var o = processExpression(node.left.object)
            var p
            if(node.left.computed) {
              p = new Literal(node.left.property.name, node.left.property)
            } else {
              p = processExpression(node.left.property)
            }
            if(node.operator !== "=") {
              var v = temporary(node.left)
              emitGet(v, clone(o), clone(p), node)
              var tok = node.operator
              ops.push(new BinaryOperator(tok.substr(0, tok.length-1), clone(v), clone(v), a, node))
              a = clone(v)
            }
            var r = temporary(node)
            emitSet(r, o, p, a, node)
            return clone(r)
          } else if(node.left.type === "Identifier") {
            if(node.operator === "=") {
              setVariable(node.left.name, a, node)
              return clone(a)
            } else {
              var tok = node.operator
              var tmp = temporary(node)
              ops.push(new BinaryOperator(tok.substr(0, tok.length-1), tmp, processExpression(node.left), a, node))
              setVariable(node.left.name, clone(tmp), node)
              return clone(tmp)
            }
          } else {
            throw new Error("control-flow: Invalid left hand side expression")
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
            var o = processExpression(node.argument.object)
            var p
            if(node.argument.computed) {
              p = new Literal(node.argument.property.name, node.argument.property)
            } else {
              p = processExpression(node.argument.property)
            }
            var v = temporary(node)
            emitGet(v, o, p, node.argument)
            var r = temporary(node)
            ops.push(new BinaryOperator(tok, r, clone(v), new Literal(1, node), node))
            emitSet(clone(r), clone(o), clone(p), clone(r), node)
            if(node.prefix) {              
              return clone(r)
            } else {
              return clone(v)
            }
          } else if(node.argument.type === "Identifier") {
            var r = temporary(node)
            var s = clone(r)
            var v = lookupIdentifier(node.argument.name, node.argument)
            if(!node.prefix) {
              s = temporary(node)
            }
            ops.push(new BinaryOperator(tok, s, r, new Literal(1, node), node))
            setVariable(node.argument.name, clone(s), node)
            return clone(r)
          } else {
            throw new Error("control-flow: Unknown argument type in update expression")
          }
        break

        case "LogicalExpression":
          var r = temporary(node)
          assign(r, processExpression(node.left), node)
          var s = new IfTerminator(clone(r), 0, 0, node)
          var x = blocks.length
          splitBlock(s)
          assign(clone(r), processExpression(node.right), node)
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
          return clone(r)
        break

        case "ConditionalExpression":
          var r = temporary(node)
          var s = new IfTerminator(processExpression(node.test), blocks.length, 0, node)
          splitBlock(s)
          assign(r, processExpression(node.consequent), node)
          s.alternate = blocks.length
          var t = new JumpTerminator(0, node)
          splitBlock(t)
          assign(clone(r), processExpression(node.alternate), node)
          var x = blocks.length
          t.next = x
          var u = new JumpTerminator(x, node)
          splitBlock(u)
          return clone(r)
        break

        case "CallExpression":
          var o, f
          if(node.callee.type === "MemberExpression") {
            o = processExpression(node.callee.object)
            f = temporary(node.callee)
            if(node.callee.computed) {
              emitGet(f, o, processExpression(node.callee.property), node)
            } else {
              emitGet(f, o, new Literal(node.callee.property.name, node.callee), node.callee)
            }
          } else if(node.callee.type === "Identifier") {
            o = temporary(node.callee)
            f = temporary(node.callee)
            var r = temporary(node.callee)
            var boundVariable = false
            var pendingGets = []
outer:      for(var cenv=env; cenv; cenv=cenv.parent) {
              for(var i=0; i<cenv.vars.length; ++i) {
                var v = cenv.vars[i]
                if(v.id === node.callee.name) {
                  v.nodes.push(node.callee)
                  if(cenv !== env) {
                    v.local = false
                  }
                  assign(clone(f), new VariableId(node.callee.name, node.callee), node.callee)
                  boundVariable = true
                  break outer
                }
              }
              if(cenv.withObject) {
                assign(clone(o), 
                  new VariableId(cenv.withObject, node.callee), 
                  node.callee)
                var x = temporary(node.callee)
                emitHas(x, 
                  clone(o), 
                  new Literal(node.callee.name, node.callee),
                  node.callee)
                splitBlock(new IfTerminator(
                  clone(x), 
                  blocks.length, 
                  blocks.length+1, 
                  node.callee))
                emitGet(clone(f), 
                  clone(o), 
                  new Literal(node.callee.name, node.callee), 
                  node.callee)
                pendingGets.push(blocks[blocks.length-2].terminator)
              }
            }
            assign(clone(o), new VariableId("~global", node.callee), node.callee)
            if(!boundVariable) {
              emitGet(clone(f), clone(o), new Literal(node.callee.name, node.callee), node.callee)
            }
            for(var i=0; i<pendingGets.length; ++i) {
              pendingGets[i].next = blocks.length-1
            }
          } else {
            o = new VariableId("~global", node.callee)
            f = processExpression(node.callee)
          }
          var args = new Array(node.arguments.length)
          for(var i=0; i<node.arguments.length; ++i) {
            args[i] = processExpression(node.arguments[i])
          }
          var r = temporary(node)
          emitCall(clone(r), clone(f), clone(o), args)
          return clone(r)
        break

        case "NewExpression":
          var args = new Array(node.arguments.length)
          for(var i=0; i<node.arguments.length; ++i) {
            args[i] = processExpression(node.arguments[i])
          }
          var r = temporary(node)
          emitNew(r, processExpression(node.callee), args, node)
          return clone(r)
        break

        case "ArrayExpression":
          var arr = temporary(node)
          emitGet(arr,
            new VariableId("~global", node),
            new Literal("Array", node),
            node)
          var r = temporary(node)
          emitNew(r, 
            clone(arr), 
            [ new Literal(node.expression.length, node) ], 
            node)
          var v = temporary(node)
          for(var i=0; i<node.elements.length; ++i) {
            emitSet(
              clone(v), 
              clone(r), 
              new Literal(i, node.elements[i]), 
              processExpression(node.elements[i]), 
              node.elements[i])
          }
          return clone(r)
        break

        case "ObjectExpression":
          var obj = temporary(node)
          emitGet(
            obj, 
            new VariableId("~global", node), 
            new Literal("Object", node),
            node)
          var r = temporary(node)
          emitNew(
            r, 
            clone(obj), 
            [], 
            node)
          var v = temporary(node)
          for(var i=0; i<node.properties.length; ++i) {
            var prop = node.properties[i]
            if(prop.kind !== "init") {
              throw new Error("control-flow: Unknown kind for property")
            }
            var p
            if(prop.key.type === "Identifier") {
              p = new Literal(prop.key.name, prop.key)
            } else {
              p = processExpression(prop.key)
            }
            emitSet(
              clone(v), 
              clone(r), 
              p, 
              processExpression(prop.value), 
              prop.value)
          }
          return clone(r)
        break

        default:
          throw new Error("control-flow: Unrecognized expression type: " + node.type)
      }
    }

    function processStatement(stmt, label) {
      var isFirst = firstStatement
      firstStatement = false
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
          //Check if we should enable strict mode
          if(isFirst && 
             r.type === "Literal" && 
             r.value === "use strict") {
            strictMode = env.strict = true
          }
          if(env.root) {
            setVariable(env.returnValue, r, stmt)
          }
        break

        case "IfStatement":
          var test = processExpression(stmt.test)
          var term = new IfTerminator(test, 0, 0, stmt)
          var next = blocks.length
          splitBlock(term)
          term.consequent = processBlock(stmt.consequent, makeEnv({
            next: next
          }))
          if(stmt.alternate) {
            term.alternate = processBlock(stmt.alternate, makeEnv({
              next: next
            }))
          } else {
            term.alternate = next
          }
          env.next = pnext
        break

        case "LabelStatement":
          processStatement(node.body, node.label.name)
        break

        case "BreakStatement":
          if(node.label) {
            var e = lookupLabel(node.label.name)
            splitBlock(new JumpTerminator(e.breakBlock, node))
          } else {
            splitBlock(new JumpTerminator(env.breakBlock, node))
          }
        break

        case "ContinueStatement":
          if(node.label) {
            var e = lookupLabel(node.label.name)
            if(e.isSwitch) {
              throw new Error("control-flow: Can't continue from switch statement")
            }
            splitBlock(new JumpTerminator(e.continueBlock, node))
          } else {
            splitBlock(new JumpTerminator(env.continueBlock, node))
          }
        break

        case "WithStatement":
          var obj = processExpression(node.object)
          splitBlock(new JumpTerminator(blocks.length, node))
          processBlock(node.body, makeEnv({
            next: cblock.id,
            withObject: obj.id
          }))
        break

        case "SwitchStatement":
          var discr = processExpression(node.discriminant)
          var jmpToSwitchHead = new JumpTerminator(0, node)
          splitBlock(jmpToSwitchHead)
          var jmpToSwitchBreak = new JumpTerminator(0, node)
          var switchBreak, switchNext
          splitBlock(jmpToSwitchBreak)
          switchBreak = switchNext = blocks.length - 1
          for(var i=node.cases.length-1; i>=0; --i) {
            var c = node.cases[i]
            var n = blocks.length-1
            if(c.test) {
              var r = processExpression(c.test)
              var cmp = temporary(c)
              ops.push(new BinaryOperator(
                "===", 
                cmp, 
                r, 
                new VariableId(discr.id, c), 
                c))
              splitBlock(new IfTerminator(
                clone(cmp), 
                processBlock(
                  c.consequent,
                  makeEnv({
                    next: switchNext,
                    breakBlock: switchBreak,
                    label: label || null,
                    isSwitch: true
                  }),
                switchNext,
                c)))
            } else {
              splitBlock(new JumpTerminator(
                processBlock(
                  c.consequent,
                  makeEnv({
                    next: switchNext,
                    breakBlock: switchBreak,
                    label: label || null,
                    isSwitch: true
                  }))
                ))
            }
            switchNext = n
          }
          jmpToSwitchHead.next = switchNext
          jmpToSwitchBreak.next = blocks.length - 1
        break

        case "ReturnStatement":
          setVariable(env.returnValue, processExpression(stmt.argument), stmt)
          splitBlock(new JumpTerminator(exit, stmt))
        break

        case "ThrowStatement":
          setVariable(env.exception, processExpression(stmt.argument), stmt)
          splitBlock(new JumpTerminator(env.catch, stmt))
        break

        case "TryStatement":
          //Create enter and exit blocks for try statement
          var jmpToStart = new JumpTerminator(0, node)
          splitBlock(jmpToStart)
          var jmpToEnd = new JumpTerminator(0, node)
          var next = blocks.length-1
          splitBlock(jmpToEnd)

          //Generate finally block
          var finallyBlock
          if(node.finalizer) {
            finallyBlock = processBlock(node.finalizer, makeEnv({
              next: next
            }))
          } else {
            finallyBlock = next
          }
          
          //Get handler
          var handler = node.handler
          if(!handler && node.handlers && node.handlers.length > 0) {
            handler = node.handlers[0]
          }

          //Generate catch block
          var catchBlock
          var exception = temporary(node)
          if(handler) {
            //FIXME: Handle catch scope by renaming variable
            catchBlock = blocks.length - 1
            setVariable(handler.param.name, exception, handler.param)
            splitBlock(new JumpTerminator(
              processBlock(handler.body, makeEnv({
                next: finallyBlock
              })),
              handler))
          } else if(node.finalizer) {
            var rethrow = cblock.id
            setVariable(env.exception, exception, node)
            splitBlock(new JumpTerminator(env.catch, node))
            catchBlock = processBlock(node.finalizer, makeEnv({
              next: rethrow
            }))
          } else {
            throw new Error("control-flow: Unsupported try/catch block construct")
          }

          //Generate main try block
          var tryBlock = processBlock(node.block, makeEnv({
            next: finallyBlock,
            exception: exception.id,
            catch: catchBlock
          }))
          
          //Fix up links
          jmpToStart.next = tryBlock
          jmpToEnd.next = cblock.id
        break

        case "WhileStatement":
          var loopStart = blocks.length
          var loopExit = blocks.length + 1
          splitBlock(new JumpTerminator(loopStart, node))
          var ifHead = new IfTerminator(
            processExpression(loop.test), 
            0,
            loopExit,
            node)
          splitBlock(ifHead)
          var loopBody = processBlock(node.body, makeEnv({
            next: loopStart,
            continueBlock: loopStart,
            breakBlock: loopExit,
            label: label || null
          }))
          ifHead.consequent = loopBody
        break

        case "DoWhileStatement":
          var loopStart = blocks.length
          var loopExit = blocks.length + 1
          var jmpStart = new JumpTerminator(0, node)
          splitBlock(jmpStart)
          var ifHead = new IfTerminator(
            processExpression(loop.test),
            0,
            loopExit,
            node)
          splitBlock(ifHead)
          var loopBody = processBlock(node.body, makeEnv({
            next: loopStart,
            continueBlock: loopStart,
            breakBlock: loopExit,
            label: label || null
          }))
          ifHead.consequent = loopBody
          jmpStart.next = loopBody
        break

        case "ForStatement":
          if(node.init) {
            if(node.init.type === "Expression") {
              processExpression(node.init)
            } else {
              processStatement(node.init)
            }
          }
          var loopStart = blocks.length
          var loopTest, loopExit
          if(node.update) {
            loopTest = blocks.length + 1
            loopExit = blocks.length + 2
          } else {
            loopTest = blocks.length
            loopExit = blocks.length + 1
          }
          splitBlock(new JumpTerminator(loopTest, node))
          var updateHead
          if(node.update) {
            processExpression(loop.update)
            updateHead = new IfTerminator(
              processExpression(loop.test),
              0,
              loopExit,
              node)
            splitBlock(updateHead)
          }
          var ifHead
          if(node.test) {
            ifHead = new IfTerminator(
              processExpression(loop.test), 
              0,
              loopExit,
              node)
            splitBlock(ifHead)
          } else {
            ifHead = new JumpTerminator(0, node)
            splitBlock(ifHead)
          }
          var loopBody = processBlock(node.body, makeEnv({
            next: loopStart,
            continueBlock: loopStart,
            breakBlock: loopExit,
            label: label || null
          }))
          if(node.test) {
            ifHead.consequent = loopBody
          } else {
            ifHead.next = loopBody
          }
          if(node.update) {
            updateHead.consequent = loopBody
          }
        break

        case "ForInStatement":

          //Loop entry:
          //
          // keyData = Object.keys(node.object)
          // keyCount = keyData.length
          //
          var obj = temporary(node)
          var keys = temporary(node)
          emitGet(obj, new VariableId("~global", node), new Literal("Object", node), node)
          emitGet(keys, clone(obj), new Literal("keys", node), node)
          var keyData = temporary(node)
          emitCall(clone(keyData), clone(keys), processExpression(node.right), [], node)
          var keyCount = temporary(node)
          emitGet(clone(keyCount), clone(keyData), new Literal("length", node), node)

          //Loop head:
          //
          // tmp = keyCount
          // keyCount = keyCount - 1
          // if(tmp) { 
          //  loopVar = keyData[keyCount]
          //  loopBody()
          // }
          //
          var loopStart = blocks.length - 1
          var tmp = temporary(node)
          assign(tmp, clone(keyCount), node)
          ops.push(new BinaryOperator("-", 
            new VariableId(keyCount.id, node), 
            new VariableId(keyCount.id, node), 
            new Literal(1, node), 
            node))
          var ift = new IfTerminator(clone(tmp), blocks.length, 0, node)
          splitBlock(ift)
          var tmp2 = temporary(node)
          emitGet(tmp2, clone(keyData), clone(keyCount), node)
          if(node.left.type === "VariableDeclaration") {
            setVariable(node.left.id.name, clone(tmp2), node)
          } else {
            setVariable(node.left.name, clone(tmp2), node)
          }
          var jmp = new JumpTerminator(0, node)
          var loopExit = blocks.length
          splitBlock(jmp)
          ift.alternate = loopExit
          var loopBody = processBlock(node.body, makeEnv({
              next: loopStart,
              breakBlock: loopExit,
              continueBlock: loopStart
            }))
          jmp.next = loopBody
        break

        case "VariableDeclaration":
          for(var i=0; i<stmt.declarations.length; ++i) {
              if(stmt.declarations[i].init) {
                setVariable(
                  stmt.declarations[i].id.name, 
                  processExpression(stmt.declarations[i].init), 
                  stmt.declarations[i])
              }
          }
        break

        case "FunctionDeclaration":
          var tmp = temporary(stmt)
          pendingClosures.push({id: tmp, closure: stmt, environment: makeEnv({
            root:false
          })})
          setVariable(closure.id.name, clone(tmp), stmt)
          if(env.root) {
            setVariable(env.returnValue, clone(tmp), stmt)
          }
        break

        default:
          throw new Error("control-flow: Unsupported statement type")
      }
    }
    for(var i=0; i<body.length; ++i) {
      processStatement(body[i])
    }
    cblock.terminator = new JumpTerminator(env.next, body[body.length-1])
    return retVal
  }
  enter = processBlock(body, {
      parent: environment.parent,
      vars: vars,
      next: exit,
      returnValue: returnValue,
      exit: exit,
      continueBlock: exit,
      breakBlock: exit,
      label: null,
      exception: throwValue,
      catch: raise,
      root: node.type === "Program",
      first: node.type === "Program",
      withObject: null,
      strict: environment.strict,
      isSwitch: true
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
    strictMode,
    node)
}