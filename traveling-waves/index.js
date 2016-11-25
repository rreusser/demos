'use strict';

var css = require('insert-css');
var h = require('h');
var fs = require('fs');
var Plotly = require('plotly.js');
css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

document.body.appendChild(h('script', {src: "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG"}));

window.onload = function () {
  var gd = document.createElement('div');
  gd.id = 'graph';
  document.body.appendChild(gd);

  var origHover = Plotly.Fx.hover;
  Plotly.Fx.hover = function(gd, evt, subplot) {
    var plot = gd._fullLayout._plots[subplot];
    console.log('plot.xaxis:', plot.xaxis);
    gd.emit('plotly_mousemove', {
      subplot: subplot,
      x: plot.xaxis.p2d(evt.offsetX),
      y: plot.yaxis.p2d(evt.offsetY)
    });
    origHover(gd, evt, subplot);
  };

  var margin = {t: 40, r: 20, b: 20, l: 30};

  var xrange = [-5, 5];
  var yrange = [-5, 5];
  var AR = 1.0;
  var kre = [0];
  var kim = [0];

  var x2range = [-10, 10];
  var y2range = [-2, 2];

  squarify(xrange, yrange, AR);

  var wavex = [];
  var wavere = [];
  var waveim = [];
  var waven = 500;
  for (var i = 0; i < waven; i++) {
    var t = i / (waven - 1);
    var x = x2range[0] + (x2range[1] - x2range[0]) * t;
    wavex[i] = x;
  }

  function clip (y) {
    return Math.max(Math.min(y, yrange[1]), yrange[0]);
  }

  function computeWavey (time) {
    var w = 1.0 / 100.0;
    for (var i = 0; i < waven; i++) {
      var t = i / (waven - 1);
      var x = xrange[0] + (xrange[1] - xrange[0]) * t;
      wavex[i] = x;
      var kxwt = x * kre[0] - w * time
      var mag = Math.exp(-x * kim[0]);
      wavere[i] = clip(mag * Math.cos(kxwt));
      waveim[i] = clip(mag * Math.sin(kxwt));
    }
  }

  function squarify (xr, yr, ar) {
    var ycen = 0.5 * (yr[1] + yr[0]);
    var ydif = 0.5 * (yr[1] - yr[0]);
    var xcen = 0.5 * (xr[1] + xr[0]);
    var xdif = 0.5 * (xr[1] - xr[0]);

    var w = window.innerWidth - margin.l - margin.r;
    var h = (window.innerHeight - margin.t - margin.b);

    xdif = ydif * w / h * ar;

    xr[0] = xcen - xdif;
    xr[1] = xcen + xdif;
    yr[0] = ycen - ydif;
    yr[1] = ycen + ydif;
  }

  Plotly.plot(gd, [
    {
      x: kre,
      y: kim,
      showlegend: false,
      xaxis: 'x2',
      yaxis: 'y2',
      type: 'markers',
      marker: {
        color: 'black',
        size: 15,
        symbol: 'circle-open-dot',
      }
    }, {
      x: wavex,
      y: wavere,
      xaxis: 'x',
      yaxis: 'y',
      name: 'Real part',
      style: 'lines',
      line: {
        color: 'black',
        width: 1,
      }
    }, {
      x: wavex,
      y: waveim,
      xaxis: 'x',
      yaxis: 'y',
      name: 'Imaginary part',
      style: 'lines',
      line: {
        color: 'black',
        dash: 'dot',
        width: 1,
      }
    }
  ], {
    margin: margin,
    annotations: [
      {
        showarrow: false,
        text: '$$\\mathrm{Complex\\;wavenumber,}\\;k$$',
        x: 0.5,
        y: 1.0,
        xref: 'x2',
        yref: 'y2',
        xanchor: 'center',
        yanchor: 'bottom',
      }, {
        showarrow: false,
        text: '$$\\mathrm{Re}(k)$$',
        x: 5.0,
        y: 0.0,
        xref: 'x2',
        yref: 'y2',
        xanchor: 'right',
        yanchor: 'bottom',
      }, {
        showarrow: false,
        text: '$$\\mathrm{Im}(k)$$',
        x: 0.1,
        y: 1.0,
        xref: 'x2',
        yref: 'y2',
        xanchor: 'left',
        yanchor: 'top',
      }
    ],
    showlegend: true,
    legend: {
      x: 0,
      y: 1,
      xanchor: 'left',
      yanchor: 'top',
    },
    xaxis: {
      range: xrange,
      domain: [0, 1],
      dtick: 1,
      anchor: 'y',
    },
    yaxis: {
      range: yrange,
      domain: [0, 1],
      dtick: 1,
      anchor: 'x',
    },
    xaxis2: {
      range: [-5, 5],
      domain: [0.75, 1],
      dtick: 2,
      anchor: 'y2'
    },
    yaxis2: {
      range: [-1, 1],
      dtick: 0.5,
      domain: [0.75, 1],
      anchor: 'x2',
    },
    title: '$$\\mathrm{Traveling\\;wave,}\\;e^{i (k x - \\omega t)}$$',
    hovermode: false,
    dragmode: 'none',
  }, {
    hovermode: 'closest',
    displayModeBar: false,
    scrollZoom: false,
  }).then(function() {
    window.addEventListener('resize', function() {
      squarify(xrange, yrange, AR)

      Plotly.relayout(gd, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });

  });

  gd.on('plotly_mousemove', function (data) {
    if (data.subplot !== 'x2y2') return;

    kre[0] = data.x;
    kim[0] = data.y;

    console.log('data.x, data.y:', data.x, data.y);
  });


  function update (time) {
    computeWavey(time);

    Plotly.animate(gd, {
      data: [
        {x: kre, y: kim},
        {x: wavex, y: wavere},
        {x: wavex, y: waveim},
      ],
    }, {
      frame: {duration: 0, redraw: false},
      transition: {duration: 0},
    });

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
};
