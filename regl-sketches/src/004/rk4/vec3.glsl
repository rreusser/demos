vec3 rk4 (vec3 y, float dt, Data data) {
  vec3 y1 = y + 0.5 * dt * deriv(y, data);
  vec3 y2 = y + 0.5 * dt * deriv(y1, data);
  vec3 y3 = y + dt * deriv(y2, data);
  return (-y + y1 + 2.0 * y2 + y3 + 0.5 * dt * deriv(y3, data)) / 3.0;
}

#pragma glslify: export(rk4)
