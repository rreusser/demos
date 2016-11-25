'use strict';

var d3 = require('d3');
var h = require('h');
var fs = require('fs');
require('insert-css')(fs.readFileSync(__dirname + '/index.css', 'utf8'));

document.body.appendChild(h('div#plot'));
document.body.appendChild(h('div#table-container', [
  h('table#action', {rules: 'groups'}, [
    h('thead', [
      h('tr', [
        h('th', 'PE'),
        h('th', '+'),
        h('th', 'KE'),
        h('th', '='),
        h('th', ['E', h('sub', 'total')]),
        h('th', 'Action, S', {class: 'action-label'})
      ])
    ]),
    h('tbody'),
    h('tfoot', [
      h('tr', [
        h('td', 'Total Action, S:', {colspan: 5, class: 's-label'}),
        h('td', {class: 'sum'})
      ])
    ])
  ]),
  h('div', {class: 'btn-container'}, [
    h('button#toggle-ref', 'Show Solution', {class: 'btn'}),
    h('button#minimize', 'Minimize Action', {class: 'btn'})
  ])
]));

var el = document.getElementById('plot');
var marginBase = 40;
var margin = {
  top: marginBase,
  right: marginBase,
  bottom: marginBase,
  left: marginBase + 10
};
var width = el.offsetWidth - margin.right - margin.left;
var height = el.offsetHeight - margin.top - margin.bottom;

height = Math.min(width * 0.5, height);

var g = 9.81;
var v0;
var nRef = 100;
var yMin;
var yMax;
var tMin = 1e-8;
var tMax = 1;

var t0 = 0;
var t1 = 1.0;
var y0 = 0;
var y1 = 1;

var n = 8;
var trajectoryData = [];
var refTrajectoryData = [];
var transitionDuration = 0;

refTrajectoryData[0] = {t: t0, y: 0};
refTrajectoryData[nRef - 1] = {t: t1, y: 1};

function computeRefTrajectory () {
  recomputeT();
  y0 = refTrajectoryData[0].y;
  y1 = refTrajectoryData[nRef - 1].y;
  t0 = refTrajectoryData[0].t;
  t1 = refTrajectoryData[nRef - 1].t;
  v0 = (y1 - y0 + 0.5 * g * t1 * t1) / t1;
  refTrajectoryData = [];
  yMin = Infinity;
  yMax = -Infinity;
  for (var i = 0; i < nRef; i++) {
    var t = t0 + i / (nRef - 1) * (t1 - t0);
    var y = y0 + v0 * t - 0.5 * g * t * t;
    refTrajectoryData.push({t: t, y: y});
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
}

function recomputeT () {
  var t0 = refTrajectoryData[0].t;
  var t1 = refTrajectoryData[nRef - 1].t;
  for (var i = 0; i < n; i++) {
    trajectoryData[i].t = t0 + (t1 - t0) * i / (n - 1);
  }
}

function linearizeTimescale () {
  for (var i = 0; i < n; i++) {
    var t = t0 + (t1 - t0) * i / (n - 1);
    trajectoryData[i].t = t;
  }
}

function computeLinearTrajectory () {
  v0 = (y1 - y0 + 0.5 * g * t1 * t1) / t1;
  for (var i = 0; i < n; i++) {
    var t = t0 + (t1 - t0) * i / (n - 1);
    var y = y0 + (y1 - y0) * (t - t0) / (t1 - t0);
    trajectoryData[i] = {t: t, y: y};
  }
}

function computeMinimizedTrajectory () {
  v0 = (y1 - y0 + 0.5 * g * t1 * t1) / t1;
  for (var i = 0; i < n; i++) {
    var t = t0 + (t1 - t0) * i / (n - 1);
    var y = y0 + v0 * t - 0.5 * g * t * t;
    trajectoryData[i] = {t: t, y: y};
  }
}

computeLinearTrajectory();
computeRefTrajectory();

var tScale = d3.scale.linear().domain([t0, t1]).range([0, width]);
var yScale = d3.scale.linear().domain([yMin, yMax]).range([height, 0]);

var xAxis = d3.svg.axis().orient('bottom').scale(tScale).ticks(11, d3.format(',d'));
var yAxis = d3.svg.axis().orient('left').scale(yScale);

var svg = d3.select('#plot').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('class', 'gRoot');

svg.append('g')
    .attr('class', 't axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

svg.append('text')
    .attr('class', 't label')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height - 3)
    .text('time, t, seconds');

svg.append('text')
    .attr('class', 'y label')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', 15)
    .attr('transform', 'rotate(-90)')
    .text('height, y, meters');

svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

var trajectory = svg.append('g')
    .attr('class', 'lineplot');

var drag = d3.behavior.drag()
    .on('dragstart', dragstarted)
    .on('drag', dragged)
    .on('dragend', dragended);

var line = d3.svg.line()
  .x(function (d) { return tScale(d.t); })
  .y(function (d) { return yScale(d.y); });

var refPath = trajectory.append('path')
    .attr('class', 'ref-trajectory')
    .attr('d', line(refTrajectoryData));

var path = trajectory.append('path')
    .attr('class', 'trajectory')
    .attr('d', line(trajectoryData));

d3.select('#minimize')
    .on('click', function () {
      minimizeAction();
    });

d3.select('#toggle-ref')
    .on('click', function () {
      svg.classed('ref-visible', !svg.classed('ref-visible'))

      d3.select(this)
          .text(function () {
            return svg.classed('ref-visible') ? 'Hide Solution' : 'Show Solution';
          });
    })

function isEndpoint (d, i) {
  return i === 0 || i === trajectoryData.length - 1;
}

function computeAction (data) {
  var action = [];
  for (var i = 0; i < data.length - 1; i++) {
    var p0 = data[i];
    var p1 = data[i + 1];

    var t0 = p0.t;
    var y0 = p0.y;
    var t1 = p1.t;
    var y1 = p1.y;

    var dt = t1 - t0;
    var dy = y1 - y0;

    var KE = 0.5 * Math.pow(dy / dt, 2)
    var PE = g * (y0 + y1) * 0.5;
    action[i] = {
      KE: KE,
      PE: PE,
      Etot: PE + KE,
      S: 0.5 / dt * (dy * dy - g * (y0 + y1) * dt * dt)
    };
  }

  return action;
}

function updateRefTrajectory (data) {
  computeRefTrajectory();
  recomputeT();
  refPath.transition().duration(transitionDuration)
      .attr('d', line(data));
}

function updateTrajectory (data) {
  var action = computeAction(trajectoryData);

  var handles = trajectory.selectAll('g')
      .data(data);

  var gEnter = handles.enter().append('g')
      .attr('class', 'pt')
      .attr('transform', function (d) { return 'translate(' + tScale(d.t) + ',' + yScale(d.y) + ')'; })
      .call(drag)
      .on('mouseover', function (d, i) { d3.select(this).classed('hover', true); })
      .on('mouseout', function (d, i) { d3.select(this).classed('hover', false); });

  gEnter.classed('draggable', true);

  gEnter.filter(function (d, i) { if (i === n - 1) { return true; } })
    .classed('draggable-nsew', true);

  gEnter.append('circle')
      .attr('r', 20)
      .attr('class', 'handle')
      .attr('opacity', 0.05);

  gEnter.append('circle')
      .attr('class', 'dot')
      .attr('r', 2);

  handles.transition().duration(transitionDuration)
      .attr('transform', function (d) { return 'translate(' + tScale(d.t) + ',' + yScale(d.y) + ')'; });

  handles.exit().remove();

  path.transition().duration(transitionDuration)
      .attr('d', line(data));

  var tr = d3.select('#action tbody').selectAll('tr').data(action);

  tr.each(function (d, i) {
    d3.select(this).select('td.action').text(function () { return action[i].S.toFixed(3); });
    d3.select(this).select('td.ke').text(function () { return action[i].KE.toFixed(3); });
    d3.select(this).select('td.pe').text(function () { return action[i].PE.toFixed(3); });
    d3.select(this).select('td.etot').text(function () { return action[i].Etot.toFixed(3); });
  });

  var trEnter = tr.enter().append('tr');
  trEnter.append('td')
      .attr('class', 'pe')
      .text(function (d, i) { return action[i].PE.toFixed(3); });
  trEnter.append('td');
  trEnter.append('td')
      .attr('class', 'ke')
      .text(function (d, i) { return action[i].KE.toFixed(3); });
  trEnter.append('td');
  trEnter.append('td')
      .attr('class', 'etot')
      .text(function (d, i) { return action[i].Etot.toFixed(3); });
  trEnter.append('td')
      .attr('class', 'action')
      .text(function (d, i) { return action[i].S.toFixed(3); });

  var S = action.reduce(function (a, x) { return a + x.S; }, 0);
  var tf = d3.select('#action tfoot').selectAll('tr').data([S]);
  tf.each(function (d, i) {
    d3.select(this).select('td.sum').text(S.toFixed(3));
  });

  var tfEnter = tf.enter().append('tr');
  tfEnter.append('td.sum').text(S.toFixed(3));
}

updateTrajectory(trajectoryData);

function dragstarted (d, i) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed('dragging', true);

  if (isEndpoint(d, i)) {
    updateRefTrajectory(refTrajectoryData);
    linearizeTimescale();
  }
}

function dragged (d, i) {
  trajectoryData[i].y = yScale.invert(d3.event.y);

  if (i === n - 1) {
    refTrajectoryData[nRef - 1].y = trajectoryData[i].y;
    refTrajectoryData[nRef - 1].t = Math.max(tMin, Math.min(tMax, tScale.invert(d3.event.x)));
  } else if (i === 0) {
    refTrajectoryData[0].y = trajectoryData[i].y;
  }
  if (isEndpoint(d, i)) {
    updateRefTrajectory(refTrajectoryData);
    linearizeTimescale();
  }

  updateTrajectory(trajectoryData);
}

function dragended (d, i) {
  d3.select(this).classed('dragging', false);

  if (isEndpoint(d, i)) {
    updateRefTrajectory(refTrajectoryData);
    linearizeTimescale();
  }
}

function minimizeAction () {
  computeMinimizedTrajectory();
  transitionDuration = 500;
  updateTrajectory(trajectoryData);
  transitionDuration = 0;
}
