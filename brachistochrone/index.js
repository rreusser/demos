'use strict';

var d3 = require('d3');
var Spline = require('./spline');
var Brachistochrone = require('./brachistochrone');
var Polyline = require('./polyline');
var fs = require('fs');
var h = require('h');
var css = require('insert-css');

css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

var el = h('div#plot');
document.body.appendChild(el);
document.body.appendChild(h('div#controls', {class: 'panel'}, [
  h('div', {class: 'btn-container'}, [
    h('div', {class: 'btn-group'}, [
      h('button#toggle-particles', 'Pause', {class: 'btn'}),
      h('button#fit-to-solution', 'Minimize Time', {class: 'btn'}),
      h('button#toggle-solution', 'Hide Solution', {class: 'btn'}),
    ]),
  ]),
  h('div#test-curve-details', {class: 'details-field'}),
  h('div#solution-details', {class: 'details-field'})
]));

var margin = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 50
};

var transitionDuration = 0;

var width = el.offsetWidth - margin.right - margin.left;
var height = el.offsetHeight - margin.top - margin.bottom;

var nCurve = 100;
var yMin = 0;
var yMax = 2;
var xMin = 0;
var xMax = xMin + (yMax - yMin) * width / height;
var xScale, yScale;
var lineplot, drag, line, solutionPath, trialPath, handles, particlePlot;
var particleDingerPlot, svg;
var particles, dingers;


var brachistochrone = new Brachistochrone (
  xMin + (xMax - xMin) * 0.1,
  yMin + (yMax - yMin) * 0.9,
  xMin + (xMax - xMin) * 0.9,
  yMin + (yMax - yMin) * 0.2,
  9.81
);

var nAnchor = 4;
var solutionCurve = new Polyline([]);
var testCurve = new Polyline([]);

var testAnchors = [];
var testSpline;

var particlePositions = [[0, 0], [1, 1]];
var endpoints = [];

initializeSolution();
initializeSVG();
releaseParticles();

var releaseTime = Date.now();
var elapsedTime = 0;

function haltParticles () {
  stopImmediately = true;
  releaseTime = undefined;
  clearTimeout(releaseTimeout);

  particleDingerPlot.selectAll('circle')
    .transition()
    .duration(0)
      .attr('opacity', 1)
      .attr('r', 0);
}
function ding (idx) {
  if (!svg.classed('solution-visible') && idx === 0) {
    return;
  }
  particleDingerPlot.selectAll('circle')
    .filter(function (d, i) {
      return i === idx;
    })
    .transition()
    .duration(350, 'ease-out')
    .ease('cubic-out')
      .attr('opacity', 0)
      .attr('r', 40);
}

function updateDingerPositions () {
  if (!particleDingerPlot) return;
  particleDingerPlot.selectAll('circle')
    .data(endpoints).transition().duration(0)
      .attr('cx', function(d) { return xScale(d[0]); })
      .attr('cy', function(d) { return yScale(d[1]); })
}

function updateParticlePositions () {
  particlePositions[0] = solutionCurve.positionAtDuration(elapsedTime);
  particlePositions[1] = testCurve.positionAtDuration(elapsedTime);

  particles = particlePlot.selectAll('circle')
    .data(particlePositions)

  particles.transition().duration(transitionDuration)
      .attr('cx', function(d) { return xScale(d[0]); })
      .attr('cy', function(d) { return yScale(d[1]); })
}

var stopImmediately = false;
var releaseTimeout;

function releaseParticles () {
  stopImmediately = false;
  releaseTime = Date.now();

  // Just in case:
  clearTimeout(releaseTimeout);

  particleDingerPlot.selectAll('circle')
    .transition()
    .duration(0)
      .attr('opacity', 1)
      .attr('r', 0);

  d3.timer(function(elapsed) {
    elapsedTime = elapsed * 0.001;

    updateParticlePositions();

    if (elapsedTime > solutionCurve.duration) {
      ding(0);
    }

    if (elapsedTime > testCurve.duration) {
      ding(1);
    }

    if (stopImmediately || elapsedTime > Math.max(solutionCurve.duration, testCurve.duration)) {
      if (stopImmediately) {
        stopImmediately = false;
      } else {
        releaseTimeout = setTimeout(releaseParticles, 1500);
      }
      return true;
    }
  });
}

function computeControlPoints () {
  testSpline.fromAnchorPoints(testAnchors);
}

function computeAnchorPoints () {
  testAnchors = brachistochrone.tabulate(nAnchor);
}

function tabulateSolutionCurve () {
  solutionCurve.points = brachistochrone.tabulate(nCurve);
  solutionCurve.computeLength();
  //console.log('solution length =', solutionCurve.length)
  solutionCurve.computeDuration(brachistochrone);
  //console.log('solution duration =', solutionCurve.duration)
  endpoints[0] = endpoints[1] = solutionCurve.points[solutionCurve.points.length - 1];

  updateDingerPositions();
}

function tabulateTestCurve () {
  testCurve.points = testSpline.tabulate(nCurve);
  testCurve.computeLength();
  //console.log('test curve length =', testCurve.length)
  testCurve.computeDuration(brachistochrone);
  //console.log('test curve duration =', testCurve.duration)
}

function initializeSolution () {
  brachistochrone.solve();
  computeAnchorPoints();
  tabulateSolutionCurve();

  testSpline = new Spline(4, nAnchor);
  testAnchors = testSpline.fitToFunction(brachistochrone.evaluateByX, brachistochrone.a, brachistochrone.b);
  tabulateTestCurve();
}

function fitToSolution () {
  testAnchors = testSpline.fitToFunction(brachistochrone.evaluateByX, brachistochrone.a, brachistochrone.b);
  tabulateTestCurve();
}

function updateSolution () {
  brachistochrone.solve();
  tabulateSolutionCurve();
}

function initializeSVG() {
  xScale = d3.scale.linear().domain([xMin, xMax]).range([0, width]);
  yScale = d3.scale.linear().domain([yMin, yMax]).range([height, 0]);

  var xAxis = d3.svg.axis().orient('bottom').scale(xScale).ticks(11, d3.format(',d'));
  var yAxis = d3.svg.axis().orient('left').scale(yScale);

  svg = d3.select('#plot').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('class', 'gRoot solution-visible');

  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

  svg.append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr('x', width)
      .attr('y', height - 3)
      .text('x, meters');

  svg.append('text')
      .attr('class', 'y label')
      .attr('text-anchor', 'end')
      .attr('x', 0)
      .attr('y', 15)
      .attr('transform', 'rotate(-90)')
      .text('y, meters');

  svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

  lineplot = svg.append('g')
      .attr('class', 'lineplot');

  particlePlot = svg.append('g')
      .attr('class', 'particle-plot');

  particleDingerPlot = svg.append('g')
      .attr('class', 'particle-dingers');


  drag = d3.behavior.drag()
      .on('dragstart', dragstarted)
      .on('drag', dragged)
      .on('dragend', dragended);

  line = d3.svg.line()
    .x(function (d) { return xScale(d[0]); })
    .y(function (d) { return yScale(d[1]); });

  solutionPath = lineplot.append('path')
      .attr('class', 'ref-curve')
      .attr('d', line(solutionCurve.points));

  trialPath = lineplot.append('path')
      .attr('class', 'trial-path')
      .attr('d', line(testCurve.points));


  d3.select('#fit-to-solution').on('click', function () {
    transitionDuration = 300;
    fitToSolution();
    draw();
    transitionDuration = 0;
  });

  d3.select('#toggle-solution').on('click', function () {
    svg.classed('solution-visible', !svg.classed('solution-visible'))

    d3.select(this)
        .text(function () {
          return svg.classed('solution-visible') ? 'Hide Solution' : 'Show Solution';
        });
  });

  d3.select('#toggle-particles').on('click', function () {
    svg.classed('particles-paused', !svg.classed('particles-paused'))

    if (svg.classed('particles-paused')) {
      haltParticles();
    } else {
      releaseParticles();
    }

    d3.select(this)
        .text(function () {
          return svg.classed('particles-paused') ? 'Play' : 'Pause';
        });
  });

  dingers = particleDingerPlot.selectAll('circle')
      .data(endpoints)
        .enter().append('circle')
        .attr('cx', function(d) { return xScale(d[0]); })
        .attr('cy', function(d) { return yScale(d[1]); })
        .attr('r', 0)
        .attr('opacity', 1)
        .attr('class', function (d, i) {
          return i === 0 ? 'solution-dinger' : 'test-dinger';
        })
        .attr('fill', function (d, i) {
          return i === 0 ? 'red' : 'blue';
        });


  particles = particlePlot.selectAll('circle')
      .data(particlePositions)

  particles.enter().append('circle')
      .attr('cx', function(d) { return xScale(d[0]); })
      .attr('cy', function(d) { return yScale(d[1]); })
      .attr('r', 5)
      .attr('class', function (d, i) {
        return i === 0 ? 'solution-point' : 'test-point';
      })
      .attr('fill', function (d, i) {
        return i === 0 ? 'red' : 'blue';
      });

  draw();
}

function isEndpoint (d, i) {
  return i === 0 || i === testAnchors.length - 1;
}

function draw () {
  handles = lineplot.selectAll('g')
      .data(testAnchors);

  var gEnter = handles.enter().append('g')
      .attr('class', 'pt')
      .attr('transform', function (d) { return 'translate(' + xScale(d[0]) + ',' + yScale(d[1]) + ')'; })
      .call(drag)
      .on('mouseover', function (d, i) { d3.select(this).classed('hover', true); })
      .on('mouseout', function (d, i) { d3.select(this).classed('hover', false); });

  gEnter.classed('draggable', true);

  gEnter.filter(function (d, i) { if (i === nAnchor - 1 || i === 0) { return true; } })
    .classed('draggable-nsew', true);

  gEnter.append('circle')
      .attr('r', 20)
      .attr('class', 'handle')
      .attr('opacity', 0.05);

  gEnter.append('circle')
      .attr('class', 'dot')
      .attr('r', 2);

  handles.transition().duration(transitionDuration)
      .attr('transform', function (d) { return 'translate(' + xScale(d[0]) + ',' + yScale(d[1]) + ')'; });

  handles.exit().remove();

  trialPath.transition().duration(transitionDuration)
      .attr('d', line(testCurve.points));

  solutionPath.transition().duration(transitionDuration)
      .attr('d', line(solutionCurve.points));


  d3.select('#test-curve-details')
      .text('Path duration: ' + testCurve.duration.toFixed(4) + 's');

  d3.select('#solution-details')
      .text('Minimum duration: ' + solutionCurve.duration.toFixed(4) + 's');
}

function dragstarted (d, i) {
  svg.classed('drag-active', true);
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed('dragging', true);

  haltParticles();

}

function dragged (d, i) {
  var x = Math.max(xMin, Math.min(xMax, xScale.invert(d3.event.x)));
  var y = Math.max(yMin, Math.min(yMax, yScale.invert(d3.event.y)));

  if (i === nAnchor - 1) {
    brachistochrone.b = x;
    brachistochrone.B = y;
  } else if (i === 0) {
    brachistochrone.a = x;
    brachistochrone.A = y;
  }

  testAnchors[i][0] = x;
  testAnchors[i][1] = y;

  if (isEndpoint(d, i)) {
    updateSolution();
  }

  computeControlPoints();
  tabulateTestCurve();

  draw();
}

function dragended (d, i) {
  releaseParticles();

  svg.classed('drag-active', false);
  d3.select(this).classed('dragging', false);

  if (isEndpoint(d, i)) {
    updateSolution();
  }

  computeControlPoints();
  tabulateTestCurve();

  draw();
}
