var h = require('h');
require('insert-css')(`html, body {padding: 0; margin: 0;}`);
var Plotly = require('plotly.js');
var gd = window.gd = h('div');
document.body.appendChild(gd);

var mock = require('plotly.js/test/image/mocks/ternary_simple');

Plotly.plot(gd, mock);
