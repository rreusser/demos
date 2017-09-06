vec3 u0 (vec2 xy) {
  return vec3(0.0);
  //vec2 r = xy - vec2(0.0, -0.75);
  //float r2 = dot(r, r);
  //return vec3(0.0, 0.0, 100.0 / (1.0 + 400.0 * r2));
}

#pragma glslify: export(u0)
