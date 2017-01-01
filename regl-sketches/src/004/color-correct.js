const glslify = require('glslify');

module.exports = function (gpu) {
  return gpu.map({
    args: ['array', 'scalar', 'scalar', 'scalar'],
    body: glslify(`
      #pragma glslify: luma = require(glsl-luma)
      vec4 compute (vec4 src, float gamma, float logLumaMin, float logLumaMax) {
        float srcLuma = luma(src.xyz);
        float targetLuma = pow((log(srcLuma) - logLumaMin) / (logLumaMax - logLumaMin), 1.0 / gamma);
        return vec4(src.xyz * targetLuma / srcLuma, 1.0);
      }
    `)
  });
};
