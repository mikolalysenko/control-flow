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

  console.log(util.inspect(cfg, {depth:10}))

  var regen = toJS(cfg)
  console.log(regen)

  var reference = vm.runInNewContext(code)
  var result = vm.runInNewContext(regen)
  
  t.same(result, reference, remark)
}

tape("basic test", function(t) {
  testCode(t, "1")
  testCode(t, "1+2")
  t.end()
})