'use strict';

var css = require('insert-css');
var fs = require('fs');

var Plotly = require('plotly.js');
var linspace = require('ndarray-linspace');
var fft = require('ndarray-fft');
var pool = require('ndarray-scratch');
var fill = require('ndarray-fill');
var ndarray = require('ndarray');
var cwise = require('cwise');
var ops = require('ndarray-ops');
var euler = require('ode-euler');
var rk2 = require('ode-midpoint');
var rk4 = require('ode-rk4');
var control = require('control-panel');
var qs = require('query-string');
var concatRows = require('ndarray-concat-rows');
var concatCols = require('ndarray-concat-cols');
var h = require('h');
var extend = require('util-extend');

document.body.appendChild(h('div#graph'));

document.body.appendChild(
  h('div#control-panels-container', [
    h('div#simulation-control'),
    h('div#pulse-1-control'),
    h('div#pulse-2-control'),
    h('div#potential-control'),
    h('div#pml-control')
  ])
);

document.body.appendChild(
  h('a.gh-corner', {href: "https://github.com/rreusser/demos/tree/master/schrodinger-1d", target: "_blank"}, [
    h('img', {src: "https://cdn.rawgit.com/rreusser/schrodinger-equation-1d-demo/master/www/src/images/gh-corner.svg"})
  ])
);

var gd = document.getElementById('graph');

css(fs.readFileSync(__dirname + '/index.css', 'utf8'));

function zeros (n) {
  return ndarray(new Array(n));
}

// Grid definition:
var pmlWidth = 0.1;

var grid = {
  xmin: 0 - pmlWidth,
  xmax: 2 + pmlWidth,
  n: 512,
};

// Initial pulse:
var pulse = {
  center: grid.xmin + (grid.xmax - grid.xmin) * 0.25,
  width: 0.1,
  magnitude: 1,
  wavenumber: 200.0
};

var pulse2 = {
  center: grid.xmin + (grid.xmax - grid.xmin) * 0.75,
  width: 0.1,
  magnitude: 0,
  wavenumber: -200.0
};

// Perfectly Matched Layer (PML):
var pml = {
  width: pmlWidth,
  exponent: 1,
  gamma: Math.PI * 0.5
};

var integration = {
  dt: 1e-4,
  stepsPerIter: 5,
  method: 'rk4',
  probability: true
}

// Potential barrier:
var potential = {
  width: 0.1,
  magnitude: 1000,
  inverted: false,
  center: grid.xmin + (grid.xmax - grid.xmin) * 0.5,
  exponent: 2,
};

var simulationConfig = {
  pulse: pulse,
  pulse2: pulse2,
  pml: pml,
  integration: integration,
  potential: potential
}

paramsFromHash();

// Initial conditions:
var x = linspace(zeros(grid.n), grid.xmin, grid.xmax, grid.n);
var y = pool.zeros([grid.n, 2])
var yp = pool.zeros([grid.n, 2])
var yr = y.pick(null, 0);
var yi = y.pick(null, 1);
var x2 = concatRows([x, x.step(-1)]);
x2.data = Array.apply(null, x2.data);

// Time integration
var integrators = {
  euler: euler(y.data, deriv, 0, integration.dt),
  rk2: rk2(y.data, deriv, 0, integration.dt),
  rk4: rk4(y.data, deriv, 0, integration.dt),
};

// Potential:
var V = ndarray(new Array(grid.n));

function computePotential () {
  fill(V, function (i) {
    var xnorm = (x.get(i) - potential.center) / potential.width;
    var gaussian = Math.exp(-Math.pow(Math.abs(xnorm), potential.exponent));
    if (potential.inverted) {
      gaussian = 1 - gaussian;
    }
    // Tweak this *slightly* to allow no potential:
    var mag = potential.magnitude < 1.0001 ? 0 : potential.magnitude;
    return mag * gaussian;
  });
}

var PML = pool.zeros([grid.n, 2]);
var PMLr = PML.pick(null, 0);
var PMLi = PML.pick(null, 1);
var sigmaEval = zeros(grid.n);

function sigma (x) {
  var xnorm;
  var pmlWidth = pml.width;
  if (x - grid.xmin < pmlWidth || grid.xmax - x < pmlWidth) {
    if (x - grid.xmin < pmlWidth) {
      xnorm = (x - grid.xmin) / pmlWidth;
    } else {
      xnorm = (grid.xmax - x) / pmlWidth;
    }
    return Math.pow(1 - xnorm, pml.exponent);
  } else {
    return 0;
  }
}

function computeSigma () {
  fill(sigmaEval, function (i) { return sigma(x.get(i)); });
}

var tabulatePML = cwise({
  args: ['array', 'array', 'array', 'scalar'],
  body: function (x, PMLr, PMLi, config) {
    var sigma = config.sigma(x);
    var a = 1 + sigma * Math.cos(config.gamma);
    var b = sigma * Math.sin(config.gamma);
    var denom = a * a + b * b;
    PMLr = a / denom;
    PMLi = -b / denom;
  }
});

function computePML () {
  computeSigma();
  tabulatePML(x, PMLr, PMLi, {sigma: sigma, gamma: pml.gamma});
}

var applyPML = cwise({
  args: ['array', 'array', 'array', 'array'],
  body: function (ypr, ypi, PMLr, PMLi) {
    var a = ypr;
    var b = ypi;
    ypr = a * PMLr - b * PMLi;
    ypi = a * PMLi + b * PMLr;
  }
});

var pl = {
  yr: zeros(grid.n),
  yi: zeros(grid.n),
  ypabs: zeros(grid.n),
};

function fftfreq (n, dx) {
  var f = pool.zeros([n]);
  for (var i = 0; i < n; i++) {
    f.set(i, (i < Math.floor((n + 1) / 2)) ?  i / (n * dx) : -(n - i) / (n * dx));
  }
  return f;
}

var computeAmplitudeComponents = cwise({
  args: ['array', 'array', 'array', 'array', 'array'],
  body: function (reOut, imOut, pAbsOut, reIn, imIn) {
    pAbsOut = Math.sqrt(reIn * reIn + imIn * imIn);
    reOut = reIn;
    imOut = imIn;
  }
});

var computeProbabilityComponents = cwise({
  args: ['array', 'array', 'array'],
  body: function (pAbsOut, reIn, imIn) {
    pAbsOut = reIn * reIn + imIn * imIn;
  }
});

function computeComponents(reOut, imOut, pAbsOut, reIn, imIn) {
  if (integration.probability) {
    computeProbabilityComponents(pAbsOut, reIn, imIn);

    // Lower bound on the fill is zero for probability:
    for (var i = grid.n - 1; i >= 0; i--) {
      pAbsOut.data[2 * grid.n - 1 - i] = 0;
    }
  } else {
    computeAmplitudeComponents(reOut, imOut, pAbsOut, reIn, imIn);

    // Copy and reflect the absolute value to create the closed fill:
    for (var i = grid.n - 1; i >= 0; i--) {
      pAbsOut.data[2 * grid.n - 1 - i] = -pAbsOut.data[i];
    }
  }

}

var initializeSolution = cwise({
  args: ['array', 'array', 'array', 'scalar', 'scalar', 'scalar'],
  body: function (x, yr, yi, pulse, pulse2) {
    // Pulse 1:
    var mag = Math.exp(-Math.pow((x - pulse.center)/pulse.width, 2)) * pulse.magnitude;
    yr = Math.cos(x * pulse.wavenumber) * mag;
    yi = Math.sin(x * pulse.wavenumber) * mag;

    // Pulse 2:
    mag = Math.exp(-Math.pow((x - pulse2.center)/pulse2.width, 2)) * pulse2.magnitude;
    yr += Math.cos(x * pulse2.wavenumber) * mag;
    yi += Math.sin(x * pulse2.wavenumber) * mag;
  },
});

// Compute ik * fft(y) using precomputed wavenumber vector k:
var fftDeriv = cwise({
  args: ['array', 'array', 'array'],
  body: function (k, re, im) {
    var tmp = re;
    re = -im * k;
    im = tmp * k;
  }
});

// A dummy ndarray that we'll use to pass data to the fft:
var yt = ndarray(y.data, y.shape, y.stride, y.offset);
var yt2 = ndarray(y.data, y.shape, y.stride, y.offset);
var ytr = yt.pick(null, 0);
var yti = yt.pick(null, 1);
var ytmp = new Float64Array(grid.n * 2);

// This differentiates an ndarray but *requires* that
// re.data === im.data:
var k = fftfreq(grid.n, (grid.xmax - grid.xmin) / (grid.n - 1));
function differentiate (re, im) {
  fft(1, re, im);
  fftDeriv(k, re, im);
  fft(-1, re, im);
}

// Multiply by -i:
var scale = cwise({
  args: ['array', 'array', 'array', 'array', 'array'],
  body: function (ypRe, ypIm, yRe, yIm, V) {
    // Compute real and imaginary components:
    var re = -ypRe + V * yRe;
    var im = -ypIm + V * yIm;

    // Multiply by -i and write back into yp:
    ypRe = im;
    ypIm = -re;
  }
});

// Dummy ndarrays for holding the re/im parts of y and dydt:
var yrTmp = ndarray(yr.data, yr.shape, yr.stride, yr.offset);
var yiTmp = ndarray(yi.data, yi.shape, yi.stride, yi.offset);
var yprTmp = ndarray(yr.data, yr.shape, yr.stride, yr.offset);
var ypiTmp = ndarray(yi.data, yi.shape, yi.stride, yi.offset);

// The main derivative function for ODE:
function deriv (dydt, y, t) {
  yrTmp.data = y;
  yiTmp.data = y;
  yprTmp.data = dydt;
  ypiTmp.data = dydt;

  // Copy dydt <- y
  dydt.set(y);

  // Differentiate twice:
  differentiate(yprTmp, ypiTmp);
  applyPML(yprTmp, ypiTmp, PMLr, PMLi);
  differentiate(yprTmp, ypiTmp);
  applyPML(yprTmp, ypiTmp, PMLr, PMLi);

  // Multiply by -i:
  scale(yprTmp, ypiTmp, yrTmp, yiTmp, V);
}

function initialize () {
  computePotential();
  computePML();
  initializeSolution(x, yr, yi, pulse, pulse2);
  computeComponents(pl.yr, pl.yi, pl.ypabs, yr, yi);
}

function reinitialize () {
  initialize();

  return redrawSolution().then(function () {
    return Plotly.redraw(gd);
  });
}

function redrawExtras () {
  return Plotly.animate(gd, [{
    data: [
      {y: sigmaEval.data},
      {y: V.data},
    ],
    traces: [0, 4]
  }], {
    transition: {duration: 0},
    frame: {duration: 0, redraw: false}
  });
}

function redrawSolution () {
  // Copy the solution into plottable arrays:
  computeComponents(pl.yr, pl.yi, pl.ypabs, yr, yi);

  if (integration.probability) {
    return Plotly.animate(gd, [{
      data: [{y: pl.ypabs.data}],
      traces: [3]
    }], {
      transition: {duration: 0},
      frame: {duration: 0, redraw: false}
    });
  } else {
    return Plotly.animate(gd, [{
      data: [{y: pl.yr.data}, {y: pl.yi.data}, {y: pl.ypabs.data}],
      traces: [1, 2, 3]
    }], {
      transition: {duration: 0},
      frame: {duration: 0, redraw: false}
    });
  }
}

initialize();
start();

// For debugging:
// setTimeout(stop, 100);

var raf;
function iterate () {
  integrators[integration.method].steps(integration.stepsPerIter);
  redrawSolution();

  raf = requestAnimationFrame(iterate);
}

function start () {
  if (raf) return;
  raf = requestAnimationFrame(iterate);
}

function stop () {
  cancelAnimationFrame(raf);
  raf = null;
}

function startStop () {
  !!raf ? stop() : start();
}

function computePotentialAxisLimits () {
  var mag = Math.max(1000, Math.abs(potential.magnitude) * 1.5);
  return integration.probability ? [0, mag] : [-mag, mag];
}

function computeYAxisLimits () {
  return integration.probability ? [0, 1.5] : [-1.5, 1.5];
}

function computeXAxisLimits () {
  return [grid.xmin + pml.width, grid.xmax - pml.width];
}

function rescalePotentialAxis () {
  return Plotly.relayout(gd, {
    'yaxis2.range': computePotentialAxisLimits()
  });
}

function hideShowPotential () {
  if (potential.magnitude < 1e-4) {
    return Plotly.restyle(gd, {visible: [false]}, [4]);
  } else {
    return Plotly.restyle(gd, {visible: [true]}, [4]);
  }
}

function rescaleYAxis () {
  return Plotly.relayout(gd, {
    'yaxis.range': computeYAxisLimits()
  }).then(function () {
    if (integration.probability) {
      return Plotly.restyle(gd, {visible: [false, false]}, [1, 2]);
    } else {
      return Plotly.restyle(gd, {visible: [true, true]}, [1, 2]);
    }
  }).then(function () {
    if (integration.probability) {
      return Plotly.restyle(gd, {name: ['|𝜓|<sup>2</sup>']}, [3]);
    } else {
      return Plotly.restyle(gd, {name: ['|𝜓|']}, [3]);
    }
  });
}

Plotly.plot(gd, [
    {
      x: x.data,
      y: sigmaEval.data,
      fill: 'tozeroy',
      fillcolor: 'rgba(128, 128, 128, 0.2)',
      line: {width: 2, color: '#ccc', simplify: false},
      name: 'PML',
      hoverinfo: 'none',
      uid: 'sigma',
    },
    {
      x: x.data,
      y: pl.yr.data,
      line: {width: 1, color: 'blue', simplify: false},
      opacity: 0.75,
      name: 'Re(𝜓)',
      visible: !integration.probability,
      hoverinfo: 'none',
      uid: 'realpart',
    },
    {
      x: x.data,
      y: pl.yi.data,
      line: {width: 1, color: 'green', simplify: false},
      opacity: 0.75,
      visible: !integration.probability,
      name: 'Im(𝜓)',
      hoverinfo: 'none',
      uid: 'imagpart',
    },
    {
      x: x2.data,
      y: pl.ypabs.data,
      fill: 'toself',
      fillcolor: 'rgba(100, 150, 200, 0.4)',
      line: {width: 2, color: 'black', simplify: false},
      name: '|𝜓|<sup>2</sup>',
      hoverinfo: 'none',
      uid: 'posabs',
    },
    {
      x: x.data,
      y: V.data,
      fill: 'tozeroy',
      fillcolor: 'rgba(200, 50, 50, 0.2)',
      line: {width: 2, color: 'rgba(255,0,0,0.7)', simplify: false},
      name: 'Potential',
      visible: potential.magnitude > 1e-4,
      hoverinfo: 'none',
      yaxis: 'y2',
      uid: 'potential',
    },
  ],
  {
    xaxis: {
      range: computeXAxisLimits(),
    },
    yaxis: {
      range: computeYAxisLimits(),
    },
    yaxis2: {
      range: computePotentialAxisLimits(),
      overlaying: 'y',
      side: 'right'
    },
    legend: {
      xanchor: 'right',
      yanchor: 'top',
      x: 0.98,
      y: 0.98,
    },
    margin: {t: 30, r: 40, b: 40, l: 40},
    dragmode: 'pan',
  }, {
    scrollZoom: true,
  }
).then(onResize);

function onResize () {
  return Plotly.relayout(gd, {
    width: window.innerWidth - 300,
    height: window.innerHeight,
  });
}

window.addEventListener('resize', onResize);

control([
  {type: 'range', label: 'dt', min: 1e-5, max: 1e-3, initial: integration.dt},
  {type: 'range', label: 'stepsPerIter', min: 1, max: 20, initial: integration.stepsPerIter, step: 1},
  {type: 'select', label: 'method', options: ['euler', 'rk2', 'rk4'], initial: integration.method},
  {type: 'button', label: 'Reinitialize', action: reinitialize},
  {type: 'button', label: 'Start/Stop', action: startStop},
  {type: 'checkbox', label: 'probability', initial: integration.probability}
], {
  root: document.getElementById('simulation-control'),
  title: 'Simulation',
  theme: 'light',
}).on('input', function (data) {
  // console.log('CFL number = ', integration.dt / Math.pow((grid.xmax - grid.xmin) / (grid.n - 1), 2));
  extend(integration, data);
  integrators[integration.method].dt = data.dt;
  paramsToHash();
  computeComponents(pl.yr, pl.yi, pl.ypabs, yr, yi);
  rescaleYAxis().then(rescalePotentialAxis());
});


control([
  {type: 'range', label: 'center', min: grid.xmin, max: grid.xmax, initial: pulse.center, step: 0.01},
  {type: 'range', label: 'width', min: 0, max: 0.2, initial: pulse.width},
  {type: 'range', label: 'magnitude', min: 0, max: 1, initial: pulse.magnitude},
  {type: 'range', label: 'wavenumber', min: -400, max: 400, initial: pulse.wavenumber, step: 1},
], {
  root: document.getElementById('pulse-1-control'),
  title: 'Pulse 1',
  theme: 'light',
}).on('input', function (data) {
  extend(pulse, data);
  paramsToHash();
  reinitialize();
});

control([
  {type: 'range', label: 'center', min: grid.xmin, max: grid.xmax, initial: pulse2.center, step: 0.01},
  {type: 'range', label: 'width', min: 0, max: 0.2, initial: pulse2.width},
  {type: 'range', label: 'magnitude', min: 0, max: 1, initial: pulse2.magnitude},
  {type: 'range', label: 'wavenumber', min: -400, max: 400, initial: pulse2.wavenumber, step: 1},
], {
  root: document.getElementById('pulse-2-control'),
  title: 'Pulse 2',
  theme: 'light',
}).on('input', function (data) {
  extend(pulse2, data);
  paramsToHash();
  reinitialize();
});

control([
  {type: 'range', label: 'exponent', min: 0, max: 5, initial: pml.exponent},
  {type: 'range', label: 'width', min: 0, max: 1.1, initial: pml.width, step: 0.01},
  {type: 'range', label: 'gamma', min: 0, max: Math.PI * 0.5, initial: pml.gamma, steps: 101},
], {
  root: document.getElementById('pml-control'),
  title: 'Perfectly Matched Layer',
  theme: 'light',
}).on('input', function (data) {
  extend(pml, data);
  computePML();
  paramsToHash();
  return redrawExtras();
});

control([
  {type: 'range', label: 'center', min: grid.xmin, max: grid.xmax, initial: potential.center, step: 0.01},
  {type: 'range', label: 'width', min: 0, max: 1, initial: potential.width},
  {type: 'range', label: 'magnitude', min: 0, max: 1e4, initial: potential.magnitude, steps: 100},
  {type: 'range', label: 'exponent', min: 1, max: 50, initial: potential.exponent},
  {type: 'checkbox', label: 'inverted', initial: potential.inverted},
], {
  root: document.getElementById('potential-control'),
  title: 'Potential Barrier',
  theme: 'light',
}).on('input', function (data) {
  extend(potential, data);
  computePotential();
  paramsToHash();
  hideShowPotential().then(rescalePotentialAxis()).then(function () {
    return redrawExtras();
  });
});

function paramsFromHash () {
  try {
    var str = window.location.hash.replace(/^#/,'');
    if (str.length === 0) return;
    var parsed = qs.parse(str);
    var fields = ['pulse', 'pulse2', 'pml', 'potential', 'integration'];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var fieldData = parsed[field];
      var fieldConfig = simulationConfig[field];
      if (!fieldConfig) continue;
      try {
        var fieldValue = JSON.parse(fieldData);
        extend(simulationConfig[field], fieldValue);
      } catch (e) {
        console.warn(e);
      }
    }
  } catch(e) {
    console.warn(e);
  }
}

function paramsToHash () {
  var params = qs.stringify({
    pulse: JSON.stringify(pulse),
    pulse2: JSON.stringify(pulse2),
    pml: JSON.stringify(pml),
    integration: JSON.stringify(integration),
    potential: JSON.stringify(potential),
  });

  window.location.hash = params;
}

