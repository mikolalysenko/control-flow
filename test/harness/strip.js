"use strict"

module.exports = stripNodes

function stripNodes(cfg) {
  if(typeof cfg !== "object") {
    return
  }
  if(cfg === null) {
    return
  }
  if(cfg.node) {
    delete cfg.node
  }
  if(cfg.nodes) {
    delete cfg.nodes
  }
  for(var i in cfg) {
    stripNodes(cfg[i])
  }
  return cfg
}