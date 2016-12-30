float flamm(float rs, float r) {
  return 2.0 * sqrt(rs * (r - rs));
}

#pragma glslify: export(flamm);
