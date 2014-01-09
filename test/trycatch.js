"use strict"

var tape = require("tape")
var testCode = require("./harness")

tape("try/catch", function(t) {

  testCode(t, "throw 'foo'", "checking exceptions")
  testCode(t, "var a='a',e='b'; try{ throw 'c' } catch(e) { a += e }; a")
  testCode(t, "var x=[]; try{ x.push('foo'); throw 'bar'; x.push('baz'); }catch(e){x.push(e)}finally{x.push('gomez')}; x")
  testCode(t, "try{throw 'foo'}finally{1}")
  testCode(t, "var x=[]; try{ x.push('a'); throw x; x.push('c') } finally{x.push('b')};")

  t.end()
})