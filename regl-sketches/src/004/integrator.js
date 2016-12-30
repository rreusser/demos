const glslify = require('glslify');
const swap = require('./swap');

module.exports = function (gpu) {
  const predictFirstPos = gpu.map({
    args: ['array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 v0, float t, float dt) {
        return y0 + yder(t, y0, v0) * dt;
      }
    `)
  });

  const predictFirstVel = gpu.map({
    args: ['array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 y0, vec4 v0, float t, float dt) {
        return v0 + vder(t, y0, v0) * dt;
      }
    `)
  });

  const predictPos = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 yn, vec4 vn, float t, float dt) {
        return y0 + yder(t, yn, vn) * dt;
      }
    `)
  });

  const predictVel = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 v0, vec4 yn, vec4 vn, float t, float dt) {
        return v0 + vder(t, yn, vn) * dt;
      }
    `)
  });

  const correctPos = gpu.map({
    args: ['array', 'array', 'array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 y1, vec4 y2, vec4 y3, vec4 v3, float t, float dt) {
        return (y1 + 2.0 * y2 + y3 - y0 + 0.5 * dt * yder(t, y3, v3)) / 3.0;
      }
    `)
  });

  const correctVel = gpu.map({
    args: ['array', 'array', 'array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 v0, vec4 v1, vec4 v2, vec4 y3, vec4 v3, float t, float dt) {
        return (v1 + 2.0 * v2 + v3 - v0 + 0.5 * dt * vder(t, y3, v3)) / 3.0;
      }
    `)
  });

  return function (state, params) {
    const y = state.y;
    const v = state.v;
    const t = params.t
    const dt = params.dt;
    predictFirstPos([y[1], y[0], v[0], t, dt * 0.5]);
    predictFirstVel([v[1], y[0], v[0], t, dt * 0.5]);
    predictPos([y[2], y[0], y[1], v[1], t + dt * 0.5, dt * 0.5]);
    predictVel([v[2], v[0], y[1], v[1], t + dt * 0.5, dt * 0.5]);
    predictPos([y[3], y[0], y[2], v[2], t + dt * 0.5, dt]);
    predictVel([v[3], v[0], y[2], v[2], t + dt * 0.5, dt]);
    correctPos([y[4], y[0], y[1], y[2], y[3], v[3], t + dt, dt]);
    correctVel([v[4], v[0], v[1], v[2], y[3], v[3], t + dt, dt]);
    swap(y, 0, 4);
    swap(v, 0, 4);

    params.t += params.dt;
  }
}
