"use strict"

module.exports = testCode

var esprima = require("esprima")
var controlFlow = require("../../cfg")
var toJS = require("control-flow-to-js")
var vm = require("vm")
var util = require("util")
var stripNodes = require("./strip")

function testCode(t, code, remark) {
  var ast = esprima.parse(code)
  var cfg = controlFlow(ast)
  var regen = toJS(cfg)

  //TODO: Inspect control flow graph and verify that code is consistent

  //console.log(util.inspect(stripNodes(cfg), {depth:10}))
  //console.log(regen)

  var reference, result, exceptReference, exceptResult
  try {
    reference = vm.runInNewContext(code)
  } catch(e) {
    exceptReference = e
  }
  try {
    result = vm.runInNewContext(regen)
  } catch(e) {
    exceptResult = e
  }
  t.same(result, reference, remark)
  t.same(exceptResult, exceptReference, remark)
}