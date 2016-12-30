const glslify = require('glslify');

module.exports = function (gpu) {
  return gpu.map({
    args: ['array'],
    body: glslify(`
      #pragma glslify: luma = require(glsl-luma)

      #define LUMA_MIN log(0.002)
      #define LUMA_MAX log(50.0)
      #define GAMMA 0.6

      vec4 compute (vec4 src) {
        float srcLuma = luma(src.xyz);

        float targetLuma = pow((log(srcLuma) - LUMA_MIN) / (LUMA_MAX - LUMA_MIN), 1.0 / GAMMA);
        return vec4(src.xyz * targetLuma / srcLuma, 1.0);
      }
    `)
  });
};
