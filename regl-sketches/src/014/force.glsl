vec3 force (vec2 xy, float T) {
  float r2 = length(xy - vec2(0.0, 0.0));
  return vec3(0.0, T * 10.1, 100.0 / (1.0 + 100.0 * r2));
}

#pragma glslify: export(force)
