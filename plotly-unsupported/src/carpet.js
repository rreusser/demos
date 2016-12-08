require('insert-css')(require('fs').readFileSync(__dirname + '/index.css', 'utf8'));
var ndarray = require('ndarray');
var pack = require('ndarray-pack');
var unpack = require('ndarray-unpack');
var fill = require('ndarray-fill');
var linspace = require('ndarray-linspace');
var h = require('h');
var Plotly = require('plotly.js');

var gd = window.gd = h('div.plot');
document.body.appendChild(gd);


const ellipsoidSA = (a, b) => {
  return Math.sqrt(4 * Math.PI * Math.pow((
    Math.pow(a * b, 1.6) +
    Math.pow(a, 1.6) +
    Math.pow(b, 1.6)
  ) / 3, 1 / 1.6));
}

const na = 41;
const nb = 31;
const abrange = [[0.5, 7], [0.5, 5]];
const arange = [0.5, 7];
const brange = [0.5, 5];
const a = linspace(ndarray([], [na]), arange[0], arange[1]);
const b = linspace(ndarray([], [nb]), brange[0], brange[1]);
const y = fill(ndarray([], [na, nb]), (i, j) => ellipsoidSA(a.get(i), b.get(j)));

Plotly.plot(gd, [{
  a: unpack(a),
  b: unpack(b),
  y: unpack(y),
  cheaterslope: 0.5,
  type: 'carpet',
  aaxis: {
    showlabels: 'both',
    showlabelprefix: 'all',
    gridstep: 10,
    labelfont: {color: '#c53'}
  },
  baxis: {
    showlabels: 'end',
    showlabelprefix: 'first',
    labelsuffix: 'm',
    gridstep: 10,
    labelfont: {color: '#35c'}
  }
}], {
  xaxis: {
    showgrid: false,
    showline: false,
    zeroline: false,
    showticklabels: false,
  },
  margin: {t: 20, r: 20, b: 20, l: 40},
  dragmode: 'pan'
}, {scrollZoom: true});


