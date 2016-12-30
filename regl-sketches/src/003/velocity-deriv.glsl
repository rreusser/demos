float sqr (float x) {
  return x * x;
}

float cube (float x) {
  return x * x * x;
}

vec4 deriv (vec4 y, vec4 v, float rs, float dilation) {
  float r = y.x;
  float phi = y.z;

  float vr = v.x;
  float vtheta = v.y;
  float vphi = v.z;
  float vt = v.w;

  float c2 = 1.0;

  float dil = 1.0 - rs / r * dilation;

  return vec4(
    rs * 0.5 / r / (r - rs) * vr * vr + (r - rs) * vphi * vphi + (r - rs) * sqr(sin(phi) * vtheta) + c2 * rs * (rs - r) * 0.5 / cube(r) * sqr(vt),
    -2.0 / r * vr * vtheta - 2.0 / tan(phi) * vphi * vtheta,
    -2.0 / r * vr * vphi + sin(phi) * cos(phi) * sqr(vtheta),
    rs / r / (rs - r) * vr * vt
  ) * dil;
}

#pragma glslify: export(deriv)
