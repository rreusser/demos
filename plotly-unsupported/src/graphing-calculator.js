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

