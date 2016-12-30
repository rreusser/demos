vec4 deriv (vec4 y, vec4 v, float rs, float dilation) {
  float dil = 1.0 - rs / y.x * dilation;

  return v * dil;
}

#pragma glslify: export(deriv)
