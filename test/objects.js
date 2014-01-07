"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("objects", function(t) {
  /*
  testCode(t, "x={}")
  testCode(t, "x={a: 1, b:2, c:3+4}")
  testCode(t, "x={a: {b: 0}}")
  testCode(t, "x={a: 1}; x.a")
  testCode(t, "x={a: 1}; x['c']")
  */
  testCode(t, "x={a: 1, b: 3}; x.a=2; x.b=1; x.a+x.b")
  /*
  testCode(t, "'a' in {a:1}")
  testCode(t, "'b' in {a:1}")
  testCode(t, "x={a: 1}; delete x.a; x['a']")
  */
  
  t.end()
})