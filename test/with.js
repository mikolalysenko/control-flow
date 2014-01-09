"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("with", function(t) {
  testCode(t, "var c=1,x={a:2},a=1;with(x){c=a};c")
  testCode(t, "var x={a:1}; with(x){a=2}; x")
  testCode(t, "var x={a:1}; with(x){a += 1}; x")
  testCode(t, "var a=1,b=2,x={b:1}; with(x) { a += 3; b += 4 }; [a,b,x]")
  t.end()
})