const glslify = require('glslify');
const swap = require('./swap');

module.exports = function (gpu) {
  const predictFirstPos = gpu.map({
    args: ['array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 v0, float dt, float rs, float dilation) {
        return y0 + yder(y0, v0, rs, dilation) * dt;
      }
    `)
  });

  const predictFirstVel = gpu.map({
    args: ['array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 y0, vec4 v0, float dt, float rs, float dilation) {
        return v0 + vder(y0, v0, rs, dilation) * dt;
      }
    `)
  });

  const predictPos = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 yn, vec4 vn, float dt, float rs, float dilation) {
        return y0 + yder(yn, vn, rs, dilation) * dt;
      }
    `)
  });

  const predictVel = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 v0, vec4 yn, vec4 vn, float dt, float rs, float dilation) {
        return v0 + vder(yn, vn, rs, dilation) * dt;
      }
    `)
  });

  const correctPos = gpu.map({
    args: ['array', 'array', 'array', 'array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: yder = require('./position-deriv')
      vec4 compute (vec4 y0, vec4 y1, vec4 y2, vec4 y3, vec4 v3, float dt, float rs, float dilation) {
        return (y1 + 2.0 * y2 + y3 - y0 + 0.5 * dt * yder(y3, v3, rs, dilation)) / 3.0;
      }
    `)
  });

  const correctVel = gpu.map({
    args: ['array', 'array', 'array', 'array', 'array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: vder = require('./velocity-deriv')
      vec4 compute (vec4 v0, vec4 v1, vec4 v2, vec4 y3, vec4 v3, float dt, float rs, float dilation) {
        return (v1 + 2.0 * v2 + v3 - v0 + 0.5 * dt * vder(y3, v3, rs, dilation)) / 3.0;
      }
    `)
  });

  return function (y, v, params) {
    // PREDICT 1
    // y[1] = y[0] + 0.5 * dt * R(v[0])
    predictFirstPos([y[1], y[0], v[0], params.dt * 0.5, params.rs, params.dilation]);

    // v[1] = v[0] + 0.5 * dt * R(y[0], v[0])
    predictFirstVel([v[1], y[0], v[0], params.dt * 0.5, params.rs, params.dilation]);

    // PREDICT 2
    // y[2] = y[0] + 0.5 * dt * R(v[1])
    predictPos([y[2], y[0], y[1], v[1], params.dt * 0.5, params.rs, params.dilation]);

    // v[2] = v[0] + 0.5 * dt * R(y[1], v[1])
    predictVel([v[2], v[0], y[1], v[1], params.dt * 0.5, params.rs, params.dilation]);

    // PREDICT 3
    // y[3] = y[0] + dt * R(v[2])
    predictPos([y[3], y[0], y[2], v[2], params.dt, params.rs, params.dilation]);

    // v[3] = v[0] + 0.5 * dt * R(y[1], v[1])
    predictVel([v[3], v[0], y[2], v[2], params.dt, params.rs, params.dilation]);

    correctPos([y[4], y[0], y[1], y[2], y[3], v[3], params.dt, params.rs, params.dilation]);
    correctVel([v[4], v[0], v[1], v[2], y[3], v[3], params.dt, params.rs, params.dilation]);

    swap(y, 0, 4);
    swap(v, 0, 4);
  }
}
