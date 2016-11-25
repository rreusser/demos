'use strict'

var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = function fftfreq(n, dx) {
  var f = ndarray(new Float64Array(n))
  fill(f, function (i) {
    return (i < Math.floor((n + 1) / 2)) ?  i / (n * dx) : -(n - i) / (n * dx)
  })
  return f
}
