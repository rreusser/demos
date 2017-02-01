#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

float falloff (float f) {
  //return f;
  return mix(f, 0.2, smoothstep(0.1, 0.5, f));
}

float noise (vec4 p, float t, float scale) {
  return 1.0 + falloff(scale * (pow(abs(snoise4(p)), 2.0) + 0.2 * sin(3.0 * p.y + 1.0 * t * 3.14159) * p.y));
}

#pragma glslify: export(noise)
