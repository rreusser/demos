var karmanTrefftz = require('./karman-trefftz');
var h = require('h');
require('insert-css')(`html, body {padding: 0; margin: 0;}`);
var Plotly = require('plotly.js');
var gd = window.gd = h('div');
document.body.appendChild(gd);

var neta = 101;
var nxi = 31;
var mux = -0.08;
var muy = 0.08;
var n = 1.94;
var R = Math.sqrt(Math.pow(1 - mux, 2) + muy * muy);
var U = 1;

var r, theta, Rr, re, im, pt;
var b = [];
var a = [];
var x = [];
var y = [];
var psi = [];
var cp = [];
var theta0 = Math.atan(-muy, 1 - mux);

for (i = 0; i < neta; i++) {
  theta = b[i] = theta0 + i / (neta - 1) * Math.PI * 2;
  x[i] = [];
  y[i] = [];
  cp[i] = [];
  psi[i] = [];
  for (j = 0; j < nxi; j++) {
    r = a[j] = R + 3 * j / (nxi - 1);
    Rr = R / r;
    re = mux + r * Math.cos(theta);
    im = muy + r * Math.sin(theta);
    pt = karmanTrefftz(n, re, im);

    x[i][j] = pt[0];
    y[i][j] = pt[1];
    psi[i][j] = (r - R * Rr) * Math.sin(theta);
    cp[i][j] = 2 * Rr * Rr * Math.cos(2 * theta) * Math.pow(Rr, 4);
  }
}

Plotly.plot(gd, {
  data: [
    {
      type: 'carpet',
      carpetid: 'c',
      a: a,
      b: b,
      x: x,
      y: y,
      aaxis: {
        smoothing: 1,
        showticklabels: 'none',
        startlinewidth: 2,
        gridcolor: 'rgba(0, 0, 0, 0.1)',
      },
      baxis: {
        smoothing: 1,
        showticklabels: 'none',
        startline: false,
        endline: false,
        gridcolor: 'rgba(0, 0, 0, 0.1)',
      }
    },
    {
      name: 'c_p',
      a: a,
      b: b,
      z: cp,
      type: 'contourcarpet',
      showlegend: false,
      carpetid: 'c',
      ncontours: 20,
      connectgaps: true,
      colorscale: 'Viridis',
      line: {
        width: 0,
        smoothing: 1,
      }
    },
    /*{
      type: 'contourcarpet',
      carpetid: 'c',
      name: 'cp',
      showlegend: false,
      z: cp
    }*/
  ],
  layout: {
    margin: {t: 20, r: 20, b: 20, l: 20},
    dragmode: 'pan',
    width: window.innerWidth,
    height: window.innerHeight,
    xaxis: {
      range: [-3, 3],
      zeroline: false
    },
    yaxis: {
      range: [-3, 3].map(y => y * window.innerHeight / window.innerWidth),
      zeroline: false
    }
  },
  config: {scrollZoom: true}
});
