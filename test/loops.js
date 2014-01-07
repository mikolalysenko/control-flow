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

  testCode(t, "var i=0; while(1){if(++i < 10) { break } i}")
  testCode(t, "var i=0; while(++i < 10){ i }")

  testCode(t, "var i=0; do {if(++i < 10) { break } i} while(1)")
  testCode(t, "var i=0; do { i } while(++i < 10)")

  
  t.end()
})