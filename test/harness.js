"use strict"

module.exports = testCode

var esprima = require("esprima")
var controlFlow = require("../cfg")
var toJS = require("control-flow-to-js")
var vm = require("vm")
var util = require("util")

function testCode(t, code, remark) {
  var ast = esprima.parse(code)
  var cfg = controlFlow(ast)
  var regen = toJS(cfg)

  console.log(util.inspect(cfg, {depth:10}))
  console.log(regen)

  var reference = vm.runInNewContext(code)
  var result = vm.runInNewContext(regen)
  
  t.same(result, reference, remark)
}