// It's a bit of bookkeeping to change the number of traces,
// so you have to change the number of particles here:
var n = 3;

// Timestep constraints to keep things reasonable:
var dtMin = 2e-7;
var dtMax = 0.1;

var maxExtent = 30;    // Stop when a particle gets this far away
var plotExtent = 10;   // Max plotted range
var searchExtent = 10; // Search for trajectories within this range

// Periodic 3-body orbits from: http://three-body.ipb.ac.rs/
// Web gallery contains data from:
// [1] R. Broucke and D. Boggs, Periodic orbits in the Planar General Three-Body Problem, Celest. Mech. 11, 13 (1975).
// [2] M. Henon, Families of periodic orbits in the three-body problem, Celest. Mech. 10, 375 (1974).
// [3] R. Broucke, On relative periodic solutions of the planar general three-body problem, Celest. Mech. 12, 439 (1975).
// [4] M. Henon, A family of periodic solutions of the planar three-body problem, and their stability, Celest. Mech. 13, 267 (1976).
// [5] M. Henon, Stability of interplay motions, Celest. Mech. 15, 243 (1977).
// [6] C. Moore, Braids in classical gravity, Phys. Rev. Lett. 70, 3675 (1993).
// [7] A. Chenciner, R. Montgomery, A remarkable periodic solution of the three-body problem in the case of equal masses, Ann. Math. 152, 881 (2000).
// [8] M. Šuvakov and V. Dmitrašinović, Three Classes of Newtonian Three-Body Planar Periodic Orbits, Phys. Rev. Lett. 110, 114301 (2013). arXiv:1303.0181
// [9] M. Šuvakov, Numerical Search for Periodic Solutions in the Vicinity of the Figure-Eight Orbit: Slaloming around Singularities on the Shape Sphere, Celest. Mech. Dyn. Astron. 119, 369 (2014). arXiv:1312.7002
// [10] M. Šuvakov and M. Shibayama, Three topologically nontrivial choreographic motions of three bodies, Celest. Mech. Dyn. Astron. 124, 155 (2016).
// [11] V. Dmitrašinović, A. Hudomal, M. Shibayama, A. Sugita, Newtonian Periodic Three-Body Orbits with Zero Angular Momentum: Linear Stability and Topological Dependence of the Period, arXiv:1705.03728

var a1 = 0.464445;
var a2 = 0.396060;
var b1 = 0.282699;
var b2 = 0.327209;
var c1 = 0.347111;
var c2 = 0.532728;
var d1 = 0.080584;
var d2 = 0.588836;
var e1 = 0.383444;
var e2 = 0.377364;
var f1 = 0.513938;
var f2 = 0.304736;
var g1 = 0.282699;
var g2 = 0.327209;
var h1 = 0.416822;
var h2 = 0.330333;
var i1 = 0.417343;
var i2 = 0.313100;
var j1 = 0.080584;
var j2 = 0.588836;
var presets = {
  eight: [-1,0,0,c1,c2,0, 1,0,0,c1,c2,0, 0,0,0,-2*c1,-2*c2,0],
  moth1: [-1,0,0,a1,a2,0, 1,0,0,a1,a2,0, 0,0,0,-2*a1,-2*a2,0],
  moth2: [-1,0,0,b1,b2,0, 1,0,0,b1,b2,0, 0,0,0,-2*b1,-2*b2,0],
  moth3: [-1,0,0,e1,e2,0, 1,0,0,e1,e2,0, 0,0,0,-2*e1,-2*e2,0],
  dragonfly: [-1,0,0,d1,d2,0, 1,0,0,d1,d2,0, 0,0,0,-2*d1,-2*d2,0],
  yinyang1a: [-1,0,0,f1,f2,0, 1,0,0,f1,f2,0, 0,0,0,-2*f1,-2*f2,0],
  yinyang1b: [-1,0,0,g1,g2,0, 1,0,0,g1,g2,0, 0,0,0,-2*g1,-2*g2,0],
  yinyang2a: [-1,0,0,h1,h2,0, 1,0,0,h1,h2,0, 0,0,0,-2*h1,-2*h2,0],
  yinyang2b: [-1,0,0,i1,i2,0, 1,0,0,i1,i2,0, 0,0,0,-2*i1,-2*i2,0],
  BrouckeA1: [-0.9892620043,0.0000000000, 0,
    0.0000000000,1.9169244185, 0,
    2.2096177241,0.0000000000, 0,
    0.0000000000,0.1910268738, 0,
    -1.2203557197,0.0000000000, 0,
    0.0000000000,-2.1079512924, 0],
  BrouckeA2: [0.3361300950,0.0000000000, 0,
    0.0000000000,1.5324315370, 0,
    0.7699893804,0.0000000000, 0,
    0.0000000000,-0.6287350978, 0,
    -1.1061194753,0.0000000000, 0,
    0.0000000000,-0.9036964391, 0],
  BrouckeA3: [0.3149337497,0.0000000000, 0,
    0.0000000000,1.4601869417, 0,
    0.8123820710,0.0000000000, 0,
    0.0000000000,-0.5628292375, 0,
    -1.1273158206,0.0000000000, 0,
    0.0000000000,-0.8973577042, 0],
  BrouckeA4: [0.2843198916,0.0000000000, 0,
    0.0000000000,1.3774179570, 0,
    0.8736097872,0.0000000000, 0,
    0.0000000000,-0.4884226932, 0,
    -1.1579296788,0.0000000000, 0,
    0.0000000000,-0.8889952638, 0],
  BrouckeA5: [0.2355245585,0.0000000000, 0,
    0.0000000000,1.2795329643, 0,
    0.9712004534,0.0000000000, 0,
    0.0000000000,-0.4021329019, 0,
    -1.2067250118,0.0000000000, 0,
    0.0000000000,-0.8774000623, 0],
  BrouckeA6: [0.1432778606,0.0000000000, 0,
    0.0000000000,1.1577475241, 0,
    1.1556938491,0.0000000000, 0,
    0.0000000000,-0.2974667752, 0,
    -1.2989717097,0.0000000000, 0,
    0.0000000000,-0.8602807489, 0],
  BrouckeA7: [-0.1095519101,0.0000000000, 0,
    0.0000000000,0.9913358338, 0,
    1.6613533905,0.0000000000, 0,
    0.0000000000,-0.1569959746, 0,
    -1.5518014804,0.0000000000, 0,
    0.0000000000,-0.8343398592, 0],
  BrouckeA8: [0.1979259967,0.0000000000, 0,
    0.0000000000,1.2224733132, 0,
    1.0463975768,0.0000000000, 0,
    0.0000000000,-0.3527351133, 0,
    -1.2443235736,0.0000000000, 0,
    0.0000000000,-0.8697381999, 0],
  BrouckeA9: [0.0557080334,0.0000000000, 0,
    0.0000000000,1.0824099428, 0,
    1.3308335036,0.0000000000, 0,
    0.0000000000,-0.2339059386, 0,
    -1.3865415370,0.0000000000, 0,
    0.0000000000,-0.8485040042, 0],
  BrouckeA10: [-0.5426216182,0.0000000000, 0,
    0.0000000000,0.8750200467, 0,
    2.5274928067,0.0000000000, 0,
    0.0000000000,-0.0526955841, 0,
    -1.9848711885,0.0000000000, 0,
    0.0000000000,-0.8223244626, 0],
  BrouckeA11: [0.0132604844,0.0000000000, 0,
    0.0000000000,1.0541519210, 0,
    1.4157286016,0.0000000000, 0,
    0.0000000000,-0.2101466639, 0,
    -1.4289890859,0.0000000000, 0,
    0.0000000000,-0.8440052572, 0],
  BrouckeA12: [-0.3370767020,0.0000000000, 0,
    0.0000000000,0.9174260238, 0,
    2.1164029743,0.0000000000, 0,
    0.0000000000,-0.0922665014, 0,
    -1.7793262723,0.0000000000, 0,
    0.0000000000,-0.8251595224, 0],
  BrouckeA13: [-0.8965015243,0.0000000000, 0,
    0.0000000000,0.8285556923, 0,
    3.2352526189,0.0000000000, 0,
    0.0000000000,-0.0056478094, 0,
    -2.3387510946,0.0000000000, 0,
    0.0000000000,-0.8229078829, 0],
  BrouckeA14: [-0.2637815221,0.0000000000, 0,
    0.0000000000,0.9371630895, 0,
    1.9698126146,0.0000000000, 0,
    0.0000000000,-0.1099503287, 0,
    -1.7060310924,0.0000000000, 0,
    0.0000000000,-0.8272127608, 0],
  BrouckeA15: [-1.1889693067,0.0000000000, 0,
    0.0000000000,0.8042120498, 0,
    3.8201881837,0.0000000000, 0,
    0.0000000000, 0.0212794833, 0,
    -2.6312188770,0.0000000000, 0,
    0.0000000000,-0.8254915331, 0],
  BrouckeA16: [-0.7283341038,0.0000000000, 0,
    0.0000000000,0.8475982451, 0,
    2.8989177778,0.0000000000, 0,
    0.0000000000,-0.0255162097, 0,
    -2.1705836741,0.0000000000, 0,
    0.0000000000,-0.8220820354, 0],
  BrouckeR1: [ 0.8083106230,0.0000000000, 0,
    0.0000000000,0.9901979166, 0,
    -0.4954148566,0.0000000000, 0,
    0.0000000000,-2.7171431768, 0,
    -0.3128957664,0.0000000000, 0,
    0.0000000000,1.7269452602, 0],
  BrouckeR2: [0.9060893715,0.0000000000, 0,
    0.0000000000,0.9658548899, 0,
    -0.6909723536,0.0000000000, 0,
    0.0000000000,-1.6223214842, 0,
    -0.2151170179,0.0000000000, 0,
    0.0000000000,0.6564665942, 0],
  BrouckeR3: [0.8920281421,0.0000000000, 0,
    0.0000000000,0.9957939373, 0,
    -0.6628498947,0.0000000000, 0,
    0.0000000000,-1.6191613336, 0,
    -0.2291782474,0.0000000000, 0,
    0.0000000000,0.6233673964, 0],
  BrouckeR4: [0.8733047091,0.0000000000, 0,
    0.0000000000,1.0107764436, 0,
    -0.6254030288,0.0000000000, 0,
    0.0000000000,-1.6833533458, 0,
    -0.2479016803,0.0000000000, 0,
    0.0000000000,0.6725769022, 0],
  BrouckeR5: [0.8584630769,0.0000000000, 0,
    0.0000000000,1.0204773541, 0,
    -0.5957197644,0.0000000000, 0,
    0.0000000000,-1.7535566440, 0,
    -0.2627433125,0.0000000000, 0,
    0.0000000000,0.7330792899, 0],
  BrouckeR6: [0.8469642946,0.0000000000, 0,
    0.0000000000,1.0275065708, 0,
    -0.5727221998,0.0000000000, 0,
    0.0000000000,-1.8209307202, 0,
    -0.2742420948,0.0000000000, 0,
    0.0000000000,0.7934241494, 0],
  BrouckeR7: [0.8378824453,0.0000000000, 0,
    0.0000000000,1.0329242005, 0,
    -0.5545585011,0.0000000000, 0,
    0.0000000000,-1.8840083393, 0,
    -0.2833239442,0.0000000000, 0,
    0.0000000000,0.8510841387, 0],
  BrouckeR8: [0.8871256555,0.0000000000, 0,
    0.0000000000,0.9374933545, 0,
    -0.6530449215,0.0000000000, 0,
    0.0000000000,-1.7866975426, 0,
    -0.2340807340,0.0000000000, 0,
    0.0000000000,0.8492041880, 0],
  BrouckeR9: [0.9015586070,0.0000000000, 0,
    0.0000000000,0.9840575737, 0,
    -0.6819108246,0.0000000000, 0,
    0.0000000000,-1.6015183264, 0,
    -0.2196477824,0.0000000000, 0,
    0.0000000000,0.6174607527, 0],
  BrouckeR10: [0.8822391241,0.0000000000, 0,
    0.0000000000,1.0042424155, 0,
    -0.6432718586,0.0000000000, 0,
    0.0000000000,-1.6491842814, 0,
    -0.2389672654,0.0000000000, 0,
    0.0000000000,0.6449418659, 0],
  BrouckeR11: [0.8983487470,0.0000000000, 0,
    0.0000000000,0.9475564971, 0,
    -0.6754911045,0.0000000000, 0,
    0.0000000000,-1.7005860354, 0,
    -0.2228576425,0.0000000000, 0,
    0.0000000000,0.7530295383, 0],
  BrouckeR12: [0.9040866398,0.0000000000, 0,
    0.0000000000,0.9789534005, 0,
    -0.6869668901,0.0000000000, 0,
    0.0000000000,-1.6017790202, 0,
    -0.2171197497,0.0000000000, 0,
    0.0000000000,0.6228256196, 0],
  BrouckeR13: [0.9017748598,0.0000000000, 0,
    0.0000000000,0.9526089117, 0,
    -0.6823433302,0.0000000000, 0,
    0.0000000000,-1.6721104565, 0,
    -0.2194315296,0.0000000000, 0,
    0.0000000000,0.7195015448, 0],
  Henon2: [-1.0207041786,0.0000000000, 0,
    0.0000000000,9.1265693140, 0,
    2.0532718983,0.0000000000, 0,
    0.0000000000,0.0660238922, 0,
    -1.0325677197,0.0000000000, 0,
    0.0000000000,-9.1925932061, 0],
  Henon3: [-0.9738300580,0.0000000000, 0,
    0.0000000000,4.3072892019, 0,
    1.9988948637,0.0000000000, 0,
    0.0000000000,0.1333821680, 0,
    -1.0250648057,0.0000000000, 0,
    0.0000000000,-4.4406713699, 0],
  Henon42: [1.1593879407,0.0000000000, 0,
    0.0000000000,1.1787714143, 0,
    1.7740754142,0.0000000000, 0,
    0.0000000000,-0.6271771385, 0,
    -2.9334633549,0.0000000000, 0,
    0.0000000000,-0.5515942758, 0]
}

/*
var v0 = -1
var v1 = 0.19
var r0 = 0.5;
var v2 = 0.5;
presets.custom = [
  -1, 0, 0,    0, v0, 0,
  0.5, 0, -r0,  0, v2 + v1, 0,
  0.5, 0, r0,  0, v2 - v1, 0
]*/

var gd = document.getElementById('graph');
var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];

var search = false;
var randomizeBtn = document.getElementById('randomize');
randomizeBtn.addEventListener('click', function () {
  seedField.value = randomstring.generate({length: 5})
  presetField.value = '';
  search = false;
  rerun();
})

/*
var searchBtn = document.getElementById('search');
searchBtn.addEventListener('click', function () {
  seedField.value = randomstring.generate({length: 5})
  presetField.value = '';
  search = true;
  rerun();
})*/

var tolField = document.getElementById('tol');
tolField.addEventListener('change', rerun);

var dtField = document.getElementById('dt');
dtField.addEventListener('change', rerun);

/*
var displayFields = document.querySelectorAll('input[name=display]');
displayFields[0].addEventListener('click', rerun);
displayFields[1].addEventListener('click', rerun);*/

function getDisplayMode () {
  return 'adaptive';
  /*for (var i = 0; i < displayFields.length; i++) {
    if (displayFields[i].checked) return displayFields[i].value;
  }*/
}

var animateRaf;
var animateField = document.getElementById('animate');
function isAnimating () {
  return animate.checked;
}

function setMarkerVisibility (visible) {
  var update = {visible: new Array(n).fill(!!visible)};
  var idx = new Array(n).fill(0).map((d, i) => i + n);
  Plotly.restyle(gd, update, idx);
}

animateField.addEventListener('click', function () {
  if (isAnimating()) {
    setMarkerVisibility(true);
    if (!animateRaf) {
      frame();
    }
  } else {
    setMarkerVisibility(false);
    if (animateRaf) {
      cancelAnimationFrame(animateRaf);
      animateRaf = null;
    }
  }
});

var presetField = document.getElementById('preset');
presetField.addEventListener('change', function () {
  if (!presetField.value) return;
  seedField.value = presetField.value;
  search = false;
  rerun();
});

var tmaxField = document.getElementById('tmax');
tmaxField.addEventListener('change', rerun);

var seedField = document.getElementById('seed');
seedField.addEventListener('blur', rerun);

function randomInitialConditions (n, seed) {
  var i, j;
  var rand = seedRandom(seed)
  var y;
  if (presets[seed]) {
    y = presets[seed].slice();
    for (i = y.length; i < n * 3 * 2; i++) {
      y[i] = 2.0 * rand() - 1.0;
    }
  } else {
    y = new Array(n * 3 * 2).fill(0);
    for (i = 0; i < n * 6; i += 6) {
      // Position:
      y[i] = (rand() * 2.0 - 1.0);
      y[i + 1] = (rand() * 2.0 - 1.0);
      y[i + 2] = (rand() * 2.0 - 1.0);

      // Velocity:
      y[i + 3] = (rand() * 2.0 - 1.0);
      y[i + 4] = (rand() * 2.0 - 1.0);
      y[i + 5] = (rand() * 2.0 - 1.0);
    }
  }

  // Subtract off the average position + momentum:
  var x = [0, 0, 0, 0, 0, 0]
  for (i = 0; i < n * 6; i += 6) {
    for (j = 0; j < 6; j++) {
      x[j] += y[i + j];
    }
  }
  for (i = 0; i < n * 6; i+=6) {
    for (j = 0; j < 6; j++) {
      y[i + j] -= x[j] / n;
    }
  }

  return y;
}

function run (n) {
  function dydt (yp, y) {
    for (var i = 0; i < n * 6; i += 6) {
      yp[i] = y[i + 3];
      yp[i + 1] = y[i + 4];
      yp[i + 2] = y[i + 5];
      yp[i + 3] = yp[i + 4] = yp[i + 5] = 0;
      for (var j = 0; j < n * 6; j += 6) {
        if (i === j) continue;
        var rx = y[j] - y[i];
        var ry = y[j + 1] - y[i + 1];
        var rz = y[j + 2] - y[i + 2];
        var r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
        yp[i + 3] += rx / r3;
        yp[i + 4] += ry / r3;
        yp[i + 5] += rz / r3;
      }
    }
  }

  // If searching, then try random trajectories until one stays
  // within reasonable bounds the whole time.
  var searching = true;
  while (searching) {
    var i, j;
    var y = randomInitialConditions(n, seed.value);
    var y0 = y.slice();
    var dt = parseFloat(dtField.value);
    var integrator = ode45CashKarp(y, dydt, 0, dt, {
      verbose: false,
      dtMinMag: dtMin,
      dtMaxMag: dtMax,
      tol: parseFloat(tolField.value)
    });

    var traces = new Array(n).fill(0).map((d, i) => ({
      type: plotdim === 3 ? 'scatter3d' : 'scatter',
      mode: 'lines',
      opacity: plotdim === 2 ? 0.6 : 0.7,
      hoverinfo: 'skip',
      showlegend: false,
      x: [],
      y: [],
      z: [],
      line: {color: colors[i % colors.length], width: plotdim === 2 ? 1 : null}
    })).concat(new Array(n).fill(0).map((d, i) => ({
      type: plotdim === 3 ? 'scatter3d' : 'scatter',
      mode: 'markers',
      showlegend: false,
      x: [],
      y: [],
      z: [],
      marker: {size: 7, color: colors[i % colors.length]}
    })));

    var extent = 0;
    var tmax = parseFloat(tmaxField.value);
    var dt = parseFloat(dtField.value)
    var step = 0;
    var steps = Math.round(tmax / dt);
    var maxSteps = 100000;
    var isAdaptive = getDisplayMode() === 'adaptive';
    while (integrator.t < tmax && steps++ < maxSteps) {
      if (isAdaptive) {
        integrator.steps(10, integrator.t + dt * 10);
      } else {
        integrator.steps(1000, integrator.t + dt);
      }
      for (j = 0; j < n; j++) {
        traces[j].x.push(y[6 * j]);
        traces[j].y.push(y[6 * j + 1]);
        traces[j].z.push(y[6 * j + 2]);

        extent = Math.max(extent,
          Math.abs(y[j * 6]),
          Math.abs(y[j * 6 + 1]),
          Math.abs(y[j * 6 + 2])
        );
      }
      if (extent >= maxExtent) break;
    }
    if (search) {
      if (extent < searchExtent) {
        searching = false;
      } else {
        seedField.value = randomstring.generate({length: 5})
      }
    } else {
      searching = false;
    }
  }
  search = false;

  var animationIntegrator = ode45CashKarp(y0, dydt, 0, dt, {
    verbose: false,
    dtMinMag: dtMin,
    dtMaxMag: dtMax,
    tol: parseFloat(tolField.value)
  });

  return {
    data: traces,
    extent: Math.min(plotExtent, extent),
    frameStepper: function () {
      var dt = parseFloat(dtField.value);
      animationIntegrator.steps(100, animationIntegrator.t + dt);
      return animationIntegrator.y;
    }
  };
}

var output = run(n);
var frameStepper = output.frameStepper;
var rng = output.extent;
Plotly.plot(gd, {
  data: output.data,
  layout: {
    margin: {t: 0, r: 0, l: 0, b: 0},
    width: window.innerWidth,
    height: window.innerHeight,
    xaxis: {
      range: [-rng, rng],
      scaleanchor: 'y',
      scaleratio: 1,
      autorange: false,
    },
    yaxis: {
      range: [-rng, rng],
      scaleanchor: 'x',
      scaleratio: 1,
      autorange: false,
    },
    scene: {
      aspectmode: 'cube',
      aspectratio: {x: 1, y: 1, z: 1},
      xaxis: {range: [-rng, rng]},
      yaxis: {range: [-rng, rng]},
      zaxis: {range: [-rng, rng]},
      camera: {eye: {x: 1, y: 1, z: 1}}
    },
    hovermode: 'closest',
  }
});

function frame () {
  if (frameStepper) {
    var yt = frameStepper();

    var update = {x: [], y: [], z: []};
    var idx = [];
    for (var i = 0, j = n; i < yt.length; i += 6, j++) {
      update.x.push([yt[i]]);
      update.y.push([yt[i + 1]]);
      update.z.push([yt[i + 2]]);
      idx.push(j);
    }
    Plotly.animate(gd, [{
      data: new Array(n).fill(0).map((d, i) => ({
        x: update.x[i],
        y: update.y[i],
        z: update.z[i],
      })),
      traces: idx
    }], {
      mode: 'immediate',
      frame: {duration: 0, redraw: false}
    });
  }
  animateRaf = requestAnimationFrame(frame);
}
if (isAnimating()) {
  animateRaf = requestAnimationFrame(frame);
}

function rerun () {
  var output = run(n);
  var rng = output.extent;
  var y = output.data;
  frameStepper = output.frameStepper
  var update = {x: [], y: [], z: []};
  var idx = [];
  for (var i = 0; i < y.length; i++) {
    update.x.push(y[i].x);
    update.y.push(y[i].y);
    update.z.push(y[i].z);
    idx.push(i)
  }

  Plotly.update(gd, update, {
    'scene.xaxis.range': [-rng, rng],
    'scene.yaxis.range': [-rng, rng],
    'scene.zaxis.range': [-rng, rng],
  }, idx);
}

window.addEventListener('resize', function () {
  Plotly.relayout(gd, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
});
