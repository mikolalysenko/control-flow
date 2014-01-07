"use strict"

module.exports = createControlFlowGraph

var analyzeClosure = require("./lib/analyzer")

function createControlFlowGraph(root, opts) {
  //Create default environment
  var env = {}

  //Set defaults
  if(opts) {
    for(var id in opts) {
      env[id] = opts[id]
    }
  }

  env.temp = { counter: 0 }

  //Run analysis
  return analyzeClosure(root, env)
}