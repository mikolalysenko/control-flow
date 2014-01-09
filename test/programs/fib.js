"use strict"

function fib(n) {
  if(n === 0 || n === 1) {
    return 1
  }
  return fib(n-1) + fib(n-2)
}

[fib(0), fib(1), fib(3), fib(5)]