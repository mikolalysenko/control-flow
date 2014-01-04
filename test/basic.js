"use strict"

var tape = require("tape")
var esprima = require("esprima")
var controlFlow = require("../cfg")
var toJS = require("control-flow-to-js")
var vm = require("vm")

function testCode(t, code, remark) {
  var ast = esprima.parse(code)
  var cfg = controlFlow(ast)

  console.log(cfg)

  var regen = toJS(cfg)
  console.log(regen)

  var reference = vm.runInNewContext(code)
  var result = vm.runInNewContext(regen)
  
  t.same(result, reference, remark)
}

tape("basic test", function(t) {
  testCode(t, "1")
  t.end()
})