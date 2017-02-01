#pragma glslify: bump = require(./bump)

float hotspot (float noisemag) {
  return smoothstep(0.1, 0.12, noisemag);
}

#pragma glslify: export(hotspot)
