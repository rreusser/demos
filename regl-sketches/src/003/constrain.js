const glslify = require('glslify');

module.exports = function (gpu, opts) {
  const copy = opts.copy;

  const constrainVelocity = gpu.map({
    args: ['array', 'array', 'scalar'],
    body: glslify(`
      #pragma glslify: metricDot = require('./metric-dot/diagonal');
      #pragma glslify: metric = require('./schwarzschild-metric');

      vec4 compute (vec4 y, vec4 v, float rs) {
        return -v / metricDot(metric(rs, y), v, v);
      }
    `)
  });

  return function (y, v, vtmp, opts) {
    copy([vtmp, v]);
    constrainVelocity([v, y, vtmp, opts.rs]);
  }
};
