float rk4 (float y, float dt) {
  float y1 = y + 0.5 * dt * deriv(y);
  float y2 = y + 0.5 * dt * deriv(y1);
  float y3 = y + dt * deriv(y2);
  return 0.333333333333333333 * (-y + y1 + 2.0 * y2 + y3 + 0.5 * dt * deriv(y3));
}

#pragma glslify: export(rk4)
