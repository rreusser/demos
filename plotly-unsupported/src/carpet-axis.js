var h = require('h');
require('insert-css')(`
html, body {
  padding: 0;
  margin: 0;
}
`);
var Plotly = require('plotly.js');

var gd = window.gd = h('div');
document.body.appendChild(gd);

var a = [];
var b = [];
var y = [];

var na = 11;
var nb = 21;
for (i = 0; i < na; i++) a[i] = i / (na - 1) * 1e-6;
for (i = 0; i < nb; i++) b[i] = i / (nb - 1) * 1e6;

for (j = 0; j < nb; j++) {
  y[j] = [];
  for (i = 0; i < na; i++) {
    var pa = a[i] * 1e6;
    var pb = b[j] * 1e-6;
    y[j][i] = Math.pow(1.0 + pa + pb + pa * pa + pb * pb, 0.5)
  }
}



Plotly.plot(gd, {
  data: [
    {
      carpetid: 'c',
      a: a,
      b: b,
      y: y,
      type: 'carpet',
      aaxis: {
        title: 'length, l, m',
        ticksuffix: 'm',
        tickformat: '.3s',
        smoothing: 1,
        tickmode: 'linear',
        tick0: 100e-9,
        dtick: 200e-9,
        minorgridcount: 1,
      },
      baxis: {
        title: 'pressure, p, Pa',
        ticksuffix: 'Pa',
        tickformat: '.3s',
        smoothing: 1,
        tickmode: 'array',
        arraytick0: 1,
        arraydtick: 2,
        minorgridcount: 1
      },
      xaxis: 'x',
      yaxis: 'y',
    },
  ],
  layout: {
    margin: {t: 10, r: 10, b: 20, l: 20},
    height: window.innerHeight,
    width: window.innerWidth,
    dragmode: 'pan'
  },
  config: {
    scrollZoom: true
  }
});
