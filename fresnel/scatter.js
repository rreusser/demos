'use strict';

var extend = require('util-extend');
var d3 = require('d3');
var isndarray = require('isndarray');

module.exports = function (plot, name, x, y, opts) {
  var datum, getLength, makeLine, getDatum;
  var selection = plot.svg.selectAll('.' + name)

  var options = extend({
    color: 'black',
    width: 1,
    fill: 'none',
    duration: 0,
    closed: false,
    opacity: 1,
  }, opts);

  if (isndarray(x)) {
    getDatum = function () {return new Array(x.shape[0]);}
    getLength = function () {return x.shape[0];}
    makeLine = d3.line()
      .x(function(d, i) {return plot.xScale(x.get(i));})
      .y(function(d, i) {return plot.yScale(y.get(i));})
  } else {
    getDatum = function () {return x;}
    getLength = function () {return x.length};
    makeLine = d3.line()
      .x(function(d, i) {return plot.xScale(x[i]);})
      .y(function(d, i) {return plot.yScale(y[i]);})
  }

  if (options.closed) {
    var origMakeLine = makeLine;
    makeLine = function (d) {
      return origMakeLine(d) + 'Z';
    }
  }

  if (getLength() < 2) {
    makeLine = '';
  }

  var update;

  if (selection.size()) {
    if (selection.datum().length !== getLength()) {
      selection = selection
        .datum(getDatum())
    }

    if (options.duration > 0) {
      selection = selection.transition()
        .duration(options.duration)
    }

    update = selection
      .attr('d', makeLine)

    if (options.color) {
      update.style('stroke', options.color)
    }

    if (options.width !== undefined) {
      update.style('stroke-width', options.width)
    }

    if (options.fill) {
      update.style('fill', options.fill)
    }

    if (options.opacity !== undefined) {
      update.attr('opacity', options.opacity)
    }
  } else {
    update = plot.svg.append('path')
      .datum(getDatum())
      .attr('class', name)
      .style('stroke', options.color)
      .style('stroke-width', options.width)
      .style('fill', options.fill)
      .attr('opacity', options.opacity)
      .attr('d', makeLine)
  }

}
