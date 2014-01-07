"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("loops", function(t) {
  testCode(t, "for(var i=0; i<10; ++i) { i }")
  testCode(t, "var i; for(i=0; i<10; ++i) { i }")
  testCode(t, "var i=0; for(; i<10; ++i) { i }")
  testCode(t, "var i=0; for(; i<10; ) { ++i }")
  testCode(t, "var i=0; for(;;) { if(++i < 10) { break }; i }")
  testCode(t, "for(var i=0;;) { if(++i < 10) { break }; i }")
  testCode(t, "for(var i=0;;++i) { if(i < 10) { break }; i }")
  testCode(t, "var i=0; for(;;++i) { if(i < 10) { break }; i }")
  
  t.end()
})