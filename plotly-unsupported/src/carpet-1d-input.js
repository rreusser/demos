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

var gd = window.gd = h('div', {class: 'plot plot-left'});
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
  trace.a = [
    12, 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
  ];

  trace.b = [
    'Morning', 'Afternoon', 'Evening',
    'Morning', 'Afternoon', 'Evening',
    'Morning', 'Afternoon', 'Evening',
    'Morning', 'Afternoon', 'Evening',
    'Morning', 'Afternoon', 'Evening',
  ];

  trace.y = [
    1, 20, 30, 50, 1,
    20, 1, 60, 80, 30,
    30, 60, 1, -10, 20
  ];
}

var trace = {
  // These are just for convenience with the control panel
  exampleNumA: 2,
  exampleNumB: 2,
  exampleApower: 1,
  exampleBpower: 1,

  // These are trace properties:
  carpetid: 'mycarpetplot',
  //x: unpack(x),
  cheaterslope: 1.0,
  type: 'carpet',
  aaxis: {
    tickmode: 'array',
    tick0: arange[0],
    dtick: 1.0,
    arraytick0: 0,
    arraydtick: 1,
    smoothing: false,
    cheatertype: 'index',
    showlabels: 'both',
    showlabelprefix: 'first',
    showlabelsuffix: 'all',
    labelpadding: 10,
    labelsuffix: '',
    labelprefix: 'a: ',
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
    tickmode: 'array',
    tick0: brange[0],
    dtick: 1.0,
    arraytick0: 0,
    arraydtick: 1,
    smoothing: false,
    cheatertype: 'index',
    showlabels: 'both',
    showlabelprefix: 'all',
    showlabelsuffix: 'all',
    labelprefix: 'b: ',
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

var a2scatter = [];
var b2scatter = [];
var nscatter = 100;

for (var i = 0; i < nscatter; i++) {
  var t = i / (nscatter - 1);
  let aval = 1.8 + (Math.random() - 0.5) * (Math.random() - 0.5) * 4;
  let bval = 1.6 + (Math.random() - 0.5) * (Math.random() - 0.5) * 4
  a2scatter.push(aval);
  b2scatter.push(bval);
}

var scatter2 = {
  carpetid: 'mycarpetplot',
  type: 'scattercarpet',
  a: a2scatter,
  b: b2scatter,
  mode: 'markers',
};

initialize();

Plotly.plot(gd, [trace], {
  xaxis: {
    showgrid: false,
    showline: false,
    zeroline: false,
    showticklabels: false,
  },
  hovermode: 'closest',
  margin: {t: 20, r: 20, b: 20, l: 40},
  dragmode: 'pan',
}, {scrollZoom: true}).then(function () {
  window.panel = panel;
});


var panel = controlPanel([
  {
    type: 'range',
    label: 'exampleNumA',
    min: 2,
    max: 20,
    initial: trace.exampleNumA,
    step: 1
  }, {
    type: 'range',
    label: 'exampleNumB',
    min: 2,
    max: 20,
    initial: trace.exampleNumB,
    step: 1
  }, {
    type: 'range',
    label: 'exampleApower',
    min: 0.2,
    max: 3,
    initial: trace.exampleApower,
    step: 0.1
  }, {
    type: 'range',
    label: 'exampleBpower',
    min: 0.2,
    max: 3,
    initial: trace.exampleBpower,
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
    type: 'select',
    label: 'aaxis.showlabelprefix',
    options: ['all', 'first', 'last', 'none'],
    initial: trace.aaxis.showlabelprefix
  }, {
    type: 'select',
    label: 'aaxis.showlabelsuffix',
    options: ['all', 'first', 'last', 'none'],
    initial: trace.aaxis.showlabelsuffix
  }, {
    type: 'text',
    label: 'aaxis.labelprefix',
    initial: trace.aaxis.labelprefix
  }, {
    type: 'text',
    label: 'aaxis.labelsuffix',
    initial: trace.aaxis.labelsuffix
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
    type: 'select',
    label: 'baxis.showlabelprefix',
    options: ['all', 'first', 'last', 'none'],
    initial: trace.baxis.showlabelprefix
  }, {
    type: 'select',
    label: 'baxis.showlabelsuffix',
    options: ['all', 'first', 'last', 'none'],
    initial: trace.baxis.showlabelsuffix
  }, {
    type: 'text',
    label: 'baxis.labelprefix',
    initial: trace.baxis.labelprefix
  }, {
    type: 'text',
    label: 'baxis.labelsuffix',
    initial: trace.baxis.labelsuffix
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
  trace.exampleNumA = data.exampleNumA;
  trace.exampleNumB = data.exampleNumB;
  trace.exampleApower = data.exampleApower;
  trace.exampleBpower = data.exampleBpower;
  initialize();

  Plotly.animate(gd, [{
    data: [data],
    traces: [0]
  }], {
    mode: 'immediate',
    frame: {redraw: false, duration: 0}
  });
}

