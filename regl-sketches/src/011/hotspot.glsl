#pragma glslify: bump = require(./bump)

float hotspot (float noisemag) {
  return smoothstep(0.18, 0.22, noisemag);
}

#pragma glslify: export(hotspot)
