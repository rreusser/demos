vec2 rk4 (vec2 y, float dt) {
  vec2 y1 = y + 0.5 * dt * deriv(y);
  vec2 y2 = y + 0.5 * dt * deriv(y1);
  vec2 y3 = y + dt * deriv(y2);
  return 0.333333333333333333 * (-y + y1 + 2.0 * y2 + y3 + 0.5 * dt * deriv(y3));
}

#pragma glslify: export(rk4)
