require('insert-css')(require('fs').readFileSync(__dirname + '/index.css', 'utf8'));
var ndarray = require('ndarray');
var pack = require('ndarray-pack');
var unpack = require('ndarray-unpack');
var fill = require('ndarray-fill');
var linspace = require('ndarray-linspace');
var h = require('h');
var Plotly = window.Plotly = require('plotly.js');
var controlPanel = require('control-panel');
var Lib = require('plotly.js/src/lib');
var ops = require('ndarray-ops');

var gd = window.gd = h('div.plot');
document.body.appendChild(gd);

const ellipsoidSA = (a, b) => {
  return Math.pow(4 * Math.PI * Math.pow((
    Math.pow(a * b, 1.6) +
    Math.pow(a, 1.6) +
    Math.pow(b, 1.6)
  ) / 3, 1 / 1.6), 0.1);
}

var arange = [0.2, 7.2];
var brange = [0.2, 3.2];

function initialize() {
  trace.a = linspace(ndarray([], [trace.na]), arange[0], arange[1]);
  trace.b = linspace(ndarray([], [trace.nb]), brange[0], brange[1]);
  ops.powseq(trace.a, trace.apower);
  ops.powseq(trace.b, trace.bpower);

  ops.subseq(trace.a, Math.pow(arange[0], trace.apower));
  ops.divseq(trace.a, Math.pow(arange[1], trace.apower) - Math.pow(arange[0], trace.apower))
  ops.mulseq(trace.a, arange[1] - arange[0])
  ops.addseq(trace.a, arange[0])

  ops.subseq(trace.b, Math.pow(brange[0], trace.bpower));
  ops.divseq(trace.b, Math.pow(brange[1], trace.bpower) - Math.pow(brange[0], trace.bpower))
  ops.mulseq(trace.b, brange[1] - brange[0])
  ops.addseq(trace.b, brange[0])

  trace.y = fill(ndarray([], [trace.na, trace.nb]), (i, j) => ellipsoidSA(trace.a.get(i), trace.b.get(j)));
  trace.a = unpack(trace.a);
  trace.b = unpack(trace.b);
  trace.y = unpack(trace.y);
}

var trace = {
  // These are just for convenience with the control panel
  na: 7,
  nb: 7,
  apower: 2,
  bpower: 2,

  // These are trace properties:
  carpetid: 'mycarpetplot',
  //x: unpack(x),
  cheaterslope: 1.0,
  type: 'carpet',
  aaxis: {
    tickmode: 'linear',
    tick0: arange[0],
    dtick: 1.0,
    arraytick0: 0,
    arraydtick: 1,
    smoothing: true,
    cheatertype: 'value',
    showlabels: 'both',
    showlabelprefix: 'first',
    labelpadding: 10,
    labelsuffix: '',
    labelfont: {
      color: '#c53',
      size: 12,
      family: 'sans-serif'
    },
    startline: true,
    endline: true,
    startlinecolor: '#33b',
    endlinecolor: '#33b',
    gridoffset: 0,
    gridstep: 1,
    gridwidth: 1,
    startlinewidth: 1.5,
    endlinewidth: 1.5,
    gridcolor: '#aaa',
    minorgridcount: 3,
    minorgridwidth: 1,
    minorgridcolor: '#eee'
  },
  baxis: {
    tickmode: 'linear',
    tick0: brange[0],
    dtick: 1.0,
    arraytick0: 0,
    arraydtick: 1,
    smoothing: true,
    cheatertype: 'value',
    showlabels: 'both',
    showlabelprefix: 'all',
    labelpadding: 10,
    labelsuffix: 'm',
    labelfont: {
      color: '#35c',
      size: 12,
      family: 'sans-serif'
    },
    startline: true,
    endline: true,
    startlinecolor: '#b33',
    endlinecolor: '#b33',
    gridoffset: 0,
    gridstep: 1,
    gridwidth: 1,
    gridcolor: '#aaa',
    startlinewidth: 1.5,
    endlinewidth: 1.5,
    minorgridcount: 3,
    minorgridwidth: 1,
    minorgridcolor: '#eee',
    showstartlabel: true,
    showendlabel: false,
  }
}

var ascatter = [];
var bscatter = [];
var nscatter = 100;

for (var i = 0; i < nscatter; i++) {
  var t = i / (nscatter - 1);
  var a = arange[0] + (arange[1] - arange[0]) * t;
  ascatter.push(a);
  bscatter.push(Math.pow(a - 3.2, 2) + 1.0);
}

var scatter = {
  carpetid: 'mycarpetplot',
  type: 'scattercarpet',
  a: ascatter,
  b: bscatter
};

initialize();

Plotly.plot(gd, [trace, scatter], {
  xaxis: {
    showgrid: false,
    showline: false,
    zeroline: false,
    showticklabels: false,
  },
  margin: {t: 20, r: 20, b: 20, l: 40},
  dragmode: 'pan',
}, {scrollZoom: true}).then(function () {
  window.panel = panel;
});


var panel = controlPanel([
  {
    type: 'range',
    label: 'na',
    min: 2,
    max: 20,
    initial: trace.na,
    step: 1
  }, {
    type: 'range',
    label: 'nb',
    min: 2,
    max: 20,
    initial: trace.nb,
    step: 1
  }, {
    type: 'range',
    label: 'apower',
    min: 0.2,
    max: 3,
    initial: trace.apower,
    step: 0.1
  }, {
    type: 'range',
    label: 'bpower',
    min: 0.2,
    max: 3,
    initial: trace.bpower,
    step: 0.1
  }, {
    type: 'range',
    label: 'cheaterslope',
    min: -2,
    max: 2,
    initial: trace.cheaterslope
  }, {
    type: 'select',
    label: 'aaxis.cheatertype',
    options: ['index', 'value'],
    initial: trace.aaxis.cheatertype
  }, {
    type: 'select',
    label: 'aaxis.tickmode',
    options: ['array', 'linear'],
    initial: trace.aaxis.tickmode
  }, {
    type: 'range',
    label: 'aaxis.dtick',
    min: 0.1,
    max: 1,
    step: 0.01,
    initial: trace.aaxis.dtick
  }, {
    type: 'range',
    label: 'aaxis.tick0',
    min: arange[0],
    max: arange[0] + (arange[1] - arange[0]) * 0.3,
    step: 0.01,
    initial: trace.aaxis.tick0
  }, {
    type: 'range',
    label: 'aaxis.arraydtick',
    min: 1,
    max: 5,
    step: 1,
    initial: trace.aaxis.arraydtick
  }, {
    type: 'range',
    label: 'aaxis.arraytick0',
    min: 0,
    max: 10,
    step: 1,
    initial: trace.aaxis.arraytick0
  }, {
    type: 'range',
    label: 'aaxis.minorgridcount',
    min: 0,
    max: 10,
    step: 1,
    initial: trace.aaxis.minorgridcount
  }, {
    type: 'select',
    label: 'aaxis.showlabels',
    options: ['both', 'start', 'end', 'none'],
    initial: trace.aaxis.showlabels
  }, {
    type: 'color',
    label: 'aaxis.gridcolor',
    initial: trace.aaxis.gridcolor
  }, {
    type: 'color',
    label: 'aaxis.minorgridcolor',
    initial: trace.aaxis.minorgridcolor
  }, {
    type: 'color',
    label: 'aaxis.startlinecolor',
    initial: trace.aaxis.startlinecolor
  }, {
    type: 'color',
    label: 'aaxis.endlinecolor',
    initial: trace.aaxis.endlinecolor
  }, {
    type: 'checkbox',
    label: 'aaxis.smoothing',
    initial: trace.aaxis.smoothing
  }, {
    type: 'checkbox',
    label: 'aaxis.startline',
    initial: trace.aaxis.startline
  }, {
    type: 'checkbox',
    label: 'aaxis.endline',
    initial: trace.aaxis.endline
  }, {
    type: 'select',
    label: 'baxis.cheatertype',
    options: ['index', 'value'],
    initial: trace.baxis.cheatertype
  }, {
    type: 'select',
    label: 'baxis.tickmode',
    options: ['array', 'linear'],
    initial: trace.baxis.tickmode
  }, {
    type: 'range', label: 'baxis.dtick',
    min: 0.1,
    max: 1,
    step: 0.01,
    initial: trace.baxis.dtick
  }, {
    type: 'range',
    label: 'baxis.tick0',
    min: brange[0],
    max: brange[0]+ (brange[1] - brange[0]) * 0.3,
    step: 0.01,
    initial: trace.baxis.tick0
  }, {
    type: 'range',
    label: 'baxis.arraydtick',
    min: 1,
    max: 5,
    step: 1,
    initial: trace.baxis.arraydtick
  }, {
    type: 'range',
    label: 'baxis.arraytick0',
    min: 0,
    max: 10,
    step: 1,
    initial: trace.baxis.arraytick0
  }, {
    type: 'range',
    label: 'baxis.minorgridcount',
    min: 0,
    max: 10,
    step: 1,
    initial: trace.baxis.minorgridcount
  }, {
    type: 'select',
    label: 'baxis.showlabels',
    options: ['both', 'start', 'end', 'none'],
    initial: trace.baxis.showlabels
  }, {
    type: 'color',
    label: 'baxis.gridcolor',
    initial: trace.baxis.gridcolor
  }, {
    type: 'color',
    label: 'baxis.minorgridcolor',
    initial: trace.baxis.minorgridcolor
  }, {
    type: 'color',
    label: 'baxis.startlinecolor',
    initial: trace.baxis.startlinecolor
  }, {
    type: 'color',
    label: 'baxis.endlinecolor',
    initial: trace.baxis.endlinecolor
  }, {
    type: 'checkbox',
    label: 'baxis.smoothing',
    initial: trace.baxis.smoothing
  }, {
    type: 'checkbox',
    label: 'baxis.startline',
    initial: trace.baxis.startline
  }, {
    type: 'checkbox',
    label: 'baxis.endline',
    initial: trace.baxis.endline
  }
], {
  width: 380
}).on('input', update);

function update (data) {
  trace.na = data.na;
  trace.nb = data.nb;
  trace.apower = data.apower;
  trace.bpower = data.bpower;
  initialize();

  Plotly.animate(gd, [{
    data: [data],
    traces: [0]
  }], {
    mode: 'immediate',
    frame: {redraw: false, duration: 0}
  });
}

