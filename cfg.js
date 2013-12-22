"use strict"

module.exports = createControlFlowGraph

var types = require("./lib/types.js")
var createAnalyzer = require("./lib/analyzer.js")

function createControlFlowGraph(root) {
  if(root.type !== "Program") {
    throw new Error("control-flow: Invalid parse tree, expected 'Program'")
  }
  var analyzer = createAnalyzer()
  var graph = analyzer.processBlock(new types.GlobalScope({}, root), root.body)
  analyzer.fixupLabels()
  return graph
}