"use strict"

var tape = require("tape")
var esprima = require("esprima")
var controlFlow = require("../cfg")
var toJS = require("control-flow-to-js")
var vm = require("vm")
var util = require("util")

function testCode(t, code, remark) {
  var ast = esprima.parse(code)
  var cfg = controlFlow(ast)

  //console.log(util.inspect(cfg, {depth:10}))

  var regen = toJS(cfg)
  //console.log(regen)

  var reference = vm.runInNewContext(code)
  var result = vm.runInNewContext(regen)
  
  t.same(result, reference, remark)
}

tape("basic test", function(t) {
  testCode(t, "")
  testCode(t, "null")
  testCode(t, "false")
  testCode(t, "true")
  testCode(t, "1")
  testCode(t, "'foo'")
  t.end()
})

tape("expressions", function(t) {
  testCode(t, "1+2")
  testCode(t, "(1+2)*3")
  testCode(t, "var a")
  testCode(t, "var a=1,b=2,c;c=a;a=b;b=c;10*a+b")
  testCode(t, "1 || 2")
  testCode(t, "false || 3")
  testCode(t, "2 && 3")
  testCode(t, "null && 'a'")
  testCode(t, "true ? 'a' : 'b'")
  testCode(t, "0 ? 'a' : 'b'")
  t.end()
})