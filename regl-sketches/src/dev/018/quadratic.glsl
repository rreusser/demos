vec2 roots (float a, float b, float c) {
  if (a == 0.0) {
    return vec2(-c / b);
  } else {
    float d = b * b - 4.0 * a * c;
    if (d == 0.0) {
      float root = -0.5 * b / a;
      return vec2(root, root);
    } else {
      float q = -0.5 * (b + sign(b) * sqrt(d));
      return vec2(q / a, c / q);
    }
  }
}

#pragma glslify: export(roots)
