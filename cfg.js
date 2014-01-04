"use strict"

module.exports = createControlFlowGraph

var analyzeClosure = require("./lib/analyzer")

function createControlFlowGraph(root, opts) {
  //Create default environment
  var env = {
    global: "window"
  }

  //Set defaults
  if(opts) {
    for(var id in opts) {
      env[id] = opts[id]
    }
  }

  //Run analysis
  return analyzeClosure(root, env)
}