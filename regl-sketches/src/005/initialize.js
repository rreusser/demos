const glslify = require('glslify');

module.exports = function (gpu) {
  return gpu.map({
    args: ['array', 'scalar'],
    body: glslify(`
      #pragma glslify: noise = require(glsl-noise/simplex/2d)

      vec4 compute (vec4 p, float seed) {
        float z = (
            0.5 + 0.4 * (
              noise(p.xy + seed * 1.0) + //, vec2(4.0)) +
              0.5 * noise(p.xy * 2.0 - seed * 2.0) + //, vec2(8.0))
              0.05 * noise(p.yx * 4.0 - seed * 4.0) //, vec2(8.0))
            )
          ) *
          (1.0 + p.x) * (1.0 - p.x) * (1.0 + p.y) * (1.0 - p.y);
        return vec4(p.xy, z, 0);
      }
    `)
  });
}
