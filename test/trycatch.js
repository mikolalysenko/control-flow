"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("try/catch", function(t) {

  testCode(t, "var a='a',e='b'; try{ throw 'c' } catch(e) { a += e }; a")

  t.end()
})