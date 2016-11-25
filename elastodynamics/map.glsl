#define M_PI 3.1415926535897932384626433832795

#pragma glslify: domainColoring = require(glsl-domain-coloring)

precision mediump float;
uniform float cmax;
varying mediump float a, b;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float cosh (float x) {
  return 0.5 * (exp(x) + exp(-x));
}

float sinh (float x) {
  return 0.5 * (exp(x) - exp(-x));
}

void main () {
  float fr = sin(a) * cosh(b);
  float fi = cos(a) * sinh(b);

  gl_FragColor = domainColoring(fr, fi);
}
