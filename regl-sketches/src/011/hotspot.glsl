#pragma glslify: bump = require(./bump)

float hotspot (float noisemag) {
  return smoothstep(0.15, 0.17, noisemag);
}

#pragma glslify: export(hotspot)
