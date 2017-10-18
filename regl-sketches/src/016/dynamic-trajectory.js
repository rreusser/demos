const ode45 = require('ode45-cash-karp');

const dtMin = 2e-7;
const dtMax = 0.1;
const tol = 1e-11;
const newtonsLaw = require('./newtons-law');

module.exports = function (y0, dt, state) {
  const y = y0.slice();
  const n = y0.length;

  const integrator = ode45(y, newtonsLaw, 0, dt, {
    verbose: false,
    dtMinMag: dtMin,
    dtMaxMag: dtMax,
    tol: tol
  });

  var data = new Float32Array(n / 6 * 3);

  return {
    step: function () {
      integrator.steps(Infinity, integrator.t + dt);

      var n = y0.length / 6;

      for (var i = 0; i < n; i++) {
        data[3 * i] = integrator.y[6 * i];
        data[3 * i + 1] = integrator.y[6 * i + 1];
        data[3 * i + 2] = integrator.y[6 * i + 2];
      }

      state.updateBuffers(data);
    }
  }
}
