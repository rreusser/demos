vec4 schwarzschildMetric (float rs, vec4 y) {
  float r = y.x;
  float theta = y.y;
  float phi = y.z;
  float g = 1.0 - rs / r;
  float k = r * sin(phi);

  return vec4(
    1.0 / g,
    r * r,
    k * k,
    -g
  );
}

#pragma glslify: export(schwarzschildMetric)
