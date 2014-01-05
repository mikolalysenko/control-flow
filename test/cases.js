"use strict"

var tape = require("tape")
var testCode = require("./harness")
var path = require("path")
var fs = require("fs")
var dir = path.join(__dirname, "programs")
var programs = fs.readdirSync(dir)

programs.map(function(p) {
  fs.readFile(path.join(dir, p), function(err, code) {
    if(err) {
      console.error("error opening test case ", p, ":", err)
      return
    }
    tape("program:" + p, function(t) {
      testCode(t, code)
      t.end()
    })
  })
})