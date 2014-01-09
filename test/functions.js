"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("function", function(t) {

  testCode(t, "var x=1; (function(){ var x=2; return x })()")

  t.end()
})