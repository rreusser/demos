const glslify = require('glslify');

module.exports = function (gpu, opts) {
  const copy = opts.copy;

  const killPosition = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      vec4 compute (vec4 y0, vec4 y, vec4 v, float maxLife, float rs) {
        bool dead = y.w > maxLife || y.x < 0.0 || y.x > 1000.0 || y.x < rs || v.w < 0.0;
        return dead ? y0 : y;
      }
    `)
  });

  const killVelocity = gpu.map({
    args: ['array', 'array', 'array', 'scalar', 'scalar'],
    body: glslify(`
      vec4 compute (vec4 v0, vec4 y, vec4 v, float maxLife, float rs) {
        bool dead = y.w > maxLife || y.x < 0.0 || y.x > 1000.0 || y.x < rs || v.w < 0.0;
        return dead ? v0 : v;
      }
    `)
  });

  return function (y0, v0, y, v, ytmp, vtmp, opts) {
    copy([ytmp, y]);
    copy([vtmp, v]);

    killPosition([y, y0, ytmp, vtmp, opts.maxLife, opts.rs]);
    killVelocity([v, v0, ytmp, vtmp, opts.maxLife, opts.rs]);
  }
};
