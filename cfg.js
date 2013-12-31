"use strict"

module.exports = createControlFlowGraph

var analyzeClosure = require("./lib/analyzer")

function createControlFlowGraph(root, opts) {
  opts = opts || {}

  //Create root environment
  var env = {}

  //Run analysis
  return analyzeClosure(root, env)
}