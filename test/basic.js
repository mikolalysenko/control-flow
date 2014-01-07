"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("basic test", function(t) {
  testCode(t, "")
  testCode(t, "null")
  testCode(t, "false")
  testCode(t, "true")
  testCode(t, "1")
  testCode(t, "'foo'")
  testCode(t, "~1")
  testCode(t, "1+2")
  testCode(t, "(1+2)*3")
  testCode(t, "var a=1")
  testCode(t, "var a=1,b=2,c;c=a;a=b;b=c;10*a+b")
  testCode(t, "1 || 2")
  testCode(t, "false || 3")
  testCode(t, "2 && 3")
  testCode(t, "null && 'a'")
  testCode(t, "true ? 'a' : 'b'")
  testCode(t, "0 ? 'a' : 'b'")
  
  t.end()
})