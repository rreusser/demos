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

var i, j;
var size = 100;
var a = new Array(size);
var b = new Array(size);
var x = new Array(size);
var y = new Array(size);
var z = new Array(size);

for(i = 0; i < size; i++) {
  a[i] = b[i] = -2 * Math.PI + 4 * Math.PI * i / size;
  x[i] = new Array(size);
  y[i] = new Array(size);
  z[i] = new Array(size);
}

for(j = 0; j < size; j++) {
  for(i = 0; i < size; i++) {
    var r2 = a[i] * a[i] + b[j] * b[j];
    x[j][i] = (a[i] - 0.3 * Math.sin(b[j])) * (1 + r2 / 100);
    y[j][i] = (b[j] + 0.3 * Math.sin(a[i])) * (1 + r2 / 100);
    z[j][i] = Math.sin(a[i]) * Math.cos(b[j]) * Math.sin(r2) / Math.log(r2+1);
  }
}

Plotly.plot(gd, {
  data: [
    {
      carpetid: 'c',
      a: a,
      b: b,
      x: x,
      y: y,
      type: 'carpet',
      aaxis: {
        tickprefix: 'a = ',
        smoothing: 0,
        minorgridcount: 9,
        arraydtick: 10,
        tickmode: 'linear',
      },
      baxis: {
        tickprefix: 'b = ',
        smoothing: 0,
        minorgridcount: 9,
        arraydtick: 10,
        tickmode: 'linear',
      },
      xaxis: 'x',
      yaxis: 'y',
    },
    {
      carpetid: 'c',
      type: 'contourcarpet',
      line: {
        color: 'red'
      },
      z: z,
      a: a,
      b: b,
    }
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
