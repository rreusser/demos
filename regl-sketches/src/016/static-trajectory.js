const ode45 = require('ode45-cash-karp');

const dt = 0.01;
const dtMin = 2e-7;
const dtMax = 0.1;
const newtonsLaw = require('./newtons-law');

module.exports = function (y0, tmax, state, tol) {
  var i, j, k;
  const y = y0.slice();
  const n = y0.length;
  const paths = state.paths;
  const integrator = ode45(y, newtonsLaw, 0, dt, {
    verbose: true,
    dtMinMag: dtMin,
    dtMaxMag: dtMax,
    tol: tol || 1e-11
  });

  k = 0;
  var cnt = 0;
  while (integrator.t < tmax) {
    integrator.steps(5);

    for (i = 0, j = 0; i < n; i+=6, j++) {
      var pj = paths[j];
      pj.xyzData[k + 0] = y[i];
      pj.xyzData[k + 1] = y[i + 1];
      pj.xyzData[k + 2] = y[i + 2];

      pj.xyzData[k + 3] = y[i];
      pj.xyzData[k + 4] = y[i + 1];
      pj.xyzData[k + 5] = y[i + 2];

      pj.uvwData[k + 0] = y[i + 3];
      pj.uvwData[k + 1] = y[i + 4];
      pj.uvwData[k + 2] = y[i + 5];

      pj.uvwData[k + 3] = y[i + 3];
      pj.uvwData[k + 4] = y[i + 4];
      pj.uvwData[k + 5] = y[i + 5];
    }
    cnt++;

    k += 6;
  }

  state.updateBuffers(cnt);

  return state;
}
