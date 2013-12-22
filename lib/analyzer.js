"use strict"

module.exports = createAnalyzer

function Analyzer() {
  this.blocks = []
  this.labels = []
}

var proto = Analyzer.prototype

proto.processBlock = function(scope, block, continuation) {
}

proto.fixupLabels = function() {
}

function createAnalyzer() {
  return new Analyzer()
}