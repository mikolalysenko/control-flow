"use strict"

var tape = require("tape")
var esprima = require("esprima")
var controlFlow = require("../cfg")
var toJS = require("control-flow-to-js")

function testModule(t, code) {
  var ast = esprima.parse(code)
  var cfg = controlFlow(ast)
  var regen = toJS(cfg)

  var referenceProgram = new Function(code)
  var compiledProgram = new Function(regen)
  
  t.same(compiledProgram(), referenceProgram())
}

tape("basic test", function(t) {
  testModule(t, "return 1")
  t.end()
})