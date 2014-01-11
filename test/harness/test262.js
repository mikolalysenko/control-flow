"use strict"

module.exports = runTest262

var glob = require("glob")
var paths = require("./262.js")
var fs = require("fs")
var tape = require("tape")
var vm = require("vm")
var esprima = require("esprima").parse
var controlFlow = require("../../cfg")
var strip = require("./strip")
var toJS = require("control-flow-to-js")

function parseDocstring(str) {
  var matchParams = /@(\w*)\s(\S.*)\n/gi
  var matchFlags = /@(\w*)\n/gi
  var result = {}
  var arr
  while((arr = matchParams.exec(str)) !== null) {
    result[arr[1]] = arr[2]
  }
  while((arr = matchFlags.exec(str)) !== null) {
    result[arr[1]] = true
  }
  return result
}


function runTestCase(filename) {
  fs.readFile(filename, function(err, data) {
    if(err) {
      console.error("Error opening test case", filename, "Reason:", err)
      return
    }
    var str = data.toString()
    var header = parseDocstring(str)
    tape(filename, function(t) {
      try {
        var ast = esprima(str)
      } catch(e) {
        t.ok(header.negative, "parser error:", e)
        t.end()
        return
      }

      //Construct control flow graph
      var cfg = controlFlow(ast)

      //Regenerate code
      var regen = toJS(cfg)

      console.log(regen)

      //Build environment
      var errorList = []
      var environment = {
        $ERROR: function(err) {
          errorList.push(err)
        },
        $PRINT: function() {
          return console.log.apply(console, Array.prototype.slice.call(arguments))
        }
      }
      var context = vm.createContext(environment)

      //Run test case
      try {
        vm.runInContext(regen, context)
      } catch(e) {
        if(header.negative) {
          t.ok(true, "generated exception: " + e)
          t.end()
          return
        }
        throw e
      }

      //Check for errors
      for(var i=0; i<errorList.length; ++i) {
        t.ok(false, errorList[i])
      }
      t.equals(errorList.length, 0, "no errors")

      t.end()
    })
  })
}

function runTest262(path) {
  glob(path, {}, function(err, files) {
    if(err) {
      console.error("Error globbing test case files", err)
      return
    }
    for(var i=0; i<files.length; ++i) {
      runTestCase(files[i])
    }
  })
}